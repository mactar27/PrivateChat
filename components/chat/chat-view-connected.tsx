'use client'

import { ChatHeaderConnected } from './chat-header-connected'
import { MessageListConnected } from './message-list-connected'
import { MessageInput } from './message-input'
import { useMessages, type Conversation } from '@/lib/hooks/use-chat'
import { Spinner } from '@/components/ui/spinner'

interface ChatViewConnectedProps {
  conversation: Conversation
  currentUserId: string
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatViewConnected({
  conversation,
  currentUserId,
  onBack,
  showBackButton,
}: ChatViewConnectedProps) {
  const { messages, isLoading, sendMessage } = useMessages(conversation.id)

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'file' | 'audio' = 'text') => {
    try {
      await sendMessage(content, type)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ChatHeaderConnected
        conversation={conversation}
        currentUserId={currentUserId}
        onBack={onBack}
        showBackButton={showBackButton}
      />
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center bg-background">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : (
        <MessageListConnected messages={messages} currentUserId={currentUserId} />
      )}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}
