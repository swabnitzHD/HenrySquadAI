import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set")
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    let userMessage = ""
    try {
      const body = await req.json()
      const messages = body.messages || []
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === "user") {
        userMessage = lastMessage.content
      }
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `You are Henry Squad AI, a friendly and helpful AI assistant for elementary school students.
Keep your answers simple, educational, and age-appropriate for children ages 6-11.
Use clear, straightforward language and short sentences.
Be encouraging, positive, and patient.

The student asks: ${userMessage}

Your kid-friendly response:`

    console.log("Sending request to Gemini API...")
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Gemini API call successful")
    return NextResponse.json({ content: text })
  } catch (error: any) {
    console.error("Gemini simple API error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 502 })
  }
}
