'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  contactName: string
  contactAvatar?: string
  isVideoCall: boolean
  isIncoming?: boolean
  onAccept?: () => void
  onReject?: () => void
  localStream?: MediaStream | null
  remoteStream?: MediaStream | null
}

export function CallModal({
  isOpen,
  onClose,
  contactName,
  contactAvatar,
  isVideoCall,
  isIncoming = false,
  onAccept,
  onReject,
  localStream,
  remoteStream
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing')
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (callStatus === 'connected') {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [callStatus])

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, isOpen])

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('Attaching remote stream to video element')
      remoteVideoRef.current.srcObject = remoteStream
      setCallStatus('connected')
    }
  }, [remoteStream, isOpen])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAccept = () => {
    setCallStatus('connecting')
    onAccept?.()
    // status will be set to 'connected' when remoteStream arrives
  }

  const handleReject = () => {
    setCallStatus('ended')
    onReject?.()
    setTimeout(() => onClose(), 500)
  }

  const handleEndCall = () => {
    setCallStatus('ended')
    onClose() // endCall in context already handles cleanup
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black ${isFullscreen ? '' : 'bg-black/80'}`}>
      {/* Media Elements */}
      <div className={isVideoCall ? "absolute inset-0" : "sr-only"}>
        {/* Remote Media (Video or Audio) */}
        <video
          ref={remoteVideoRef}
          className={isVideoCall ? "w-full h-full object-cover" : "opacity-0 size-0"}
          autoPlay
          playsInline
        />
        
        {/* Local Video - Picture in Picture */}
        {isVideoCall && (
          <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}
      </div>

      {/* Call Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white">
        {/* Avatar for voice calls or when video is off */}
        {(!isVideoCall || isVideoOff) && (
          <div className="mb-8">
            <Avatar className="w-32 h-32">
              <AvatarImage src={contactAvatar} />
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                {contactName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Contact Info */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">{contactName}</h2>
          <p className="text-lg opacity-80">
            {isIncoming && callStatus === 'ringing' && 'Appel entrant...'}
            {!isIncoming && callStatus === 'ringing' && 'Appel en cours...'}
            {callStatus === 'connecting' && 'Connexion...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Appel terminé'}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex items-center gap-4">
          {isIncoming && callStatus === 'ringing' ? (
            <>
              <Button
                onClick={handleReject}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                onClick={handleAccept}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </>
          ) : (
            <>
              {/* Mute Button */}
              <Button
                onClick={toggleMute}
                size="lg"
                variant="secondary"
                className={`rounded-full p-4 ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              {/* Video Toggle (for video calls) */}
              {isVideoCall && (
                <Button
                  onClick={toggleVideo}
                  size="lg"
                  variant="secondary"
                  className={`rounded-full p-4 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white'}`}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </Button>
              )}

              {/* End Call */}
              <Button
                onClick={handleEndCall}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>

              {/* Fullscreen (for video calls) */}
              {isVideoCall && (
                <Button
                  onClick={toggleFullscreen}
                  size="lg"
                  variant="secondary"
                  className="bg-gray-700 text-white rounded-full p-4"
                >
                  {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
