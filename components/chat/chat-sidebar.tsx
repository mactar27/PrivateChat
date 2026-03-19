'use client'

import { useState } from 'react'
import { Search, MoreVertical, MessageSquarePlus, Settings, LogOut, Mic } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Conversation, User } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

interface ChatSidebarProps {
  conversations: Conversation[]
  currentUser: User
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onNewChat: () => void
}

function getOtherParticipant(conversation: Conversation, currentUserId: string): User | undefined {
  return conversation.participants.find(p => p.id !== currentUserId)
}

function getConversationName(conversation: Conversation, currentUserId: string): string {
  if (conversation.isGroup && conversation.groupName) {
    return conversation.groupName
  }
  const other = getOtherParticipant(conversation, currentUserId)
  return other?.username || 'Unknown'
}

function getConversationAvatar(conversation: Conversation, currentUserId: string): string | undefined {
  if (conversation.isGroup) {
    return conversation.groupAvatar
  }
  const other = getOtherParticipant(conversation, currentUserId)
  return other?.avatar
}

function getStatus(conversation: Conversation, currentUserId: string): 'online' | 'offline' | 'away' | undefined {
  if (conversation.isGroup) return undefined
  const other = getOtherParticipant(conversation, currentUserId)
  return other?.status
}

export function ChatSidebar({
  conversations,
  currentUser,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv, currentUser.id).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-sidebar-foreground">{currentUser.username}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onNewChat} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <MessageSquarePlus className="size-5" />
            <span className="sr-only">New chat</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
                <MoreVertical className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-sidebar-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-sidebar-accent pl-10 text-sidebar-foreground placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredConversations.map((conversation) => {
            const name = getConversationName(conversation, currentUser.id)
            const avatar = getConversationAvatar(conversation, currentUser.id)
            const status = getStatus(conversation, currentUser.id)
            const isSelected = selectedConversationId === conversation.id

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sidebar-accent',
                  isSelected && 'bg-sidebar-accent'
                )}
              >
                <div className="relative">
                  <Avatar className="size-12">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {status === 'online' && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-sidebar bg-online" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium text-sidebar-foreground">{name}</span>
                    {conversation.lastMessage && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm text-muted-foreground">
                      {conversation.lastMessage?.type === 'audio' ? (
                        <span className="flex items-center gap-1 italic">
                          <Mic className="size-3" /> Message vocal
                        </span>
                      ) : (
                        conversation.lastMessage?.content || 'No messages yet'
                      )}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
