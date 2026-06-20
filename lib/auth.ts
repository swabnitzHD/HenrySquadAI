import jwt from "jsonwebtoken"
import { getUser } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface JWTPayload {
  userId: string
  username: string
  role: "user" | "editor"
}

export function verifyPassword(password: string, hash: string): boolean {
  // For client-side, we'll use a simple comparison
  // In production, use bcryptjs for verification
  return password === hash // Simplified for now
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function authenticateUser(username: string, password: string): JWTPayload | null {
  const user = getUser(username)
  if (!user) return null

  // In production, use bcryptjs.compare(password, user.passwordHash)
  if (password === "henry123" && username === "henry") {
    return {
      userId: user.id,
      username: user.username,
      role: user.role,
    }
  }
  if (password === "editor123" && username === "editor") {
    return {
      userId: user.id,
      username: user.username,
      role: user.role,
    }
  }
  return null
}
