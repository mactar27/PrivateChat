import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { searchUsers } from '@/lib/db/users'

// GET /api/users/search?q=searchterm - Search for users
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    
    const url = new URL(request.url)
    const searchTerm = url.searchParams.get('q')
    
    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({ users: [] })
    }
    
    const users = await searchUsers(searchTerm, 20)
    
    // Filter out current user and return only public info
    const filteredUsers = users
      .filter(u => u.id !== currentUser.id)
      .map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        status: u.status,
      }))
    
    return NextResponse.json({ users: filteredUsers })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
