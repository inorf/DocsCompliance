import { NextResponse } from 'next/server'
import textract from 'textract'
import * as PDFParse from 'pdf-parse'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'
import { getSession } from '@/lib/session'

async function getAdmin(){ return getSupabaseAdmin() }

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
        let text = ''

        // Use server-side admin client to fetch contract metadata and file
        const supabaseAdmin = await getAdmin()
        const { data: contract, error: contractError } = await supabaseAdmin
            .from('contracts')
            .select('file_path, file_name')
            .eq('cont_id', contId)
            .single()

        if (contractError) {
            return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 })
        }

        const filePath = contract.file_path
        const storedName = contract.file_name || file_name

        const { data: downloadData, error: downloadError } = await supabaseAdmin.storage.from('contracts').download(filePath)
        if (downloadError || !downloadData) {
            return NextResponse.json({ success: false, error: 'Failed to download file from storage' }, { status: 500 })
        }

        const arrayBuffer = await downloadData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (fileExt === 'pdf') {
            const data = await PDFParse.default(buffer)
            text = data.text
        } else if (fileExt === 'docx' || fileExt === 'txt') {
            text = await new Promise((resolve, reject) => {
                textract.fromBufferWithName(buffer, storedName, (error, extractedText) => {
                    if (error) reject(error)
                    else resolve(extractedText)
                })
            })
        } else {
            return NextResponse.json({ success: false, error: `Unsupported file type: ${fileExt}` }, { status: 400 })
        }

        const extractedDates = extractDatesWithContext(text)

        return NextResponse.json({
            success: true,
            dates_found: extractedDates.length,
            extracted_dates: extractedDates,
            error: null
        })

    } catch (error) {
        console.error('Processing error:', error)
        return NextResponse.json(
            { success: false, error: error.message }, 
            { status: 500 }
        )
    }
}

function extractDatesWithContext(text) {
    try {
        // Comprehensive date regex patterns
        const datePatterns = [
            // ISO: YYYY-MM-DD
            /\b\d{4}-\d{2}-\d{2}\b/g,
            
            // YYYY/MM/DD
            /\b\d{4}\/\d{1,2}\/\d{1,2}\b/g,

            // US: MM/DD/YYYY or MM-DD-YYYY or European: DD/MM/YYYY or DD-MM-YYYY  
            /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
            
            // Month DD, YYYY
            /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
            
            // DD Month YYYY
            /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
        ]

        const datesWithContext = [];
        
        datePatterns.forEach(pattern => {
            let match;
            pattern.lastIndex = 0;
            
            while ((match = pattern.exec(text)) !== null) {
                const dateStr = match[0];
                const position = match.index;
                
                // Extract context between proper boundaries
                const context = extractContextBetweenBoundaries(text, position);
                const description = extractCleanDescription(text, position);
                
                datesWithContext.push({
                    date: dateStr,
                    description: description,
                    context: context
                });
            }
        });

        const uniqueDates = removeDuplicateDates(datesWithContext);
        return uniqueDates;
    } catch (error) {
        console.error('Date extraction error:', error);
        return [];
    }
}

function extractContextBetweenBoundaries(text, position) {
    // Look for the previous sentence end
    let start = position;
    while (start > 0) {
        if (text[start] === '.' || text[start] === '\n') {
            start = start + 1; // Start after the period/newline
            break;
        }
        start--;
    }
    start = Math.max(0, start);
    
    // Look for the next sentence end
    let end = position;
    while (end < text.length) {
        if (text[end] === '.' || text[end] === '\n') {
            end = end + 1; // Include the period/newline
            break;
        }
        end++;
    }
    
    const context = text.substring(start, end).trim();
    
    // Clean up - remove extra whitespace and normalize
    return context.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
}

function extractCleanDescription(text, position) {
    // Try to get the full sentence first
    const sentenceStart = findSentenceStart(text, position);
    const sentenceEnd = findSentenceEnd(text, position);
    
    let description = text.substring(sentenceStart, sentenceEnd).trim();
    
    // If sentence is too long, try to get a clause around the date
    if (description.length > 200) {
        description = extractContextBetweenBoundaries(text, position);
    }
    
    // Clean up whitespace
    description = description.replace(/\s+/g, ' ').trim();
    
    return description;
}

function findSentenceStart(text, position) {
    // Look backwards for sentence boundaries
    const boundaries = ['.', '!', '?', '\n'];
    let start = position;
    
    while (start > 0) {
        if (boundaries.includes(text[start])) {
            return start + 1; // Start after the boundary
        }
        start--;
    }
    
    return 0; // Beginning of text
}

function findSentenceEnd(text, position) {
    // Look forwards for sentence boundaries
    const boundaries = ['.', '!', '?', '\n'];
    let end = position;
    
    while (end < text.length) {
        if (boundaries.includes(text[end])) {
            return end + 1; // Include the boundary
        }
        end++;
    }
    
    return text.length; // End of text
}

function removeDuplicateDates(datesArray) {
    const seen = new Set();
    return datesArray.filter(dateObj => {
        const key = `${dateObj.date}-${dateObj.description.substring(0, 50)}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}