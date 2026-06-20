import { NextResponse, NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getChatSessions, createChatSession } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("authToken")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const sessions = getChatSessions(payload.userId)
    return NextResponse.json({ sessions }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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

    const { name } = await req.json()
    const session = createChatSession(payload.userId, name || "New Chat")

    return NextResponse.json({ session }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
