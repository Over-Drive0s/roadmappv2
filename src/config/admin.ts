export const ADMIN_USERNAME = 'goldie'
export const ADMIN_PASSWORD = 'pushingP'

export function isAdminCredentialMatch(username: string, password: string) {
  return (
    username.trim().toLowerCase() === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  )
}

export function isAdminProfile(profile: { username?: string } | null | undefined) {
  return profile?.username?.trim().toLowerCase() === ADMIN_USERNAME
}
