'use client'

import { ArrowLeft, Phone, Video, MoreVertical, Search, Trash2, BellOff } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Conversation, ConversationParticipant } from '@/lib/hooks/use-chat'
import { formatDistanceToNow } from 'date-fns'
import { useCall } from '@/lib/call-context'

interface ChatHeaderConnectedProps {
  conversation: Conversation
  currentUserId: string
  onBack?: () => void
  showBackButton?: boolean
}

function getOtherParticipant(conversation: Conversation, currentUserId: string): ConversationParticipant | undefined {
  return conversation.participants.find(p => p.id !== currentUserId)
}

function getConversationName(conversation: Conversation, currentUserId: string): string {
  if (conversation.isGroup && conversation.groupName) {
    return conversation.groupName
  }
  const other = getOtherParticipant(conversation, currentUserId)
  return other?.username || 'Unknown'
}

function getConversationAvatar(conversation: Conversation, currentUserId: string): string | null {
  if (conversation.isGroup) {
    return conversation.groupAvatar
  }
  const other = getOtherParticipant(conversation, currentUserId)
  return other?.avatar || null
}

function getStatusText(conversation: Conversation, currentUserId: string): string {
  if (conversation.isGroup) {
    const otherParticipants = conversation.participants.filter(p => p.id !== currentUserId)
    return `${otherParticipants.length + 1} participants`
  }
  const other = getOtherParticipant(conversation, currentUserId)
  if (!other) return ''
  
  if (other.status === 'online') return 'online'
  if (other.status === 'away') return 'away'
  if (other.lastSeen) {
    return `last seen ${formatDistanceToNow(new Date(other.lastSeen), { addSuffix: true })}`
  }
  return 'offline'
}

export function ChatHeaderConnected({ conversation, currentUserId, onBack, showBackButton }: ChatHeaderConnectedProps) {
  const { initiateCall, initializeSocket } = useCall()
  const name = getConversationName(conversation, currentUserId)
  const avatar = getConversationAvatar(conversation, currentUserId)
  const statusText = getStatusText(conversation, currentUserId)
  const other = getOtherParticipant(conversation, currentUserId)
  const isOnline = !conversation.isGroup && other?.status === 'online'

  const handleVideoCall = () => {
    if (!other) return
    initiateCall(other.id, other.username, true, other.avatar || undefined)
  }

  const handleVoiceCall = () => {
    if (!other) return
    initiateCall(other.id, other.username, false, other.avatar || undefined)
  }

  return (
    <div className="flex items-center justify-between border-b border-border bg-chat-header px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="text-foreground hover:bg-secondary md:hidden">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <div className="relative">
          <Avatar className="size-10">
            <AvatarImage src={avatar || undefined} alt={name} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-chat-header bg-online" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">{statusText}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={handleVideoCall} className="text-foreground hover:bg-secondary">
          <Video className="size-5" />
          <span className="sr-only">Video call</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleVoiceCall} className="text-foreground hover:bg-secondary">
          <Phone className="size-5" />
          <span className="sr-only">Voice call</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary">
          <Search className="size-5" />
          <span className="sr-only">Search in chat</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary">
              <MoreVertical className="size-5" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <BellOff className="mr-2 size-4" />
              Mute notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              Delete chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
