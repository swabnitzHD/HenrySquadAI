import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { saveChatMessage, getChatSession } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("authToken")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { sessionId, messages, userMessage } = await request.json()

    if (!sessionId || !userMessage) {
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      )
    }

    // Save user message
    saveChatMessage(sessionId, "user", userMessage)

    // Generate AI response
    let aiResponse = generateAIResponse(userMessage)

    // Save AI response
    saveChatMessage(sessionId, "assistant", aiResponse)

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

function generateAIResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()

  // Code generation responses
  if (message.includes("code") || message.includes("function") || message.includes("javascript")) {
    return `Here's a helpful JavaScript code example for you:\n\n\`\`\`javascript\n// Function to calculate the sum of two numbers\nfunction add(a, b) {\n  return a + b;\n}\n\n// Example usage\nconst result = add(5, 10);\nconsole.log(result); // Output: 15\n\`\`\`\n\nThis is a simple addition function that takes two parameters and returns their sum. You can use it in your projects!`
  }

  if (message.includes("python")) {
    return `Here's a helpful Python code example for you:\n\n\`\`\`python\n# Function to calculate the sum of two numbers\ndef add(a, b):\n    return a + b\n\n# Example usage\nresult = add(5, 10)\nprint(result)  # Output: 15\n\`\`\`\n\nThis is a simple addition function in Python. It's great for beginners to learn about functions!`
  }

  // Math help
  if (message.includes("math") || message.includes("calculate")) {
    return `Great question about math! Let me help you out.\n\nFor basic math operations:\n- Addition: 5 + 10 = 15\n- Subtraction: 10 - 5 = 5\n- Multiplication: 5 × 10 = 50\n- Division: 10 ÷ 5 = 2\n\nWould you like help with a specific math problem?`
  }

  // Science help
  if (message.includes("science") || message.includes("biology") || message.includes("chemistry")) {
    return `That's a fantastic science question! 🔬\n\nScience is all about exploring and understanding how the world works. Here are some cool topics:\n- Biology: Study of living organisms\n- Chemistry: Study of matter and reactions\n- Physics: Study of energy and motion\n\nWhat specifically would you like to learn about?`
  }

  // Story/creative responses
  if (message.includes("story") || message.includes("tell me")) {
    return `Once upon a time, in a land far away, there was a curious student named Henry! 📚\n\nHenry loved learning new things and discovering amazing facts about the world. Every day brought new adventures and exciting challenges to solve.\n\nWhat kind of story would you like to hear?`
  }

  // Default helpful response
  return `That's a great question! I'm here to help you with homework, coding, math, science, stories, and so much more. 🌟\n\nFeel free to ask me anything, and I'll do my best to help you learn and have fun!\n\n💡 Pro tip: Try asking me to write code, solve math problems, or tell you interesting facts!`
}
