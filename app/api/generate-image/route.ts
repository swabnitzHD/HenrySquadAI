import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

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

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Generate random image URL based on prompt keywords
    const keywords = extractKeywords(prompt)
    const imageUrl = `https://picsum.photos/500/400?random=${Date.now()}&keywords=${keywords.join(",")}`

    return NextResponse.json({
      imageUrl,
      success: true,
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    )
  }
}

function extractKeywords(prompt: string): string[] {
  const keywords = prompt
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 3)
    .slice(0, 3)
  return keywords.length > 0 ? keywords : ["random"]
}
