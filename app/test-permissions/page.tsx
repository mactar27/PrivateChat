'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestPermissions() {
  const [logs, setLogs] = useState<string[]>([])

  const testAudioOnly = async () => {
    try {
      setLogs(prev => [...prev, 'Début du test audio uniquement...'])
      
      // Test 2: Demander accès audio uniquement
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })
      
      setLogs(prev => [...prev, '✅ Permissions audio accordées!'])
      setLogs(prev => [...prev, `✅ Flux audio créé: ${stream.getAudioTracks().length} piste(s) audio`])
      
      setLogs(prev => [...prev, '🔊 Flux audio actif - test réussi!'])
      
      // Ne pas arrêter le flux automatiquement pour permettre les tests prolongés
      
    } catch (error: any) {
      setLogs(prev => [...prev, `❌ Erreur audio: ${error.name} - ${error.message}`])
      
      if (error.name === 'NotAllowedError') {
        setLogs(prev => [...prev, '📋 Solution: Autorisez l\'accès au micro dans les paramètres du navigateur'])
      } else if (error.name === 'NotFoundError') {
        setLogs(prev => [...prev, '📋 Solution: Branchez un micro'])
      }
    }
  }

  const testPermissions = async () => {
    try {
      setLogs(prev => [...prev, 'Début du test de permissions...'])
      
      // Test 1: Demander accès audio et vidéo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLogs(prev => [...prev, '✅ Permissions accordées!'])
      setLogs(prev => [...prev, `✅ Flux créé: ${stream.getAudioTracks().length} piste(s) audio, ${stream.getVideoTracks().length} piste(s) vidéo`])
      
      setLogs(prev => [...prev, '🔊 Flux actif - test réussi!'])
      
      // Ne pas arrêter le flux automatiquement pour permettre les tests prolongés
      
    } catch (error: any) {
      setLogs(prev => [...prev, `❌ Erreur: ${error.name} - ${error.message}`])
      
      if (error.name === 'NotAllowedError') {
        setLogs(prev => [...prev, '📋 Solution: Autorisez les permissions dans les paramètres du navigateur'])
      } else if (error.name === 'NotFoundError') {
        setLogs(prev => [...prev, '📋 Solution: Branchez un micro ou une caméra'])
      }
    }
  }

  const checkDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioDevices = devices.filter(d => d.kind === 'audioinput')
    const videoDevices = devices.filter(d => d.kind === 'videoinput')
    
    setLogs(prev => [...prev, `🎤 Périphériques audio: ${audioDevices.length}`])
    setLogs(prev => [...prev, `📹 Périphériques vidéo: ${videoDevices.length}`])
    
    audioDevices.forEach((device, index) => {
      setLogs(prev => [...prev, `  Micro ${index + 1}: ${device.label || 'Sans nom'}`])
    })
    
    videoDevices.forEach((device, index) => {
      setLogs(prev => [...prev, `  Caméra ${index + 1}: ${device.label || 'Sans nom'}`])
    })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test des Permissions WebRTC</h1>
        
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Périphériques détectés</h2>
            <Button onClick={checkDevices} className="mb-4">
              Vérifier les périphériques
            </Button>
          </div>
          
          <div className="bg-card rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Test des permissions</h2>
            <div className="space-y-2">
              <Button onClick={testPermissions} className="w-full">
                Tester les permissions (Audio + Vidéo)
              </Button>
              <Button onClick={() => testAudioOnly()} variant="outline" className="w-full">
                Tester audio uniquement (Appel vocal)
              </Button>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Logs</h2>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <Button onClick={() => window.location.href = '/'}>
            Retour à l'application
          </Button>
        </div>
      </div>
    </div>
  )
}
