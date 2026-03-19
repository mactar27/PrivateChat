'use client'

import { Mic, MicOff, Video, VideoOff, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CallPermissionGuideProps {
  onRetry: () => void
  onClose: () => void
}

export function CallPermissionGuide({ onRetry, onClose }: CallPermissionGuideProps) {
  const requestPermissions = async () => {
    try {
      // Forcer la demande de permissions
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      // Si succès, recharger la page
      window.location.reload()
    } catch (error) {
      console.error('Permission denied:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-background rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="size-8 text-orange-500" />
          <h3 className="text-lg font-semibold">Permissions requises</h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <Mic className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Microphone</p>
              <p className="text-sm text-muted-foreground">Nécessaire pour les appels vocaux</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Video className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Caméra</p>
              <p className="text-sm text-muted-foreground">Nécessaire pour les appels vidéo</p>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded p-3 mb-6">
          <p className="text-sm font-medium mb-2">Comment résoudre :</p>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Cliquez sur le bouton "Demander les permissions" ci-dessous</li>
            <li>Autorisez l'accès au micro et à la caméra dans la popup</li>
            <li>Cliquez sur "Réessayer" pour tester</li>
          </ol>
        </div>

        <div className="space-y-3">
          <Button onClick={requestPermissions} className="w-full">
            Demander les permissions
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onRetry}>
              Réessayer
            </Button>
            <Button variant="outline" onClick={() => {
              console.log('Bouton annuler cliqué - fermeture forcée')
              onClose()
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => {
              console.log('Fermeture forcée du modal')
              // Forcer la fermeture en rechargeant la page
              window.location.reload()
            }}>
              🔄 Recharger la page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
