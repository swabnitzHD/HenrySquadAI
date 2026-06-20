import { NextResponse } from "next/server"
import { authenticateUser, generateToken } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      )
    }

    const jwtPayload = authenticateUser(username, password)
    if (!jwtPayload) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const token = generateToken(jwtPayload)

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          userId: jwtPayload.userId,
          username: jwtPayload.username,
          role: jwtPayload.role,
        },
      },
      { status: 200 }
    )

    // Set secure cookie
    response.cookies.set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
