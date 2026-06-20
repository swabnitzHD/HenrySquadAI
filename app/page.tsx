"use client"

import { useEffect, useState } from "react"
import LoginPage from "@/components/auth/LoginPage"
import ChatInterface from "@/components/chat/ChatInterface"

export default function Home() {
  const [user, setUser] = useState<{ userId: string; username: string; role: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/verify")
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setUser(data.user)
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (userData: { userId: string; username: string; role: string }) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-4xl mx-auto mb-4">
            🤖
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>{user ? <ChatInterface user={user} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />}</>
  )
}
