import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUserConversations, getConversationParticipants, createConversation, findDirectConversation } from '@/lib/db/conversations'
import { getLatestMessage, getUnreadCount } from '@/lib/db/messages'
import { getUsersByIds, getUserById } from '@/lib/db/users'
import { z } from 'zod'

// GET /api/conversations - Get all conversations for the current user
export async function GET() {
  try {
    const currentUser = await requireAuth()
    
    const conversations = await getUserConversations(currentUser.id)
    
    // Enrich conversations with participants and last message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await getConversationParticipants(conv.id)
        const participantUsers = await getUsersByIds(participants.map(p => p.user_id))
        const lastMessage = await getLatestMessage(conv.id)
        const unreadCount = await getUnreadCount(conv.id, currentUser.id)
        
        return {
          id: conv.id,
          isGroup: conv.is_group,
          groupName: conv.group_name,
          groupAvatar: conv.group_avatar,
          participants: participantUsers.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar,
            status: u.status,
            lastSeen: u.last_seen,
          })),
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            senderId: lastMessage.sender_id,
            content: lastMessage.content,
            timestamp: lastMessage.created_at,
            status: lastMessage.status,
            type: lastMessage.message_type,
          } : null,
          unreadCount,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        }
      })
    )
    
    return NextResponse.json({ conversations: enrichedConversations })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const createConversationSchema = z.object({
  participantId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
  isGroup: z.boolean().default(false),
  groupName: z.string().min(1).max(100).optional(),
})

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth()
    const body = await request.json()
    
    const result = createConversationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      )
    }
    
    const { participantId, participantIds, isGroup, groupName } = result.data
    
    // For direct messages
    if (!isGroup && participantId) {
      // Check if conversation already exists
      const existingConv = await findDirectConversation(currentUser.id, participantId)
      if (existingConv) {
        return NextResponse.json({ conversation: { id: existingConv.id } })
      }
      
      // Verify participant exists
      const participant = await getUserById(participantId)
      if (!participant) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      const conversation = await createConversation(
        [currentUser.id, participantId],
        false
      )
      
      return NextResponse.json({ conversation: { id: conversation.id } })
    }
    
    // For group conversations
    if (isGroup && participantIds && participantIds.length > 0) {
      if (!groupName) {
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
      }
      
      const allParticipants = [currentUser.id, ...participantIds]
      const conversation = await createConversation(
        allParticipants,
        true,
        groupName
      )
      
      return NextResponse.json({ conversation: { id: conversation.id } })
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
