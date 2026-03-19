export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  lastSeen?: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  timestamp: Date
  status: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file' | 'audio'
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  groupName?: string
  groupAvatar?: string
  createdAt: Date
  updatedAt: Date
}
