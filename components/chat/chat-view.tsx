'use client'

import { ChatHeader } from './chat-header'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import type { Conversation, Message } from '@/lib/types'

interface ChatViewProps {
  conversation: Conversation
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string) => void
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatView({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  showBackButton,
}: ChatViewProps) {
  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        onBack={onBack}
        showBackButton={showBackButton}
      />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  )
}
