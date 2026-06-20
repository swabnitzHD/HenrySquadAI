// Simple in-memory database with localStorage persistence
// For production, use a real database like Supabase, Firebase, or PostgreSQL

const DB_KEY = "henrysquadai_db"

export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  role: "user" | "editor"
  createdAt: string
}

export interface ChatSession {
  id: string
  userId: string
  name: string
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: string
  }>
  createdAt: string
  updatedAt: string
}

export interface Database {
  users: User[]
  chatSessions: ChatSession[]
}

let db: Database = {
  users: [],
  chatSessions: [],
}

// Initialize default users
export function initializeDB() {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(DB_KEY)
      if (stored) {
        db = JSON.parse(stored)
      } else {
        createDefaultUsers()
        saveDB()
      }
    } else {
      createDefaultUsers()
    }
  } catch (error) {
    console.error("Error initializing DB:", error)
    createDefaultUsers()
  }
}

function createDefaultUsers() {
  db.users = [
    {
      id: "user_1",
      username: "henry",
      email: "henry@henrysquad.ai",
      passwordHash: "henry123",
      role: "user",
      createdAt: new Date().toISOString(),
    },
    {
      id: "editor_1",
      username: "editor",
      email: "editor@henrysquad.ai",
      passwordHash: "editor123",
      role: "editor",
      createdAt: new Date().toISOString(),
    },
  ]
}

function saveDB() {
  if (typeof window !== "undefined") {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  }
}

export function getUser(username: string): User | undefined {
  return db.users.find((u) => u.username === username)
}

export function createChatSession(userId: string, name: string): ChatSession {
  const session: ChatSession = {
    id: `session_${Date.now()}`,
    userId,
    name,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.chatSessions.push(session)
  saveDB()
  return session
}

export function getChatSessions(userId: string): ChatSession[] {
  return db.chatSessions.filter((s) => s.userId === userId)
}

export function getChatSession(sessionId: string): ChatSession | undefined {
  return db.chatSessions.find((s) => s.id === sessionId)
}

export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): void {
  const session = db.chatSessions.find((s) => s.id === sessionId)
  if (session) {
    session.messages.push({
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    })
    session.updatedAt = new Date().toISOString()
    saveDB()
  }
}

export function deleteChatSession(sessionId: string): void {
  db.chatSessions = db.chatSessions.filter((s) => s.id !== sessionId)
  saveDB()
}

export function renameChatSession(sessionId: string, newName: string): void {
  const session = db.chatSessions.find((s) => s.id === sessionId)
  if (session) {
    session.name = newName
    session.updatedAt = new Date().toISOString()
    saveDB()
  }
}
