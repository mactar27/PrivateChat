import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isUserInConversation } from '@/lib/db/conversations'
import { query } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

interface DbMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video'
  status: 'sent' | 'delivered' | 'read'
  created_at: Date
}

// GET /api/conversations/[conversationId]/poll?after=timestamp - Poll for new messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { conversationId } = await params
    
    // Check if user is part of the conversation
    const isParticipant = await isUserInConversation(currentUser.id, conversationId)
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    
    const url = new URL(request.url)
    const after = url.searchParams.get('after')
    
    if (!after) {
      return NextResponse.json({ messages: [] })
    }
    
    const afterDate = new Date(after)
    
    // Get messages created after the given timestamp
    const messages = await query<(DbMessage & RowDataPacket)[]>(
      `SELECT * FROM messages 
       WHERE conversation_id = ? AND created_at > ? AND deleted_at IS NULL
       ORDER BY created_at ASC
       LIMIT 100`,
      [conversationId, afterDate]
    )
    
    return NextResponse.json({
      messages: messages.map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        timestamp: m.created_at,
        status: m.status,
        type: m.message_type,
      }))
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Poll messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
