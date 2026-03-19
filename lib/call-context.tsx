'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import Peer from 'simple-peer'
import { useAuth } from './auth-context'

// Polyfill pour simple-peer qui dépend de global/process
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { 
    nextTick: (fn: any) => setTimeout(fn, 0),
    env: {}
  };
}

export interface CallContextType {
  isCallActive: boolean
  isCallIncoming: boolean
  showPermissionModal: boolean
  currentCall: {
    id: string
    contactId: string
    contactName: string
    contactAvatar?: string
    isVideoCall: boolean
  } | null
  socket: Socket | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  
  // Actions
  initiateCall: (contactId: string, contactName: string, isVideoCall: boolean, contactAvatar?: string) => void
  answerCall: () => void
  rejectCall: () => void
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  initializeSocket: () => void
  showPermissionGuide: () => void
  hidePermissionGuide: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isCallActive, setIsCallActive] = useState(false)
  const [isCallIncoming, setIsCallIncoming] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [currentCall, setCurrentCall] = useState<CallContextType['currentCall']>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peer, setPeer] = useState<Peer.Instance | null>(null)
  
  const peerRef = useRef<Peer.Instance | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const endCall = useCallback(() => {
    console.log('endCall appelé - réinitialisation complète')
    
    // Clean up peer connection
    if (peerRef.current && !peerRef.current.destroyed) {
      peerRef.current.destroy()
    }
    peerRef.current = null
    setPeer(null)

    // Clean up streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
    }
    setLocalStream(null)
    setRemoteStream(null)

    // Reset call state
    setIsCallActive(false)
    setIsCallIncoming(false)
    setShowPermissionModal(false)
    setCurrentCall(null)

    // Notify other user via API
    if (currentCall) {
      fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'end-call',
          callId: currentCall.id
        })
      }).catch(console.error)
    }

    // Also notify via socket if available
    if (socket && currentCall) {
      socket.emit('end-call', {
        callId: currentCall.id
      })
    }
  }, [localStream, remoteStream, socket, currentCall])

  const initializeSocket = useCallback(() => {
    if (typeof window !== 'undefined' && !socket) {
      console.log('Tentative de connexion Socket.IO...')
      try {
        const socketInstance = (require('socket.io-client') as any).io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')
        
        socketInstance.on('connect', () => console.log('Socket connecté'))
        
        socketInstance.on('incoming-call', (data: any) => {
          console.log('Appel entrant via Socket:', data)
          setCurrentCall({
            id: data.callId,
            contactId: data.callerId,
            contactName: data.callerName,
            contactAvatar: data.callerAvatar,
            isVideoCall: data.isVideoCall
          })
          setIsCallIncoming(true)
        })

        socketInstance.on('call-accepted', (data: any) => {
          console.log('Appel accepté via Socket')
          setIsCallIncoming(false)
          setIsCallActive(true)
        })

        socketInstance.on('webrtc-signal', async (data: any) => {
          if (peerRef.current && !peerRef.current.destroyed) {
            try {
              peerRef.current.signal(data.signal)
            } catch (error) {
              console.error('Error handling WebRTC signal:', error)
            }
          }
        })

        setSocket(socketInstance)
      } catch (e) {
        console.warn('Socket.IO non disponible, utilisation du polling API uniquement')
      }
    }
  }, [socket])

  const createPeer = useCallback(async (isInitiator: boolean, isVideoCall: boolean = true) => {
    if (typeof window !== 'undefined' && !navigator.mediaDevices) {
      alert("Erreur : Votre navigateur bloque l'accès aux média. Sur mobile (iPhone/Android), vous DEVEZ utiliser une connexion HTTPS (ex: via ngrok) pour que l'appel fonctionne.");
      return null;
    }
    
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoCall,
          audio: true
        })
      } catch (deviceError) {
        console.warn('Erreur média, essai fallback audio...')
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      }
      
      setLocalStream(stream)

      const newPeer = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: stream
      })

      newPeer.on('signal', (data) => {
        if (currentCall) {
          // Send signal via API
          fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'webrtc-signal',
              callId: currentCall.id,
              signal: data,
              senderId: user?.id
            })
          }).catch(console.error)

          // Also send via socket if available
          if (socket) {
            socket.emit('webrtc-signal', {
              callId: currentCall.id,
              signal: data
            })
          }
        }
      })

      newPeer.on('stream', (stream) => {
        setRemoteStream(stream)
      })

      newPeer.on('close', () => endCall())
      newPeer.on('error', (err) => {
        console.error('Peer error:', err)
        endCall()
      })

      peerRef.current = newPeer
      setPeer(newPeer)
      return newPeer
    } catch (error) {
      console.error('Error creating peer:', error)
      throw error
    }
  }, [socket, currentCall, user, endCall])

  const initiateCall = useCallback(async (
    contactId: string, 
    contactName: string, 
    isVideoCall: boolean, 
    contactAvatar?: string
  ) => {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      setCurrentCall({
        id: callId,
        contactId,
        contactName,
        contactAvatar,
        isVideoCall
      })
      setIsCallActive(true)
      setIsCallIncoming(false)

      await createPeer(true, isVideoCall)
      
      // Notify via API
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'initiate-call',
          callId,
          recipientId: contactId,
          initiatorId: user?.id,
          initiatorName: user?.username,
          initiatorAvatar: user?.avatar,
          isVideoCall
        })
      })

      if (socket) {
        socket.emit('initiate-call', {
          callId,
          recipientId: contactId,
          isVideoCall
        })
      }
    } catch (error) {
      console.error('Error initiating call:', error)
      if ((error as any).name === 'NotAllowedError' || (error as any).name === 'PermissionDeniedError') {
        setShowPermissionModal(true)
      } else {
        alert('Erreur: ' + (error as any).message)
      }
      endCall()
    }
  }, [socket, user, createPeer, endCall])

  const answerCall = useCallback(async () => {
    try {
      if (!currentCall) return
      await createPeer(false, currentCall.isVideoCall)
      
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'answer-call',
          callId: currentCall.id
        })
      })

      if (socket) {
        socket.emit('answer-call', { callId: currentCall.id })
      }

      setIsCallIncoming(false)
      setIsCallActive(true)
    } catch (error) {
      console.error('Error answering call:', error)
      endCall()
    }
  }, [socket, currentCall, createPeer, endCall])

  const rejectCall = useCallback(() => {
    if (currentCall) {
      fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reject-call',
          callId: currentCall.id
        })
      }).catch(console.error)
      
      if (socket) {
        socket.emit('reject-call', { callId: currentCall.id })
      }
    }
    endCall()
  }, [socket, currentCall, endCall])

  // Polling for signals and incoming calls
  useEffect(() => {
    if (!user) return

    const poll = async () => {
      try {
        // 1. Check for incoming calls if not already in one
        if (!currentCall) {
          const res = await fetch(`/api/calls?type=incoming&userId=${user.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.call) {
              console.log('Nouvel appel détecté via polling:', data.call)
              setCurrentCall({
                id: data.call.id,
                contactId: data.call.initiatorId,
                contactName: data.call.initiatorName,
                contactAvatar: data.call.initiatorAvatar,
                isVideoCall: data.call.isVideoCall
              })
              setIsCallIncoming(true)
            }
          }
        } 
        
        // 2. Check for signals if in a call AND peer is ready
        if (currentCall && peerRef.current) {
          const res = await fetch(`/api/calls?type=get-signals&callId=${currentCall.id}&userId=${user.id}`)
          if (res.ok) {
            const { signals } = await res.json()
            if (signals && signals.length > 0) {
              console.log(`${signals.length} signaux reçus via polling`)
              for (const signal of signals) {
                if (peerRef.current && !peerRef.current.destroyed) {
                  peerRef.current.signal(signal)
                }
              }
            }
          }
          
          // 3. Check if call was ended by other party (only if we are NOT purely in incoming state)
          if (isCallActive) {
            const statusRes = await fetch(`/api/calls?callId=${currentCall.id}`)
            if (statusRes.status === 404) {
              console.log('Appel terminé par l\'autre partie')
              endCall()
            }
          }
        }
      } catch (e) {
        console.error('Polling error:', e)
      }
    }

    pollingIntervalRef.current = setInterval(poll, 3000) // Un peu plus lent pour éviter de surcharger
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [user, currentCall, isCallActive, isCallIncoming, endCall])

  const value: CallContextType = {
    isCallActive,
    isCallIncoming,
    showPermissionModal,
    currentCall,
    socket,
    localStream,
    remoteStream,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute: () => {
      if (localStream) {
        localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled)
      }
    },
    toggleVideo: () => {
      if (localStream) {
        localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled)
      }
    },
    initializeSocket,
    showPermissionGuide: () => setShowPermissionModal(true),
    hidePermissionGuide: () => setShowPermissionModal(false)
  }

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}
