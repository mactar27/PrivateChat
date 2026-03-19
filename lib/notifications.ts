'use client'

export const NOTIFICATION_SETTINGS_KEY = 'whatsapp_notification_settings'

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
}

export const getNotificationSettings = (): NotificationSettings => {
  if (typeof window === 'undefined') return { enabled: true, sound: true }
  const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY)
  if (!saved) return { enabled: true, sound: true }
  try {
    return JSON.parse(saved)
  } catch (e) {
    return { enabled: true, sound: true }
  }
}

export const saveNotificationSettings = (settings: NotificationSettings) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings))
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Simple beep sound using Web Audio API
export const playNotificationSound = () => {
  const settings = getNotificationSettings()
  if (!settings.sound) return

  if (typeof window === 'undefined' || !window.AudioContext && !('webkitAudioContext' in window)) return

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch (e) {
    console.warn('Failed to play notification sound', e)
  }
}

export const showNotification = (title: string, options: NotificationOptions) => {
  const settings = getNotificationSettings()
  if (!settings.enabled) return

  if (typeof window === 'undefined' || !('Notification' in window)) return

  if (Notification.permission === 'granted') {
    new Notification(title, options)
    playNotificationSound()
  }
}
