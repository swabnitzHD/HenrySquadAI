import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Flag to track if we've detected an API error
let apiErrorDetected = false

// List of models to try in order
const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro-vision"]

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

    console.log("Starting Gemini chat API call")

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
    let messages
    try {
      const body = await req.json()
      messages = body.messages || []
      console.log(`Processing ${messages.length} messages`)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({
        content: "I couldn't understand your message. Could you try again?",
        useBackup: true,
      })
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1].content

    // Initialize the Gemini API with the environment variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // Try each model in sequence until one works
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Trying model: ${modelName}...`)

        // Get the model
        const model = genAI.getGenerativeModel({ model: modelName })

        // System prompt for kid-friendly responses
        const prompt = `You are Henry Squad AI, a friendly and helpful AI assistant for elementary school students.
          Keep your answers simple, educational, and age-appropriate for children ages 6-11.
          Use clear, straightforward language and short sentences.
          Be encouraging, positive, and patient.
          If you don't know something, say so honestly.
          Never use inappropriate language or discuss mature topics.
          Include fun facts when relevant to make learning enjoyable.
          If asked about homework, provide guidance rather than direct answers.
          Respond with enthusiasm and warmth.
          
          The student asks: ${lastUserMessage}
          
          Your kid-friendly response:`

        // Generate content with a simple prompt
        console.log(`Sending request to Gemini API using model ${modelName}...`)
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log(`Gemini API call successful with model ${modelName}`)
        console.log("Response content:", text.substring(0, 50) + "...")

        // Return the response
        return NextResponse.json({ content: text })
      } catch (modelError: any) {
        console.error(`Error with model ${modelName}:`, modelError)
        // Continue to the next model
      }
    }

    // If we get here, all models failed
    console.error("All Gemini models failed")
    apiErrorDetected = true
    return NextResponse.json({
      content: "I'm in training mode right now and can only give simple answers.",
      useBackup: true,
      error: "All models failed",
    })
  } catch (error: any) {
    // Log the detailed error
    console.error("Unexpected error in Gemini chat API:", error)

    // Set the API error flag to true to avoid future attempts
    apiErrorDetected = true

    // Return a friendly error message
    return NextResponse.json({
      content: "I'm having a little trouble thinking right now. Let's try again in a moment!",
      error: error.message,
      useBackup: true,
    })
  }
}
