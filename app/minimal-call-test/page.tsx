'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function MinimalCallTest() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const startMinimalCall = async () => {
    try {
      setLogs(prev => [...prev, '🎯 Démarrage appel minimal...'])
      
      // Demander l'accès audio uniquement
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })
      
      setLogs(prev => [...prev, '✅ Stream créé avec succès'])
      setLogs(prev => [...prev, `🎤 Pistes audio: ${stream.getAudioTracks().length}`])
      
      // Simuler un appel actif
      setIsCallActive(true)
      setLogs(prev => [...prev, '📞 Appel démarré (mode minimal)'])
      
    } catch (error: any) {
      setLogs(prev => [...prev, `❌ Erreur: ${error.name} - ${error.message}`])
    }
  }

  const endCall = () => {
    setLogs(prev => [...prev, '🛑 Appel terminé'])
    setIsCallActive(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test d'Appel Minimal</h1>
        
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Contrôle d'Appel</h2>
            <div className="space-y-2">
              {isCallActive ? (
                <Button onClick={endCall} variant="destructive" className="w-full">
                  🛑 Terminer l'appel
                </Button>
              ) : (
                <Button onClick={startMinimalCall} className="w-full">
                  📞 Démarrer appel vocal
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-2 text-sm">
              <div>Appel actif: {isCallActive ? '✅ OUI' : '❌ NON'}</div>
            </div>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
        
        <div className="mt-8">
          <Button onClick={() => window.location.href = '/'}>
            Retour à PrivateChat
          </Button>
        </div>
      </div>
    </div>
  )
}
