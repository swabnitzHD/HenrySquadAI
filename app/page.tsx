"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Define message type
type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function Home() {
  // State for chat
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useBackupMode, setUseBackupMode] = useState(false)

  // State for voice features
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [micPermission, setMicPermission] = useState<boolean | null>(null)

  // Refs
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check for microphone permission
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => setMicPermission(true))
        .catch(() => setMicPermission(false))
    } else {
      setMicPermission(false)
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && micPermission) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event: any) => {
          const currentTranscript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join("")

          setInput(currentTranscript)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsRecording(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [micPermission])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Toggle recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      // Clear input before starting
      setInput("")

      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        alert("Could not start speech recognition. Please try again.")
      }
    }
  }

  // Speak the text
  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in your browser.")
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9 // Slightly slower for kids
    utterance.pitch = 1.1 // Slightly higher pitch

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event)
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  // Toggle speaking for the latest AI message
  const toggleSpeaking = () => {
    if (!("speechSynthesis" in window)) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant")
      if (lastAiMessage) {
        speakText(lastAiMessage.content)
      }
    }
  }

  // Try to get a response from an API endpoint
  const tryGetResponse = async (endpoint: string, messagesToSend: any[]) => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
        }),
        // Set a timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!data || !data.content) {
        throw new Error("Invalid response format")
      }

      // Check if we should use backup mode
      if (data.useBackup) {
        setUseBackupMode(true)
        console.log("API indicated we should use backup mode")
      }

      return data.content
    } catch (error) {
      console.error(`Error with ${endpoint}:`, error)
      throw error
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
    }

    if (!input.trim()) return

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setInput("")

    // Format messages for the API
    const messagesToSend = messages.concat(userMessage).map(({ role, content }) => ({
      role,
      content,
    }))

    let responseContent = ""
    let usedFallback = false

    try {
      // If we're in backup mode, skip straight to the mock API
      if (useBackupMode) {
        console.log("Using mock API due to backup mode")
        responseContent = await tryGetResponse("/api/mock-chat", messagesToSend)
        usedFallback = true
      } else {
        // Try each API endpoint in order until one works
        const apiEndpoints = [
          "/api/gemini-alt", // Try the alternative implementation first
          "/api/gemini-simple", // Then try simple Gemini implementation
          "/api/gemini-chat", // Then try the more complex Gemini implementation
          "/api/mock-chat", // Fall back to the mock API as last resort
        ]

        for (const endpoint of apiEndpoints) {
          try {
            console.log(`Trying API: ${endpoint}...`)
            responseContent = await tryGetResponse(endpoint, messagesToSend)
            console.log(`${endpoint} API succeeded`)

            // If we're using the mock API, note that we used the fallback
            if (endpoint === "/api/mock-chat") {
              usedFallback = true
              setUseBackupMode(true)
            }

            break // If successful, break out of the loop
          } catch (apiError) {
            console.error(`${endpoint} API failed:`, apiError)

            // If this is the last API and it fails, we're in trouble
            if (endpoint === apiEndpoints[apiEndpoints.length - 1]) {
              throw apiError
            }

            // If not the last API, continue to the next one
            continue
          }
        }
      }

      // Add a note if we used the fallback
      if (usedFallback && !responseContent.includes("training mode")) {
        responseContent += " (I'm in training mode right now, so my answers are simpler than usual.)"
      }

      // Add AI response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      }

      setMessages((prev) => [...prev, assistantMessage])
      speakText(assistantMessage.content)
    } catch (err: any) {
      console.error("All APIs failed:", err)

      // Add a friendly error message to the chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having a little trouble thinking right now. Can we try again with a different question?",
      }

      setMessages((prev) => [...prev, errorMessage])
      speakText(errorMessage.content)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-b from-blue-50 to-purple-50">
      <Card className="w-full max-w-3xl shadow-lg border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
          <CardTitle className="text-center text-2xl md:text-3xl font-bold">Henry Squad AI Chat</CardTitle>
          {useBackupMode && (
            <div className="text-center text-white text-sm bg-purple-700 rounded-md p-1 mt-1">Training Mode Active</div>
          )}
        </CardHeader>

        <CardContent className="p-4 h-[60vh] overflow-y-auto">
          {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">Error: {error}</div>}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <img
                src="/placeholder.svg?height=120&width=120"
                alt="Henry Squad AI"
                className="rounded-full bg-purple-100 p-4"
              />
              <h2 className="text-xl font-semibold text-purple-700">Hello there!</h2>
              <p className="text-gray-600 max-w-md">
                I'm Henry Squad AI! Ask me any question by typing or using the microphone button. I can help with
                homework, tell stories, or explain cool facts!
                {useBackupMode && (
                  <span className="block mt-2 text-purple-600">
                    (I'm in training mode right now, so my answers will be simpler than usual.)
                  </span>
                )}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex mb-4", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "flex items-start max-w-[80%]",
                    message.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <Avatar
                    className={cn("w-8 h-8", message.role === "user" ? "ml-2 bg-blue-500" : "mr-2 bg-purple-500")}
                  >
                    {message.role === "user" ? "U" : "AI"}
                  </Avatar>
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      message.role === "user"
                        ? "bg-blue-500 text-white rounded-tr-none"
                        : "bg-purple-100 text-gray-800 rounded-tl-none",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            {micPermission !== false && (
              <Button
                type="button"
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
                className="flex-shrink-0"
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <MicOff /> : <Mic />}
              </Button>
            )}

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Type your question here..."}
              className="flex-grow"
              disabled={isLoading}
            />

            {messages.length > 0 && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={toggleSpeaking}
                className="flex-shrink-0"
                title={isSpeaking ? "Stop speaking" : "Speak response"}
              >
                {isSpeaking ? <VolumeX /> : <Volume2 />}
              </Button>
            )}

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 bg-purple-600 hover:bg-purple-700"
            >
              <Send />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  )
}
