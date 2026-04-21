"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}


export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasMic, setHasMic] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Set up speech recognition once on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("")
          setInput(transcript)
        }
        recognition.onend = () => setIsRecording(false)
        recognition.onerror = () => setIsRecording(false)

        recognitionRef.current = recognition
        setHasMic(true)
      })
      .catch(() => setHasMic(false))

    return () => {
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      setInput("")
      try { recognitionRef.current.start(); setIsRecording(true) } catch {}
    }
  }, [isRecording])

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    } else {
      const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant")
      if (lastAiMessage) speakText(lastAiMessage.content)
    }
  }, [isSpeaking, messages, speakText])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (isRecording) recognitionRef.current?.stop()

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setInput("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      if (!data?.content) throw new Error("Empty response")

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.content },
      ])
    } catch (err) {
      console.error("Chat error:", err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm having a little trouble thinking right now. Can you try again?",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-b from-blue-50 to-purple-50">
      <Card className="w-full max-w-3xl shadow-lg border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
          <CardTitle className="text-center text-2xl md:text-3xl font-bold">
            Henry Squad AI Chat
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-4xl">
                🤖
              </div>
              <h2 className="text-xl font-semibold text-purple-700">Hello there!</h2>
              <p className="text-gray-600 max-w-md">
                I&apos;m Henry Squad AI! Ask me any question by typing or using the
                microphone button. I can help with homework, tell stories, or explain
                cool facts!
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
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                      message.role === "user" ? "ml-2 bg-blue-500" : "mr-2 bg-purple-500",
                    )}
                  >
                    {message.role === "user" ? "U" : "AI"}
                  </div>
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
            {hasMic && (
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
