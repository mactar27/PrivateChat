'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SimpleWebRTCTest() {
  const [logs, setLogs] = useState<string[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)

  const testSimpleCall = async () => {
    try {
      setLogs(prev => [...prev, '🎯 Test simple WebRTC...'])
      
      // Test le plus basique possible
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })
      
      setLogs(prev => [...prev, '✅ MediaStream créé!'])
      setLogs(prev => [...prev, `🎤 Pistes audio: ${mediaStream.getAudioTracks().length}`])
      setLogs(prev => [...prev, `📹 Pistes vidéo: ${mediaStream.getVideoTracks().length}`])
      
      // Garder le flux actif
      setStream(mediaStream)
      setLogs(prev => [...prev, '🔊 Flux gardé actif (pas d\'arrêt automatique)'])
      
    } catch (error: any) {
      setLogs(prev => [...prev, `❌ Erreur: ${error.name}`])
      setLogs(prev => [...prev, `📝 Message: ${error.message}`])
      setLogs(prev => [...prev, `🔍 Stack: ${error.stack || 'Pas de stack'}`])
    }
  }

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setLogs(prev => [...prev, '🛑 Flux arrêté manuellement'])
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test WebRTC Simplifié</h1>
        
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Diagnostic WebRTC</h2>
            <div className="space-y-2">
              <Button onClick={testSimpleCall} className="w-full">
                🎤 Test Audio Seulement (Simple)
              </Button>
              <Button onClick={stopStream} variant="outline" className="w-full">
                🛑 Arrêter le flux
              </Button>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-2">
              <div className="text-sm">
                Flux actif: {stream ? '✅ OUI' : '❌ NON'}
              </div>
              {stream && (
                <div className="text-sm">
                  Pistes audio: {stream.getAudioTracks().length}
                </div>
              )}
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
            Retour à l'application
          </Button>
        </div>
      </div>
    </div>
  )
}
