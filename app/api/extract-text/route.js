import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
    try {
        const session = await getSession();
        const user = session.user;

        if (!user || !user.isLoggedIn) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { file_name, contId } = await request.json()
        if (!file_name || !contId) {
            return NextResponse.json({ success: false, error: 'File name and contract ID are required' }, { status: 400 })
        }

        const fileExt = file_name.split('.').pop().toLowerCase()

        const supportedTypes = ['txt', 'pdf', 'docx'];
        if (!supportedTypes.includes(fileExt)) {
            return NextResponse.json({ 
                success: false, 
                error: `Unsupported file type: ${fileExt}. Supported: ${supportedTypes.join(', ')}` 
            }, { status: 400 });
        }

        let text = ''
        // Use server-side admin client to fetch contract metadata and file
        const supabaseAdmin = await getSupabaseAdmin();
        const { data: contract, error: contractError } = await supabaseAdmin
            .from('contracts')
            .select('file_path')
            .eq('cont_id', contId)
            .single()

        if (contractError) {
            return NextResponse.json({ success: false, error: `Failed to find contract: ${contractError.message}` }, { status: 500 });
        }
        if (!contract) {
            return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 });
        }
        if (!contract.file_path) {
            return NextResponse.json({ success: false, error: 'No file path found for contract' }, { status: 404 });
        }

        const { data: downloadData, error: downloadError } = await supabaseAdmin.storage.from('contracts').download(contract.file_path)
        if (downloadError) {
            return NextResponse.json({ success: false, error: `Failed to download file: ${downloadError.message}` }, { status: 500 });
        }
        if(!downloadData) {
            return NextResponse.json({ success: false, error: 'Failed to download file from storage' }, { status: 500 });
        }
        
        // Use Blob.text() for text-based files
        if (fileExt === 'txt') {
            text = await downloadData.text();
        } else if (fileExt === 'pdf') {
            // Convert blob to array buffer for PDF parsing
            const arrayBuffer = await downloadData.arrayBuffer();
            try {
                let extractedText = '';
                // Use only pdf-parse-new for PDF extraction
                try {
                    const PDFParse = require('pdf-parse-new');
                    const buffer = Buffer.from(arrayBuffer);
                    const data = await PDFParse(buffer);
                    extractedText = data.text || '';
                    console.log('pdf-parse-new extracted:', extractedText.length, 'characters');
                } catch (pdfParseErr) {
                    console.warn('pdf-parse-new failed:', pdfParseErr.message);
                }
                // If no text extracted, return success with empty dates
                if (!extractedText || extractedText.trim().length === 0) {
                    console.log('No text could be extracted from PDF - may be image-based or encrypted');
                    return NextResponse.json({
                        success: true,
                        dates_found: 0,
                        extracted_dates: [],
                        text_sample: '',
                        warning: 'Could not extract text from this PDF. It may be image-based or encrypted. You can manually add dates in the form below.'
                    });
                }
                text = extractedText;
            } catch (pdfError) {
                console.error('PDF extraction error: ', pdfError);
                // Return success with empty dates instead of error
                // This allows users to continue with manual date entry
                return NextResponse.json({
                    success: true,
                    dates_found: 0,
                    extracted_dates: [],
                    text_sample: '',
                    warning: 'PDF extraction failed. You can manually add dates in the form below.'
                });
            }
        } else if (fileExt === 'docx') {
            try {
                const mammoth = await import('mammoth');
                const arrayBuffer = await downloadData.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } catch (docxError) {
                console.error('DOCX extraction failed: ', docxError);
                return NextResponse.json({ 
                    success: false, 
                    error: 'Failed to extract text from DOCX file: ' + docxError.message
                }, { status: 500 });
            }
        }

        if (text && text.trim().length > 0) {
            const extractedDates = extractDatesWithContext(text);

            return NextResponse.json({
                success: true,
                dates_found: extractedDates.length,
                extracted_dates: extractedDates,
                text_sample: text.substring(0, 200) + '...',
                error: null
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'No extractable text found in the file',
                dates_found: 0,
                extracted_dates: []
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Processing error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

function extractDatesWithContext(text) {
    try {
        const datePatterns = [
            // ISO: YYYY-MM-DD
            /\d{4}-\d{2}-\d{2}\b/g,
            
            // YYYY/MM/DD
            /\d{4}\/\d{1,2}\/\d{1,2}\b/g,

            // US: MM/DD/YYYY or MM-DD-YYYY
            /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
            
            // Month DD, YYYY (with optional comma)
            /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
            
            // DD Month YYYY
            /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
            
            // YYYY Month DD
            /\b\d{4}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}\b/gi,
        ];

        const datesWithContext = [];
        const seenDates = new Map(); // Track unique dates
        
        datePatterns.forEach(pattern => {
            let match;
            pattern.lastIndex = 0;
            
            while ((match = pattern.exec(text)) !== null) {
                const dateStr = match[0];
                const position = match.index;
                
                // Skip if we've already captured this exact date
                if (seenDates.has(dateStr)) {
                    continue;
                }
                
                const description = extractContextBetweenBoundaries(text, position, 150);
                const context = extractContextBetweenBoundaries(text, position, 80);
                
                // Add to seen dates
                seenDates.set(dateStr, true);
                
                datesWithContext.push({
                    date: dateStr,
                    description: description,
                    context: context
                });
            }
        });

        // Sort by date (most recent first)
        datesWithContext.sort((a, b) => {
            try {
                const dateA = parseDateString(a.date);
                const dateB = parseDateString(b.date);
                return dateB - dateA;
            } catch (e) {
                return 0;
            }
        });

        return datesWithContext;
    } catch (error) {
        console.error('Date extraction error:', error);
        return [];
    }
}

function parseDateString(dateStr) {
    // Try to parse various date formats
    try {
        // ISO format: YYYY-MM-DD
        if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            return new Date(dateStr).getTime();
        }
        // Other formats - let JavaScript try to parse
        return new Date(dateStr).getTime();
    } catch (e) {
        return 0;
    }
}

function extractContextBetweenBoundaries(text, position, maxLength = 200) {
    const boundaries = ['.', '!', '?', ';', '\n'];
    
    let start = position;
    while (start > 0 && (position - start) < maxLength/2) {
        if (boundaries.includes(text[start])) {
            start++;
            break;
        }
        start--;
    }
    start = Math.max(0, start);
    
    let end = position;
    while (end < text.length && (end - position) < maxLength/2) {
        if (boundaries.includes(text[end])) {
            break;
        }
        end++;
    }
    
    return text.substring(start, end).trim().replace(/\s+/g, ' ');
}