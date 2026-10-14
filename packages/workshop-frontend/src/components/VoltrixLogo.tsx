export default function VoltrixLogo({
  size = 22,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Voltrix"
    >
      <defs>
        <linearGradient id="vlx-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="vlx-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="vlx-core" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#070913" stroke="#1e2238" strokeWidth="1.5" />
      <circle cx="32" cy="34" r="16" fill="#38bdf8" fillOpacity="0.12" />
      <circle cx="44" cy="24" r="12" fill="#a855f7" fillOpacity="0.15" />
      <path
        d="M32 50 L48 18 C48.5 17 51 17 51.5 18 C52 19 50.5 21 49.5 23 L35 52 C34 54 32 54 31 52 Z"
        fill="url(#vlx-purple)"
      />
      <path
        d="M14.5 18 C14 17 16.5 17 17 18 L32 50 C32.5 51 31.5 53 30 51 L13 22 C12 20 13.5 18 14.5 18 Z"
        fill="url(#vlx-cyan)"
      />
      <polygon points="32,24 41,17 32,46 23,17" fill="#0b0f19" fillOpacity="0.9" />
      <path d="M21 20 L32 44 L43 20 L37 20 L32 32 L27 20 Z" fill="url(#vlx-core)" fillOpacity="0.95" />
      <circle cx="32" cy="44" r="2.5" fill="#ffffff" />
    </svg>
  )
}
