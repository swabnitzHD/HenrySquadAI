import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logged out" },
    { status: 200 }
  )

  response.cookies.set("authToken", "", {
    httpOnly: true,
    expires: new Date(0),
  })

  return response
}
