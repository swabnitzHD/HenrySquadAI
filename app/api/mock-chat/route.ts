import { NextResponse } from "next/server"

// Simple mock responses for testing
const mockResponses = [
  {
    keywords: ["earth", "planet", "round", "flat"],
    response:
      "The Earth is round, like a ball, but slightly squished at the top and bottom. It's called an 'oblate spheroid'.",
  },
  {
    keywords: ["solar system", "planets", "space"],
    response:
      "Our solar system has 8 planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Pluto is now called a 'dwarf planet'.",
  },
  {
    keywords: ["math", "add", "plus", "sum", "addition"],
    response: "Addition is when we combine numbers to find their total. For example, 5 + 5 = 10.",
  },
  {
    keywords: ["subtract", "minus", "take away", "subtraction"],
    response: "Subtraction is when we take away one number from another. For example, 10 - 5 = 5.",
  },
  {
    keywords: ["multiply", "times", "multiplication"],
    response:
      "Multiplication is a faster way of adding the same number multiple times. For example, 5 × 4 means 5 + 5 + 5 + 5 = 20.",
  },
  {
    keywords: ["divide", "division", "share"],
    response:
      "Division is sharing a number into equal parts. For example, 10 ÷ 2 = 5 means we split 10 into 2 equal groups of 5.",
  },
  {
    keywords: ["read", "book", "story"],
    response: "Reading is important because it helps us learn new things and visit amazing places in our imagination!",
  },
  {
    keywords: ["animal", "animals", "pet", "pets"],
    response:
      "Animals are classified into different groups like mammals, birds, reptiles, amphibians, fish, and insects. Each group has special characteristics!",
  },
  {
    keywords: ["plant", "plants", "tree", "trees", "flower"],
    response:
      "Plants make their own food using sunlight in a process called photosynthesis. They take in carbon dioxide and release oxygen, which we need to breathe!",
  },
  {
    keywords: ["body", "human", "health"],
    response:
      "The human body has 206 bones that help us move, protect our organs, and give us our shape. Your body also has over 600 muscles!",
  },
  {
    keywords: ["water", "h2o", "drink"],
    response:
      "Water is made of two hydrogen atoms and one oxygen atom, which is why we call it H2O. Our bodies are about 60% water!",
  },
  {
    keywords: ["dinosaur", "dinosaurs", "t-rex", "triceratops"],
    response:
      "Dinosaurs lived millions of years ago and were the biggest land animals ever to live on Earth! They disappeared about 65 million years ago.",
  },
  {
    keywords: ["computer", "technology", "internet", "code"],
    response:
      "Computers work by following instructions called programs that tell them what to do. They use a special language made of 1s and 0s called binary code.",
  },
  {
    keywords: ["weather", "rain", "snow", "sun", "cloud"],
    response:
      "Weather is what's happening in the sky and air around us. It includes sunshine, clouds, rain, snow, wind, and temperature changes.",
  },
  {
    keywords: ["ocean", "sea", "beach", "wave"],
    response:
      "Oceans cover more than 70% of Earth's surface! The deepest part is the Mariana Trench, which is almost 7 miles deep.",
  },
]

// Math operation pattern
const mathPattern = /what is (\d+) ([+\-*/x]) (\d+)/i

export async function POST(req: Request) {
  try {
    // Extract the messages from the request
    let userQuestion = "a question"
    try {
      const body = await req.json()
      const messages = body.messages || []
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === "user") {
        userQuestion = lastMessage.content
      }
    } catch (e) {
      console.error("Error parsing request:", e)
    }

    // Check for math operations
    const mathMatch = userQuestion.match(mathPattern)
    if (mathMatch) {
      const num1 = Number.parseInt(mathMatch[1])
      const operator = mathMatch[2]
      const num2 = Number.parseInt(mathMatch[3])
      let result
      let operation

      switch (operator) {
        case "+":
          result = num1 + num2
          operation = "plus"
          break
        case "-":
          result = num1 - num2
          operation = "minus"
          break
        case "*":
        case "x":
        case "X":
          result = num1 * num2
          operation = "times"
          break
        case "/":
          result = num1 / num2
          operation = "divided by"
          break
        default:
          result = null
      }

      if (result !== null) {
        return NextResponse.json({
          content: `${num1} ${operation} ${num2} equals ${result}. I solved this by doing the ${
            operator === "*" || operator === "x" || operator === "X"
              ? "multiplication"
              : operator === "/"
                ? "division"
                : operator === "+"
                  ? "addition"
                  : "subtraction"
          } operation.`,
        })
      }
    }

    // Get a response based on the question
    let response = ""
    const lowerQuestion = userQuestion.toLowerCase()

    // Try to find a matching response based on keywords
    for (const item of mockResponses) {
      if (item.keywords.some((keyword) => lowerQuestion.includes(keyword))) {
        response = item.response
        break
      }
    }

    // If no specific response was found, provide a generic one
    if (!response) {
      response =
        "That's an interesting question! I'm in training mode right now, so I can only answer simple questions about math, science, animals, and other school subjects."
    }

    // Return the mock response
    return NextResponse.json({
      content: response,
    })
  } catch (error) {
    console.error("Error in mock chat API:", error)

    // Always return valid JSON even in case of error
    return NextResponse.json({
      content: "I'm having a little trouble thinking right now. Let's try again in a moment!",
    })
  }
}
