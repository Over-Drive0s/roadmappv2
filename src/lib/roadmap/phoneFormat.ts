export function stripPhoneDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function formatPhoneNumber(value: string) {
  const digits = stripPhoneDigits(value)

  if (!digits) return ''

  if (digits.length <= 3) {
    return `(${digits}`
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.startsWith('1') && digits.length <= 11) {
    const national = digits.slice(1)
    return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 10)}`
  }

  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`
}

export function isValidPhoneNumber(value: string) {
  const digits = stripPhoneDigits(value)
  return digits.length === 0 || digits.length >= 10
}

export const PHONE_INPUT_PLACEHOLDER = '(555) 555-5555'
