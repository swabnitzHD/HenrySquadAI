import { NextResponse } from "next/server"
import OpenAI from "openai"

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

export async function POST(req: Request) {
  try {
    console.log("Starting chat API call")

    // Check if API key is available and valid format
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set")
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set" },
        { status: 500 },
      )
    }

    // Log partial API key for debugging (safely)
    const apiKeyLength = process.env.OPENAI_API_KEY.length
    const lastFourChars = apiKeyLength > 4 ? process.env.OPENAI_API_KEY.slice(-4) : "****"
    console.log(`Using API key ending with: ${lastFourChars}, length: ${apiKeyLength}`)

    // Extract the messages from the request
    let messages
    try {
      const body = await req.json()
      messages = body.messages || []
      console.log(`Processing ${messages.length} messages`)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ content: "I couldn't understand your message. Could you try again?" })
    }

    // Add system message for kid-friendly responses
    const systemMessage = {
      role: "system" as const,
      content: `You are Henry Squad AI, a friendly and helpful AI assistant for elementary school students.
        Keep your answers simple, educational, and age-appropriate for children ages 6-11.
        Use clear, straightforward language and short sentences.
        Be encouraging, positive, and patient.
        If you don't know something, say so honestly.
        Never use inappropriate language or discuss mature topics.
        Include fun facts when relevant to make learning enjoyable.
        If asked about homework, provide guidance rather than direct answers.
        Respond with enthusiasm and warmth.`,
    }

    try {
      // Make a request to OpenAI with a simplified model and parameters
      console.log("Calling OpenAI API...")
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 300, // Reduced for faster responses
      })

      console.log("OpenAI API call successful")

      // Check if we have a valid response
      if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        const content = response.choices[0].message.content || "I'm not sure how to answer that."
        console.log("Response content:", content.substring(0, 50) + "...")

        // Return the response
        return NextResponse.json({ content })
      } else {
        console.error("OpenAI returned an empty or invalid response:", response)
        throw new Error("Empty response from OpenAI")
      }
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError.message)
      return NextResponse.json(
        { error: openaiError.message },
        { status: 502 },
      )
    }
  } catch (error: any) {
    console.error("Unexpected error in chat API:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    )
  }
}
