import { NextResponse } from "next/server"

// Flag to track if we've detected a quota exceeded error
let quotaExceeded = false

export async function POST(req: Request) {
  try {
    // If we already know the quota is exceeded, don't even try OpenAI
    if (quotaExceeded) {
      console.log("Skipping OpenAI API call due to known quota exceeded")
      return NextResponse.json({
        content: "I'm in training mode right now and can only give simple answers.",
        useBackup: true,
      })
    }

    console.log("Starting simple chat API call")

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set")
      return NextResponse.json({
        content: "API key not configured",
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
      return NextResponse.json({ content: "I couldn't understand your message. Could you try again?" })
    }

    // Add system message for kid-friendly responses
    const systemMessage = {
      role: "system",
      content:
        "You are Henry Squad AI, a friendly and helpful AI assistant for elementary school students. Keep your answers simple, educational, and age-appropriate for children ages 6-11.",
    }

    // Prepare the request to OpenAI
    const openaiMessages = [systemMessage, ...messages]

    try {
      // Make a direct fetch request to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 300,
        }),
      })

      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText)

        // Check specifically for quota exceeded error
        if (errorText.includes("insufficient_quota") || errorText.includes("exceeded your current quota")) {
          console.error("OpenAI API quota exceeded")
          quotaExceeded = true
          return NextResponse.json({
            content: "I'm in training mode right now and can only give simple answers.",
            useBackup: true,
          })
        }

        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      // Parse the response
      const data = await response.json()
      console.log("OpenAI API call successful")

      // Extract the content
      const content =
        data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : "I'm not sure how to answer that."

      // Return the response
      return NextResponse.json({ content })
    } catch (openaiError: any) {
      // Log the detailed OpenAI error
      console.error("OpenAI API error:", openaiError)

      // Return a friendly error message
      return NextResponse.json({
        content: "I'm having a little trouble thinking right now. Let's try again in a moment!",
        error: openaiError.message,
        useBackup: true,
      })
    }
  } catch (error: any) {
    // Log the detailed error
    console.error("Unexpected error in simple chat API:", error)

    // Return a friendly error message
    return NextResponse.json({
      content: "I'm having a little trouble thinking right now. Let's try again in a moment!",
      error: error.message,
      useBackup: true,
    })
  }
}
