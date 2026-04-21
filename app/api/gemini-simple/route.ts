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

      // Get the model - using gemini-1.5-flash instead of gemini-pro
      // This is a more widely available model in the current API version
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Create a simple prompt
      const prompt = `You are a friendly AI assistant for elementary school students. 
        Keep your answers simple, educational, and age-appropriate for children ages 6-11.
        
        Question: ${userMessage}
        
        Your kid-friendly answer:`

      // Generate content with a simple prompt
      console.log("Sending simple request to Gemini API...")
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      console.log("Gemini API call successful")
      return NextResponse.json({ content: text })
    } catch (error: any) {
      console.error("Gemini API error:", error)

      // Check if this is a model-specific error
      if (
        error.message &&
        (error.message.includes("not found for API version") ||
          error.message.includes("is not supported") ||
          error.message.includes("models/"))
      ) {
        console.log("Model-specific error detected, trying alternative approach...")

        try {
          // Try with a different model as a fallback
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
          const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" })

          const prompt = `You are a friendly AI assistant for elementary school students. 
            Keep your answers simple, educational, and age-appropriate for children ages 6-11.
            
            Question: ${userMessage}
            
            Your kid-friendly answer:`

          const result = await model.generateContent(prompt)
          const response = await result.response
          const text = response.text()

          console.log("Alternative model API call successful")
          return NextResponse.json({ content: text })
        } catch (fallbackError) {
          console.error("Alternative model also failed:", fallbackError)
          apiErrorDetected = true
          return NextResponse.json({
            content: "I'm in training mode right now and can only give simple answers.",
            useBackup: true,
            error: error.message,
          })
        }
      }

      apiErrorDetected = true
      return NextResponse.json({
        content: "I'm in training mode right now and can only give simple answers.",
        useBackup: true,
        error: error.message,
      })
    }
  } catch (error) {
    console.error("Unexpected error in Gemini simple API:", error)
    apiErrorDetected = true
    return NextResponse.json({
      content: "I'm having a little trouble thinking right now. Let's try again in a moment!",
      useBackup: true,
    })
  }
}
