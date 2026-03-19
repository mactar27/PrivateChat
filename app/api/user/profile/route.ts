import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { updateUser } from '@/lib/db/users'
import { z } from 'zod'

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  avatar: z.string().url().optional(),
  status: z.enum(['online', 'offline', 'away']).optional(),
})

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const user = await requireAuth()
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const body = await request.json()
    
    // Validate input
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      )
    }
    
    const { username, avatar, status } = result.data
    
    // Check if username is being changed and if it's already taken
    if (username && username !== currentUser.username) {
      const { getUserByUsername } = await import('@/lib/db/users')
      const existingUser = await getUserByUsername(username)
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        )
      }
    }
    
    // Update user
    const updatedUser = await updateUser(currentUser.id, {
      username,
      avatar,
      status,
    })
    
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        status: updatedUser.status,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
