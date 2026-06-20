"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  LogOut,
  Plus,
  Trash2,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  imageUrl?: string
  hasCodeBlock?: boolean
}

interface ChatInterfaceProps {
  user: { userId: string; username: string; role: string }
  onLogout: () => void
}

export default function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasMic, setHasMic] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showSessions, setShowSessions] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize session
  useEffect(() => {
    initializeSession()
  }, [])

  const initializeSession = async () => {
    try {
      const response = await fetch("/api/chat/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
        if (data.sessions.length === 0) {
          createNewSession()
        } else {
          setCurrentSessionId(data.sessions[0].id)
          setMessages(data.sessions[0].messages)
        }
      }
    } catch (error) {
      console.error("Failed to load sessions:", error)
      createNewSession()
    }
  }

  const createNewSession = async () => {
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Chat ${new Date().toLocaleTimeString()}` }),
      })
      if (response.ok) {
        const data = await response.json()
        setSessions((prev) => [data.session, ...prev])
        setCurrentSessionId(data.session.id)
        setMessages([])
      }
    } catch (error) {
      console.error("Failed to create session:", error)
    }
  }

  // Set up speech recognition once on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
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
      try {
        recognitionRef.current?.stop()
      } catch {}
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
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch {}
    }
  }, [isRecording])

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()

    // Extract text without code blocks for speech
    const cleanText = text.replace(/```[\s\S]*?```/g, "").trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
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

  const generateImage = async () => {
    if (!input.trim() || isGeneratingImage) return

    setIsGeneratingImage(true)
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      })

      if (!response.ok) throw new Error("Image generation failed")

      const data = await response.json()
      if (data.imageUrl) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "user",
            content: input,
          },
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Here's your generated image:",
            imageUrl: data.imageUrl,
          },
        ])
        setInput("")
      }
    } catch (error) {
      console.error("Image generation error:", error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const extractCodeBlock = (text: string): string | null => {
    const codeBlockMatch = text.match(/```[\s\S]*?```|```[a-zA-Z0-9]*\n([\s\S]*?)```/)
    if (codeBlockMatch) {
      return codeBlockMatch[0].replace(/```[a-zA-Z0-9]*\n?/g, "").trim()
    }
    return null
  }

  const copyToClipboard = async (messageId: string, content: string) => {
    try {
      const codeBlock = extractCodeBlock(content)
      const textToCopy = codeBlock || content
      await navigator.clipboard.writeText(textToCopy)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !currentSessionId) return

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
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          userMessage: userMessage.content,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      if (!data?.content) throw new Error("Empty response")

      const hasCodeBlock = /```[\s\S]*?```/.test(data.content)

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
          hasCodeBlock,
        },
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

  const deleteSession = async (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      createNewSession()
    }
  }

  return (
    <main className="flex min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative w-64 h-full bg-white border-r border-purple-200 shadow-lg p-4 transition-transform",
          showSessions ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-purple-700">Sessions</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSessions(false)}
            className="md:hidden"
          >
            ✕
          </Button>
        </div>

        <Button
          onClick={createNewSession}
          className="w-full mb-4 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" /> New Chat
        </Button>

        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "p-3 rounded cursor-pointer flex items-center justify-between",
                currentSessionId === session.id
                  ? "bg-purple-100 border-l-4 border-purple-500"
                  : "hover:bg-gray-100"
              )}
              onClick={() => {
                setCurrentSessionId(session.id)
                setMessages(session.messages || [])
                setShowSessions(false)
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{session.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(session.id)
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 right-4 border-t pt-4">
          <div className="text-sm text-gray-600 mb-3">
            <p className="font-semibold">👤 {user.username}</p>
            <p className="text-xs capitalize">{user.role}</p>
          </div>
          <Button onClick={onLogout} variant="outline" className="w-full" size="sm">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Toggle button for mobile */}
        <div className="md:hidden p-4">
          <Button onClick={() => setShowSessions(true)} variant="outline" size="sm">
            ☰ Sessions
          </Button>
        </div>

        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Card className="w-full max-w-3xl shadow-lg border-2 border-purple-200 flex flex-col h-[80vh] md:h-auto">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg flex-shrink-0">
              <CardTitle className="text-center text-2xl md:text-3xl font-bold">
                Henry Squad AI Chat
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-4xl">
                    🤖
                  </div>
                  <h2 className="text-xl font-semibold text-purple-700">Hello {user.username}!</h2>
                  <p className="text-gray-600 max-w-md">
                    I'm Henry Squad AI! Ask me any question by typing or using the microphone button. I can help
                    with homework, write code, tell stories, explain cool facts, or generate images!
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
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                          message.role === "user" ? "ml-2 bg-blue-500" : "mr-2 bg-purple-500"
                        )}
                      >
                        {message.role === "user" ? "U" : "AI"}
                      </div>
                      <div
                        className={cn(
                          "rounded-lg p-3 relative group",
                          message.role === "user"
                            ? "bg-blue-500 text-white rounded-tr-none"
                            : "bg-purple-100 text-gray-800 rounded-tl-none"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="Generated"
                            className="mt-3 rounded-lg max-w-xs"
                          />
                        )}

                        {message.role === "assistant" && message.hasCodeBlock && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(message.id, message.content)}
                            className={cn(
                              "mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                              copiedId === message.id ? "bg-green-100" : ""
                            )}
                            title="Copy code"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="w-3 h-3 mr-1" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" /> Copy Code
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="p-4 border-t flex-shrink-0">
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
                  <>
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

                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={generateImage}
                      className="flex-shrink-0"
                      disabled={isGeneratingImage || !input.trim()}
                      title="Generate image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </>
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
        </div>
      </div>
    </main>
  )
}
