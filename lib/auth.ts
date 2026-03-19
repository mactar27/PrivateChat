import { cookies, headers } from 'next/headers'
import { getSessionByToken, createSession, deleteSession, refreshSession } from './db/sessions'
import { getUserById, updateUserStatus } from './db/users'
import type { DbUser } from './db/users'

const SESSION_COOKIE_NAME = 'privatechat_session'

export interface AuthUser {
  id: string
  username: string
  email: string
  avatar: string | null
  status: 'online' | 'offline' | 'away'
}

// Get the current authenticated user from the session
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return null
    }

    const session = await getSessionByToken(sessionToken)
    if (!session) {
      return null
    }

    const user = await getUserById(session.user_id)
    if (!user) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
    }
  } catch {
    return null
  }
}

// Create a session and set the cookie
export async function createAuthSession(userId: string): Promise<string> {
  const session = await createSession(userId)
  
  // Update user status to online
  await updateUserStatus(userId, 'online')
  
  const cookieStore = await cookies()
  const headersList = await headers()
  const proto = headersList.get('x-forwarded-proto')
  const isSecure = proto === 'https' || process.env.NODE_ENV === 'production'

  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
  
  return session.token
}

// Logout - delete session and clear cookie
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (sessionToken) {
    // Get session to update user status
    const session = await getSessionByToken(sessionToken)
    if (session) {
      await updateUserStatus(session.user_id, 'offline')
    }
    
    await deleteSession(sessionToken)
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME)
}

// Refresh the current session
export async function refreshAuthSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!sessionToken) {
    return false
  }
  
  const refreshed = await refreshSession(sessionToken)
  return refreshed !== null
}

// Helper to require authentication
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
