import { NextResponse } from 'next/server'
import textract from 'textract'
import PDFParse from 'pdf-parse'
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin'
import { getUser } from '../../../lib/auth'

async function getAdmin(){ return getSupabaseAdmin() }

export async function POST(request) {
    try {
        const { file_name, contId, userEmail } = await request.json()
        if (!file_name || !contId) {
            return NextResponse.json({ success: false, error: 'File name and contract ID are required' }, { status: 400 })
        }

        // Validate that the user exists and is authenticated
        if (!userEmail) {
            return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 })
        }
        
        const userData = await getUser(userEmail)
        if (!userData.success) {
            return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
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
            const data = await PDFParse(buffer)
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

        const extractedDates = extractDatesFromText(text)

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

function extractDatesFromText(text) {
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

        const allDates = []
        
        datePatterns.forEach(pattern => {
            const matches = text.match(pattern) || []
            allDates.push(...matches)
        })

        const uniqueDates = [...new Set(allDates)]

        return uniqueDates
    } catch (error) {
        console.error('Date extraction error:', error)
        return []
    }
}