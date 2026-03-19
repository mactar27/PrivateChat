import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ChatPage } from '@/components/chat/chat-page'

export default async function Home() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <ChatPage initialUser={user} />
}
