'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
  minDisplayTime?: number
}

export function SplashScreen({ onComplete, minDisplayTime = 2500 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(onComplete, 500)
    }, minDisplayTime)

    return () => clearTimeout(timer)
  }, [minDisplayTime, onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Logo and content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated logo */}
        <div className="relative">
          {/* Outer ring animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full border-2 border-primary/20 animate-ping" 
                 style={{ animationDuration: '2s' }} />
          </div>
          
          {/* Inner ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full border border-primary/30 animate-pulse" />
          </div>

          {/* Icon container */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25">
            <MessageCircle className="h-10 w-10 text-primary-foreground animate-bounce" 
                          style={{ animationDuration: '1.5s' }} />
          </div>
        </div>

        {/* App name with typing effect */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            <span className="animate-fade-in">Private</span>
            <span className="text-primary animate-fade-in" style={{ animationDelay: '0.3s' }}>Chat</span>
          </h1>
          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Messagerie sécurisée et privée
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-8 flex items-center gap-2">
          <LoadingDots />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <LockIcon className="h-3 w-3" />
          <span>Chiffrement de bout en bout</span>
        </div>
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
