import { NextRequest, NextResponse } from 'next/server'

// Mock call signaling - in production, you'd use Socket.IO or WebSocket
// Using global to persist across hot reloads in development
const globalCalls = global as any
if (!globalCalls.activeCalls) globalCalls.activeCalls = new Map()
if (!globalCalls.callSignals) globalCalls.callSignals = new Map()

const activeCalls = globalCalls.activeCalls
const callSignals = globalCalls.callSignals

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, callId, signal, recipientId, initiatorId, initiatorName, initiatorAvatar, isVideoCall, senderId } = body

    switch (type) {
      case 'initiate-call':
        activeCalls.set(callId, {
          id: callId,
          initiatorId,
          initiatorName,
          initiatorAvatar,
          recipientId,
          isVideoCall,
          createdAt: new Date()
        })
        console.log(`Call initiated: ${callId} from ${initiatorId} to ${recipientId}`)
        return NextResponse.json({ success: true })

      case 'answer-call':
        console.log(`Call answered: ${callId}`)
        return NextResponse.json({ success: true })

      case 'reject-call':
        activeCalls.delete(callId)
        console.log(`Call rejected: ${callId}`)
        return NextResponse.json({ success: true })

      case 'end-call':
        activeCalls.delete(callId)
        callSignals.delete(callId)
        console.log(`Call ended: ${callId}`)
        return NextResponse.json({ success: true })

      case 'webrtc-signal':
        if (!callSignals.has(callId)) {
          callSignals.set(callId, [])
        }
        // Store signal with sender info to avoid echo
        callSignals.get(callId)?.push({ signal, senderId })
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Call signaling error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const callId = searchParams.get('callId')
  const userId = searchParams.get('userId')

  // Handle incoming call check
  if (type === 'incoming') {
    const recipientId = searchParams.get('userId')
    for (const [id, call] of activeCalls.entries()) {
      if (call.recipientId === recipientId) {
        return NextResponse.json({ call })
      }
    }
    return NextResponse.json({ call: null })
  }

  if (!callId) {
    return NextResponse.json({ error: 'Call ID required' }, { status: 400 })
  }

  if (type === 'get-signals') {
    const signals = callSignals.get(callId) || []
    // Only return signals NOT sent by this user
    const pendingSignals = signals
      .filter((s: any) => s.senderId !== userId)
      .map((s: any) => s.signal)
    
    // Clear signals for this user (in a real app, track read status per user)
    callSignals.set(callId, signals.filter((s: any) => s.senderId === userId))
    
    return NextResponse.json({ signals: pendingSignals })
  }

  const call = activeCalls.get(callId)
  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  }

  return NextResponse.json(call)
}
