'use client'

import { useState, useCallback } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatView } from './chat-view'
import { EmptyChat } from './empty-chat'
import { cn } from '@/lib/utils'
import type { Conversation, Message, User } from '@/lib/types'
import { mockConversations, mockMessages, currentUser } from '@/lib/mock-data'

export function ChatLayout() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages)
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)
  const selectedMessages = selectedConversationId ? messages[selectedConversationId] || [] : []

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
    // Mark messages as read
    setConversations(prev => 
      prev.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    )
  }, [])

  const handleSendMessage = useCallback((content: string) => {
    if (!selectedConversationId) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversationId,
      senderId: currentUser.id,
      content,
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    }

    setMessages(prev => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage],
    }))

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConversationId
          ? { ...c, lastMessage: newMessage, updatedAt: new Date() }
          : c
      ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    )

    // Simulate message delivery after 1 second
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedConversationId]: prev[selectedConversationId]?.map(m =>
          m.id === newMessage.id ? { ...m, status: 'delivered' } : m
        ) || [],
      }))
    }, 1000)
  }, [selectedConversationId])

  const handleNewChat = useCallback(() => {
    // For now, just deselect the current conversation
    // In a real app, this would open a contact picker
    setSelectedConversationId(undefined)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedConversationId(undefined)
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - hidden on mobile when a conversation is selected */}
      <div
        className={cn(
          'h-full w-full shrink-0 border-r border-border md:w-[350px] lg:w-[400px]',
          selectedConversationId && 'hidden md:block'
        )}
      >
        <ChatSidebar
          conversations={conversations}
          currentUser={currentUser}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          'h-full flex-1',
          !selectedConversationId && 'hidden md:flex'
        )}
      >
        {selectedConversation ? (
          <ChatView
            conversation={selectedConversation}
            messages={selectedMessages}
            currentUserId={currentUser.id}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
            showBackButton
          />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  )
}
