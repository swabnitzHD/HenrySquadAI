import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set")
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    let messages: { role: string; content: string }[] = []
    try {
      const body = await req.json()
      messages = body.messages || []
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const now = new Date()

    // Convert chat messages to Gemini format
    const contents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: [
                  "You are Henry Squad AI, a friendly and helpful AI assistant for elementary school students.",
                  `CURRENT TIME: ${now.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })} Pacific Time.`,
                  `CURRENT DATE: ${now.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`,
                  "When asked about the time or date, use ONLY the values above. Do not guess.",
                  "Keep your answers simple, educational, and age-appropriate for children ages 6-11.",
                  "Use clear, straightforward language and short sentences.",
                  "Be encouraging, positive, and patient.",
                  "If you don't know something, say so honestly.",
                  "Always directly answer the question the student asks.",
                ].join("\n"),
              },
            ],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
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
    console.error("Gemini API error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 502 })
  }
}
