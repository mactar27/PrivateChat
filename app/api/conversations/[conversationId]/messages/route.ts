import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isUserInConversation, updateLastRead } from '@/lib/db/conversations'
import { getConversationMessages, createMessage, markMessagesAsRead } from '@/lib/db/messages'
import { z } from 'zod'

// GET /api/conversations/[conversationId]/messages - Get messages for a conversation
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
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const before = url.searchParams.get('before')
    
    const messages = await getConversationMessages(
      conversationId,
      limit,
      before ? new Date(before) : undefined
    )
    
    // Mark messages as read
    await markMessagesAsRead(conversationId, currentUser.id)
    await updateLastRead(currentUser.id, conversationId)
    
    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse()
    
    return NextResponse.json({
      messages: chronologicalMessages.map(m => ({
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
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const createMessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['text', 'image', 'file', 'audio']).default('text'),
})

// POST /api/conversations/[conversationId]/messages - Send a message
export async function POST(
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
    
    const body = await request.json()
    const result = createMessageSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      )
    }
    
    const { content, type } = result.data
    
    const message = await createMessage({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content,
      message_type: type,
    })
    
    return NextResponse.json({
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        content: message.content,
        timestamp: message.created_at,
        status: message.status,
        type: message.message_type,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create message error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
