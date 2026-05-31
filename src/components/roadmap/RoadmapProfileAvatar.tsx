import { formatRoadmapDisplayName, getProfileInitials } from '../../lib/roadmap/roadmapDisplay'

export default function RoadmapProfileAvatar({
  username,
  profilePicture,
  size = 'md',
  className = '',
}: {
  username: string
  profilePicture?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClass = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-16 w-16 text-base',
    lg: 'h-24 w-24 text-xl',
  }[size]

  const displayName = formatRoadmapDisplayName(username)
  const initials = getProfileInitials(username)

  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt={displayName}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 ring-2 ring-white ${sizeClass} ${className}`}
      aria-hidden={true}
    >
      {initials}
    </span>
  )
}
