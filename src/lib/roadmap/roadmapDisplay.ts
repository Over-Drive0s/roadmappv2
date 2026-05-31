export function formatRoadmapDisplayName(username: string) {
  return (
    username
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'User'
  )
}

export function getProfileInitials(username: string) {
  const parts = username.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const ROADMAP_LOGO_SRC = `${import.meta.env.BASE_URL ?? '/'}over-drive-logo.png`

export const PROFILE_PICTURE_MAX_BYTES = 2 * 1024 * 1024
export const PROFILE_PICTURE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

export function readProfilePictureFile(file: File): Promise<{ dataUrl: string } | { error: string }> {
  if (!file.type.startsWith('image/')) {
    return Promise.resolve({ error: 'Please choose an image file.' })
  }

  if (file.size > PROFILE_PICTURE_MAX_BYTES) {
    return Promise.resolve({ error: 'Image must be 2 MB or smaller.' })
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({ dataUrl: reader.result })
      } else {
        resolve({ error: 'Could not read that image.' })
      }
    }
    reader.onerror = () => resolve({ error: 'Could not read that image.' })
    reader.readAsDataURL(file)
  })
}
