import { NextResponse, NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("authToken")?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          userId: payload.userId,
          username: payload.username,
          role: payload.role,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 401 }
    )
  }
}
