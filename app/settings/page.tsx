'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Bell, Shield, Palette, HelpCircle, LogOut, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { AuthUser } from '@/lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleUserUpdate = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser)
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card pb-4 pl-4 pr-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-foreground">{currentUser.username}</h3>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">Status: {currentUser.status}</p>
                </div>
              </div>
              <EditProfileDialog user={currentUser} onUserUpdate={handleUserUpdate}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 size-4" />
                  Edit
                </Button>
              </EditProfileDialog>
            </div>
          </CardContent>
        </Card>

        {/* Settings Options */}
        <div className="space-y-2">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="size-5 text-muted-foreground" />
                <span className="text-foreground">Notifications</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Shield className="size-5 text-muted-foreground" />
                <span className="text-foreground">Privacy & Security</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Palette className="size-5 text-muted-foreground" />
                <span className="text-foreground">Appearance</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <HelpCircle className="size-5 text-muted-foreground" />
                <span className="text-foreground">Help & Support</span>
              </div>
              <span className="text-sm text-muted-foreground">→</span>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Card className="mt-6 border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full"
            >
              <LogOut className="mr-2 size-4" />
              {isLoading ? 'Logging out...' : 'Log out'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
