'use client'

import { MessageSquare, Lock } from 'lucide-react'

export function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-8">
      <div className="flex size-32 items-center justify-center rounded-full bg-secondary sm:size-40">
        <MessageSquare className="size-16 text-primary sm:size-20" />
      </div>
      <h2 className="mt-8 text-2xl font-semibold text-foreground sm:text-3xl">PrivateChat Web</h2>
      <p className="mt-4 max-w-lg text-center text-muted-foreground sm:text-lg">
        Envoyez et recevez des messages en toute sécurité. Sélectionnez une conversation dans la barre latérale pour commencer à discuter.
      </p>
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3" />
        <span>Chiffré de bout en bout</span>
      </div>
    </div>
  )
}
