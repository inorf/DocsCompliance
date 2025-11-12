import { NextResponse } from 'next/server'
import textract from 'textract'
import { supabase } from '@/lib/supabase'

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
            
            // US: MM/DD/YYYY or MM-DD-YYYY
            /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
            
            // European: DD/MM/YYYY or DD-MM-YYYY  
            /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g, // Same pattern, we'll handle ambiguity later
            
            // Month names: January 15, 2024 or Jan 15, 2024
            /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
            
            // Month names: 15 January 2024 or 15 Jan 2024
            /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi,
            
            // Common phrases with dates
            /\b(?:until|till|by|before|after|on)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/gi,
        ]

        const allDates = []
        
        datePatterns.forEach(pattern => {
            const matches = text.match(pattern) || []
            allDates.push(...matches)
        })

        // Additional extraction for date ranges
        const rangePatterns = [
            // Date ranges: 2024-01-01 to 2024-12-31
            /(\d{4}-\d{2}-\d{2})\s+(?:to|until|through|-)\s+(\d{4}-\d{2}-\d{2})/gi,
            // January 1, 2024 - January 31, 2024
            /([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*(?:to|until|through|-)\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/gi
        ]

        rangePatterns.forEach(pattern => {
            const matches = text.matchAll(pattern)
            for (const match of matches) {
                if (match[1]) allDates.push(match[1])
                if (match[2]) allDates.push(match[2])
            }
        })

        // Remove duplicates
        const uniqueDates = [...new Set(allDates.map(date => date.trim()))]

        // Parse and validate dates
        const validDates = uniqueDates
            .map(dateStr => {
                try {
                    // Clean the date string
                    let cleanDate = dateStr
                        .replace(/\b(?:until|till|by|before|after|on)\s+/gi, '')
                        .replace(/[\(\)\[\]]/g, '')
                        .replace(/\bFY\s*/gi, '')
                        .replace(/\b(?:year|yr|annual|fiscal)\s+/gi, '')
                        .replace(/\s+(?:year|yr|annual|fiscal)\b/gi, '')
                        .trim()

                    // Handle quarter dates (convert to approximate date)
                    const quarterMatch = cleanDate.match(/\b(?:Q|Quarter)\s*([1-4])\s+(\d{4})\b/i)
                    if (quarterMatch) {
                        const quarter = parseInt(quarterMatch[1])
                        const year = parseInt(quarterMatch[2])
                        const month = (quarter - 1) * 3 + 1 // Q1=Jan, Q2=Apr, etc.
                        cleanDate = `${year}-${month.toString().padStart(2, '0')}-01`
                    }

                    const date = new Date(cleanDate)
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0]
                    }
                    return null
                } catch {
                    return null
                }
            })
            .filter(date => date !== null)
            .filter((date, index, self) => self.indexOf(date) === index) // Remove duplicate ISO dates

        return validDates

    } catch (error) {
        console.error('Date extraction error:', error)
        return []
    }
}