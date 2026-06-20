import { NextResponse, NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getChatSession, addMessage } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("authToken")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set")
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set" },
        { status: 500 }
      )
    }

    const { sessionId, messages, userMessage } = await req.json()

    // Verify session belongs to user
    const session = getChatSession(sessionId)
    if (!session || session.userId !== payload.userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Add user message to session
    addMessage(sessionId, "user", userMessage)

    const now = new Date()

    // Convert chat messages to Gemini format
    const contents = messages.map((msg: any) => ({
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
                  "Your owner and creator is Henry. If anyone asks who made you, who owns you, or who created you, always say Henry is your owner.",
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
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error: ${response.status}`, errorText)
      return NextResponse.json(
        { error: `Gemini API error: ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm not sure how to answer that."

    // Save assistant message to session
    addMessage(sessionId, "assistant", content)

    return NextResponse.json({ content }, { status: 200 })
  } catch (error: any) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
