export interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture?: string
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Could not load your Google account details.')
  }

  const data = (await response.json()) as {
    sub?: string
    email?: string
    name?: string
    picture?: string
  }

  if (!data.sub || !data.email) {
    throw new Error('Google did not return the required account information.')
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name?.trim() || data.email.split('@')[0],
    picture: data.picture,
  }
}
