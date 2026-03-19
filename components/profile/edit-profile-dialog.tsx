'use client'

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import type { AuthUser } from '@/lib/auth'

interface EditProfileDialogProps {
  children: React.ReactNode
  user: AuthUser
  onUserUpdate?: (user: AuthUser) => void
}

export function EditProfileDialog({ children, user, onUserUpdate }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: user.username,
    avatar: user.avatar || '',
    status: user.status,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.error === 'Username already taken') {
          setErrors({ username: 'This username is already taken' })
        } else if (error.details) {
          const fieldErrors: Record<string, string> = {}
          error.details.fieldErrors?.forEach((fieldError: string[], index: number) => {
            const fieldName = ['username', 'avatar', 'status'][index]
            fieldErrors[fieldName] = fieldError.join(', ')
          })
          setErrors(fieldErrors)
        } else {
          setErrors({ general: error.error || 'Failed to update profile' })
        }
        return
      }

      const { user: updatedUser } = await response.json()
      onUserUpdate?.(updatedUser)
      setOpen(false)
    } catch (error) {
      setErrors({ general: 'Failed to update profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage src={formData.avatar || undefined} alt={formData.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {formData.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Camera className="size-4" />
              Change Photo
            </Button>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
              className={errors.username ? 'border-destructive' : ''}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              value={formData.avatar}
              onChange={(e) => handleInputChange('avatar', e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className={errors.avatar ? 'border-destructive' : ''}
            />
            {errors.avatar && (
              <p className="text-sm text-destructive">{errors.avatar}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">🟢 Online</SelectItem>
                <SelectItem value="away">🟡 Away</SelectItem>
                <SelectItem value="offline">⚫ Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {errors.general && (
            <p className="text-sm text-destructive">{errors.general}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
