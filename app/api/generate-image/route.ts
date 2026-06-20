import { NextResponse, NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

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

    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not set")
      return NextResponse.json(
        { error: "Image generation not configured" },
        { status: 500 }
      )
    }

    // Call Replicate API for image generation
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "8beff3369e81422112d93b89ca01426147de542cd4684c244b673760c6f0981b",
        input: {
          prompt: prompt,
          guidance_scale: 7.5,
          num_outputs: 1,
          num_inference_steps: 50,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Replicate API error:", error)
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 502 }
      )
    }

    const data = await response.json()

    return NextResponse.json(
      {
        success: true,
        imageUrl: data.output?.[0] || null,
        predictionId: data.id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Check image generation status
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

    const predictionId = req.nextUrl.searchParams.get("predictionId")
    if (!predictionId) {
      return NextResponse.json(
        { error: "Prediction ID is required" },
        { status: 400 }
      )
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: "Image generation not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get prediction status" },
        { status: 502 }
      )
    }

    const data = await response.json()

    return NextResponse.json(
      {
        status: data.status,
        imageUrl: data.output?.[0] || null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching prediction:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
