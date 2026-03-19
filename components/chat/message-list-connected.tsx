'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubbleConnected } from './message-bubble-connected'
import type { Message } from '@/lib/hooks/use-chat'
import { format, isSameDay } from 'date-fns'

interface MessageListConnectedProps {
  messages: Message[]
  currentUserId: string
}

function DateDivider({ date }: { date: Date }) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label: string
  if (isSameDay(date, today)) {
    label = 'Today'
  } else if (isSameDay(date, yesterday)) {
    label = 'Yesterday'
  } else {
    label = format(date, 'MMMM d, yyyy')
  }

  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-lg bg-secondary px-3 py-1 text-xs text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function MessageListConnected({ messages, currentUserId }: MessageListConnectedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const groupedMessages: { date: Date; messages: Message[] }[] = []
  
  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp)
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (lastGroup && isSameDay(lastGroup.date, messageDate)) {
      lastGroup.messages.push(message)
    } else {
      groupedMessages.push({
        date: messageDate,
        messages: [message],
      })
    }
  })

  return (
    <ScrollArea className="flex-1 min-h-0 bg-background" ref={scrollRef}>
      <div className="flex flex-col px-4 py-2">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            <DateDivider date={group.date} />
            <div className="flex flex-col gap-1">
              {group.messages.map((message, messageIndex) => {
                const isOwn = message.senderId === currentUserId
                const prevMessage = group.messages[messageIndex - 1]
                const showTail = !prevMessage || prevMessage.senderId !== message.senderId

                return (
                  <MessageBubbleConnected
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showTail={showTail}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
