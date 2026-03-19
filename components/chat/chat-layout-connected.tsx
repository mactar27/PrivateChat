'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChatSidebarConnected } from './chat-sidebar-connected'
import { ChatViewConnected } from './chat-view-connected'
import { EmptyChat } from './empty-chat'
import { NewChatDialog } from './new-chat-dialog'
import { CallModal } from './call-modal'
import { CallPermissionGuide } from './call-permission-guide'
import { cn } from '@/lib/utils'
import { useConversations } from '@/lib/hooks/use-chat'
import { useAuth } from '@/lib/auth-context'
import { useCall } from '@/lib/call-context'
import { Spinner } from '@/components/ui/spinner'

export function ChatLayoutConnected() {
  const { user } = useAuth()
  const { conversations, isLoading, refresh } = useConversations()
  const { 
    isCallActive, 
    isCallIncoming, 
    currentCall, 
    showPermissionModal,
    answerCall, 
    rejectCall, 
    endCall,
    initializeSocket,
    hidePermissionGuide,
    showPermissionGuide,
    localStream,
    remoteStream
  } = useCall()
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket()
  }, [])

  const handleRetryPermissions = () => {
    hidePermissionGuide()
    // Retry after a short delay
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
  }, [])

  const handleNewChat = useCallback(() => {
    setShowNewChatDialog(true)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedConversationId(undefined)
  }, [])

  const handleConversationCreated = useCallback((conversationId: string) => {
    setShowNewChatDialog(false)
    setSelectedConversationId(conversationId)
    refresh()
  }, [refresh])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="flex h-dvh w-full justify-center bg-background">
        <div className="flex h-full w-full max-w-[1920px] overflow-hidden border-x border-border/50">
          {/* Sidebar - hidden on mobile when a conversation is selected */}
          <div
            className={cn(
              'h-full w-full shrink-0 border-r border-border md:w-[320px] lg:w-[380px] xl:w-[420px]',
              selectedConversationId && 'hidden md:block'
            )}
          >
            <ChatSidebarConnected
              conversations={conversations}
              currentUser={{
                id: user.id,
                username: user.username,
                avatar: user.avatar || undefined,
                status: user.status,
              }}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
            />
          </div>

          {/* Main Chat Area */}
          <div
            className={cn(
              'h-full flex-1 min-h-0 min-w-0 overflow-hidden',
              !selectedConversationId && 'hidden md:flex'
            )}
          >
            {selectedConversation ? (
              <ChatViewConnected
                conversation={selectedConversation}
                currentUserId={user.id}
                onBack={handleBack}
                showBackButton
              />
            ) : (
              <EmptyChat />
            )}
          </div>
        </div>
      </div>

      <NewChatDialog
        open={showNewChatDialog}
        onOpenChange={setShowNewChatDialog}
        onConversationCreated={handleConversationCreated}
      />

      {/* Call Modal */}
      {currentCall && (
        <CallModal
          isOpen={isCallActive || isCallIncoming}
          onClose={endCall}
          contactName={currentCall.contactName}
          contactAvatar={currentCall.contactAvatar}
          isVideoCall={currentCall.isVideoCall}
          isIncoming={isCallIncoming}
          onAccept={answerCall}
          onReject={rejectCall}
          localStream={localStream}
          remoteStream={remoteStream}
        />
      )}

      {/* Permission Guide */}
      {showPermissionModal && (
        <CallPermissionGuide
          onRetry={handleRetryPermissions}
          onClose={hidePermissionGuide}
        />
      )}
    </>
  )
}
