'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUserSearch, useCreateConversation } from '@/lib/hooks/use-chat'
import { cn } from '@/lib/utils'

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated: (conversationId: string) => void
}

export function NewChatDialog({ open, onOpenChange, onConversationCreated }: NewChatDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { users, isLoading } = useUserSearch(searchQuery)
  const { createDirectConversation } = useCreateConversation()

  const handleSelectUser = async (userId: string) => {
    setIsCreating(true)
    try {
      const conversationId = await createDirectConversation(userId)
      onConversationCreated(conversationId)
      setSearchQuery('')
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    disabled={isCreating}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary',
                      isCreating && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="size-10">
                        <AvatarImage src={user.avatar || undefined} alt={user.username} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.status === 'online' && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-online" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{user.username}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
