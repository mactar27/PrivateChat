'use client'

import { useState } from 'react'
import { ChatLayoutConnected } from './chat-layout-connected'
import { SplashScreen } from '@/components/splash-screen'
import type { AuthUser } from '@/lib/auth'

interface ChatPageProps {
  initialUser: AuthUser
}

export function ChatPage({ initialUser }: ChatPageProps) {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        <ChatLayoutConnected />
      </div>
    </>
  )
}
