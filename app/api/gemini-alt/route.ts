import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Flag to track if we've detected an API error
let apiErrorDetected = false

export async function POST(req: Request) {
  try {
    // If we already know there's an API issue, don't try Gemini
    if (apiErrorDetected) {
      console.log("Skipping Gemini API call due to known API error")
      return NextResponse.json({
        content: "I'm in training mode right now and can only give simple answers.",
        useBackup: true,
      })
    }

    // Check if the API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set")
      apiErrorDetected = true
      return NextResponse.json({
        content: "I'm in training mode right now and can only give simple answers.",
        useBackup: true,
      })
    }

    // Extract the messages from the request
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
      apiErrorDetected = true
      return NextResponse.json({
        content: "I couldn't understand your message. Could you try again?",
        useBackup: true,
      })
    }

    try {
      // Initialize the Gemini API with the environment variable
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

      // List available models to debug
      try {
        console.log("Attempting to list available models...")
        const modelList = await genAI.getGenerativeModel({ model: "models/gemini-pro" }).listModels()
        console.log("Available models:", modelList)
      } catch (listError) {
        console.error("Error listing models:", listError)
      }

      // Try a direct API call approach
      console.log("Trying direct API call...")

      // Make a direct fetch request to the Gemini API
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are Henry Squad AI, a friendly and helpful AI assistant for elementary school students.
                    Keep your answers simple, educational, and age-appropriate for children ages 6-11.
                    Use clear, straightforward language and short sentences.
                    Be encouraging, positive, and patient.
                    
                    The student asks: ${userMessage}
                    
                    Your kid-friendly response:`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            },
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Direct API call successful")

      // Extract the content from the response
      const content =
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text
          ? data.candidates[0].content.parts[0].text
          : "I'm not sure how to answer that."

      return NextResponse.json({ content })
    } catch (error: any) {
      console.error("Gemini API error:", error)
      apiErrorDetected = true
      return NextResponse.json({
        content: "I'm in training mode right now and can only give simple answers.",
        useBackup: true,
        error: error.message,
      })
    }
  } catch (error) {
    console.error("Unexpected error in Gemini alt API:", error)
    apiErrorDetected = true
    return NextResponse.json({
      content: "I'm having a little trouble thinking right now. Let's try again in a moment!",
      useBackup: true,
    })
  }
}
