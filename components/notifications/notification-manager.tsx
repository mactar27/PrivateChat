'use client'

import { useEffect, useRef } from 'react'
import { useConversations } from '@/lib/hooks/use-chat'
import { useAuth } from '@/lib/auth-context'
import { showNotification, requestNotificationPermission } from '@/lib/notifications'
import { useParams } from 'next/navigation'

export function NotificationManager() {
  const { conversations } = useConversations()
  const { user } = useAuth()
  const params = useParams()
  const currentConversationId = params?.conversationId as string
  
  const lastMessageIds = useRef<Record<string, string>>({})
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    if (!conversations || !user) return

    // On first load, just populate the lastMessageIds without triggering notifications
    if (isInitialMount.current) {
      conversations.forEach(conv => {
        if (conv.lastMessage) {
          lastMessageIds.current[conv.id] = conv.lastMessage.id
        }
      })
      isInitialMount.current = false
      return
    }

    conversations.forEach(conv => {
      const lastMsg = conv.lastMessage
      if (!lastMsg) return

      const prevLastMsgId = lastMessageIds.current[conv.id]
      
      // If we have a new message ID that we haven't seen before
      if (prevLastMsgId && lastMsg.id !== prevLastMsgId) {
        // Trigger notification if:
        // 1. Message is not from current user
        // 2. Message is NOT in the currently active conversation OR document is hidden
        const isFromOthers = lastMsg.senderId !== user.id
        const isNotCurrentChat = conv.id !== currentConversationId
        const isWindowHidden = typeof document !== 'undefined' && document.hidden

        if (isFromOthers && (isNotCurrentChat || isWindowHidden)) {
          const sender = conv.participants.find(p => p.id === lastMsg.senderId)
          const senderName = sender?.username || 'Nouveau message'
          
          showNotification(senderName, {
            body: lastMsg.type === 'audio' ? '🎤 Message vocal' : lastMsg.content,
            icon: '/favicon.ico', // Replace with sender avatar if available/accessible
            tag: conv.id, // Group notifications by conversation
            renotify: true
          })
        }
      }

      // Update the tracked last message ID
      lastMessageIds.current[conv.id] = lastMsg.id
    })
  }, [conversations, user, currentConversationId])

  return null // This component doesn't render anything
}
