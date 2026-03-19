'use client'

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'
import { Paperclip, Smile, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'audio') => void
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), 'text')
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64Audio = reader.result as string
          onSendMessage(base64Audio, 'audio')
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Erreur micro:', err)
      alert("Impossible d'accéder au micro.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null // Don't trigger send
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 border-t border-border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
          <div className="size-2 animate-pulse rounded-full bg-destructive" />
          <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          <span className="text-xs opacity-70">Enregistrement...</span>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelRecording}
          className="h-10 px-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          Annuler
        </Button>
        
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={stopRecording}
          className="size-10 shrink-0 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20"
        >
          <div className="size-2 rounded-sm bg-current" />
          <span className="sr-only">Send voice message</span>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Smile className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Paperclip className="size-5" />
      </Button>
      
      <div className="flex min-h-10 flex-1 items-center rounded-lg bg-secondary px-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          disabled={disabled}
          rows={1}
          className={cn(
            'max-h-[150px] flex-1 resize-none bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={startRecording}
        className="size-10 shrink-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Mic className="size-5" />
        <span className="sr-only">Voice message</span>
      </Button>
    </form>
  )
}
