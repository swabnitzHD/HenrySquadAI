// In-memory database for demo purposes
interface User {
  id: string
  username: string
  password: string
  passwordHash?: string
  role: "user" | "editor"
}

interface ChatSession {
  id: string
  userId: string
  name: string
  messages: ChatMessage[]
  createdAt: Date
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const users: Map<string, User> = new Map([
  [
    "henry",
    {
      id: "user-1",
      username: "henry",
      password: "henry123",
      role: "user",
    },
  ],
  [
    "editor",
    {
      id: "user-2",
      username: "editor",
      password: "editor123",
      role: "editor",
    },
  ],
])

const sessions: Map<string, ChatSession> = new Map()
const messages: Map<string, ChatMessage[]> = new Map()

export function getUser(username: string): User | null {
  return users.get(username) || null
}

export function getChatSessions(userId: string): ChatSession[] {
  return Array.from(sessions.values())
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((session) => ({
      ...session,
      messages: messages.get(session.id) || [],
    }))
}

export function getChatSession(sessionId: string): ChatSession | null {
  const session = sessions.get(sessionId)
  if (!session) return null

  return {
    ...session,
    messages: messages.get(sessionId) || [],
  }
}

export function createChatSession(userId: string, name: string): ChatSession {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const session: ChatSession = {
    id: sessionId,
    userId,
    name,
    messages: [],
    createdAt: new Date(),
  }

  sessions.set(sessionId, session)
  messages.set(sessionId, [])

  return session
}

export function saveChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): ChatMessage {
  const message: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
  }

  if (!messages.has(sessionId)) {
    messages.set(sessionId, [])
  }

  const sessionMessages = messages.get(sessionId)!
  sessionMessages.push(message)

  return message
}
