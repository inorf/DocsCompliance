import { NextResponse } from 'next/server'
import textract from 'textract'

export async function POST(request) {
    try {
        const { fileUrl, contId } = await request.json()

        if (!fileUrl || !contId) return NextResponse.json({ success: false, error: 'File URL and contract ID are required' }, { status: 400 }) 

        const text = await new Promise((resolve, reject) => {
            textract.fromUrl(fileUrl, (error, text) => {
                if (error) reject(error)
                else resolve(text)
            })
        })

        const extractedDates = extractDatesFromText(text)

        if (extractedDates.length > 0) {
            return NextResponse.json({success:true, dates_found: extractedDates.length, extracted_dates: extractedDates, error: null})
        }
        
        return NextResponse.json({success:true, dates_found: 0, extracted_dates: [], error: null})
    } catch (error) {
        return NextResponse.json({success:false, error: error.message}, { status: 500 })
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