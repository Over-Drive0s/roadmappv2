export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''

export const isGoogleConnectConfigured = Boolean(GOOGLE_CLIENT_ID)
