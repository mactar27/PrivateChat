'use client'

import useSWR from 'swr'
import { useCallback, useEffect, useRef } from 'react'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export interface ConversationParticipant {
  id: string
  username: string
  avatar: string | null
  status: 'online' | 'offline' | 'away'
  lastSeen: string | null
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file' | 'audio'
}

export interface Conversation {
  id: string
  isGroup: boolean
  groupName: string | null
  groupAvatar: string | null
  participants: ConversationParticipant[]
  lastMessage: Message | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

// Hook to fetch all conversations
export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR<{ conversations: Conversation[] }>(
    '/api/conversations',
    fetcher,
    { refreshInterval: 5000 } // Poll every 5 seconds for updates
  )

  return {
    conversations: data?.conversations || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook to fetch messages for a conversation
export function useMessages(conversationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ messages: Message[] }>(
    conversationId ? `/api/conversations/${conversationId}/messages` : null,
    fetcher
  )

  // Polling for new messages
  const lastMessageTime = useRef<string | null>(null)

  useEffect(() => {
    if (!conversationId || !data?.messages.length) return

    // Update the last message time reference
    const latestMessage = data.messages[data.messages.length - 1]
    lastMessageTime.current = latestMessage?.timestamp || null
  }, [conversationId, data?.messages])

  useEffect(() => {
    if (!conversationId) return

    const pollInterval = setInterval(async () => {
      if (!lastMessageTime.current) return

      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/poll?after=${encodeURIComponent(lastMessageTime.current)}`
        )
        if (res.ok) {
          const { messages: newMessages } = await res.json()
          if (newMessages.length > 0) {
            mutate((prev) => {
              if (!prev) return prev
              // Filter out duplicates
              const existingIds = new Set(prev.messages.map(m => m.id))
              const uniqueNew = newMessages.filter((m: Message) => !existingIds.has(m.id))
              return { messages: [...prev.messages, ...uniqueNew] }
            }, false)
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [conversationId, mutate])

  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'file' | 'audio' = 'text') => {
    if (!conversationId) return null

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.details || data.error || 'Failed to send message')
    }

    const { message } = data
    
    // Optimistically add the message
    mutate((prev) => {
      if (!prev) return { messages: [message] }
      return { messages: [...prev.messages, message] }
    }, false)

    return message
  }, [conversationId, mutate])

  return {
    messages: data?.messages || [],
    isLoading,
    error,
    sendMessage,
    refresh: mutate,
  }
}

// Hook to search users
export function useUserSearch(searchTerm: string) {
  const { data, error, isLoading } = useSWR<{ users: ConversationParticipant[] }>(
    searchTerm.length >= 2 ? `/api/users/search?q=${encodeURIComponent(searchTerm)}` : null,
    fetcher
  )

  return {
    users: data?.users || [],
    isLoading,
    error,
  }
}

// Hook to create a conversation
export function useCreateConversation() {
  const createDirectConversation = useCallback(async (participantId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId }),
    })

    if (!res.ok) throw new Error('Failed to create conversation')
    
    const { conversation } = await res.json()
    return conversation.id
  }, [])

  const createGroupConversation = useCallback(async (participantIds: string[], groupName: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIds, isGroup: true, groupName }),
    })

    if (!res.ok) throw new Error('Failed to create conversation')
    
    const { conversation } = await res.json()
    return conversation.id
  }, [])

  return {
    createDirectConversation,
    createGroupConversation,
  }
}
