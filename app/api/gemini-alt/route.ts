import { NextResponse } from "next/server"

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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
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
      console.error(`Gemini API error: ${response.status}`, errorText)
      return NextResponse.json({ error: `Gemini API error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to answer that."

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("Gemini alt API error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 502 })
  }
}
