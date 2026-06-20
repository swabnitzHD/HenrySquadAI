import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, userMessage } = await request.json()

    if (!userMessage) {
      return NextResponse.json(
        { error: "User message is required" },
        { status: 400 }
      )
    }

    // Simulate AI response with code block support
    let aiResponse = ""
    
    if (userMessage.toLowerCase().includes("code") || userMessage.toLowerCase().includes("function")) {
      aiResponse = `Here's a helpful code example for you:\n\n\`\`\`javascript\nfunction greet(name) {\n  return \"Hello, \" + name + \"!\";\n}\n\nconsole.log(greet(\"Henry\"));\n\`\`\`\n\nThis function takes a name and returns a greeting message!`
    } else {
      aiResponse = `That's a great question! I'd love to help. ${userMessage.length > 50 ? "Here's what I think..." : "Let me think about that..."}`
    }

    return NextResponse.json({
      content: aiResponse,
      success: true,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    )
  }
}
