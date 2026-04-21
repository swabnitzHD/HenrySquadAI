import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    content: "Hello! I'm Henry Squad AI. How can I help you today?",
  })
}

export async function POST() {
  return NextResponse.json({
    content:
      "Thanks for your question! I'm a simple version of Henry Squad AI that gives the same response to everything. The full version is having some technical difficulties right now.",
  })
}
