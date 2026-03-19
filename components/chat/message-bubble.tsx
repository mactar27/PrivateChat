'use client'

import { Check, CheckCheck, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'
import { format } from 'date-fns'
import { useState, useRef } from 'react'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showTail?: boolean
}

export function MessageBubble({ message, isOwn, showTail = true }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div
      className={cn(
        'flex w-full',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[75%] rounded-lg px-3 py-2',
          isOwn 
            ? 'bg-chat-bubble-sent text-foreground' 
            : 'bg-chat-bubble-received text-foreground',
          showTail && isOwn && 'rounded-tr-none',
          showTail && !isOwn && 'rounded-tl-none'
        )}
      >
        {/* Tail */}
        {showTail && (
          <div
            className={cn(
              'absolute top-0 size-0',
              isOwn 
                ? '-right-2 border-y-8 border-l-8 border-y-transparent border-l-chat-bubble-sent' 
                : '-left-2 border-y-8 border-r-8 border-y-transparent border-r-chat-bubble-received'
            )}
          />
        )}
        
        {message.type === 'audio' ? (
          <div className="flex items-center gap-3 py-1 min-w-[200px]">
            <button
              onClick={togglePlay}
              className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
              <div className="h-1 w-full rounded-full bg-primary/10">
                <div className="h-full w-0 rounded-full bg-primary" />
              </div>
              <p className="text-[10px] opacity-70">Message vocal</p>
            </div>
            <audio
              ref={audioRef}
              src={message.content}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="hidden"
            />
          </div>
        ) : (
          <p className="break-words text-sm leading-relaxed">{message.content}</p>
        )}
        
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-[10px] text-muted-foreground">
            {format(message.timestamp, 'HH:mm')}
          </span>
          {isOwn && (
            <span className={cn(
              'text-muted-foreground',
              message.status === 'read' && 'text-primary'
            )}>
              {message.status === 'sent' ? (
                <Check className="size-3.5" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
