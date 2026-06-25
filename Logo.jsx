export default function Logo({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="58" fill="#ED7620" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".7" />
      <g opacity=".35" stroke="#fff" strokeWidth="1.2" fill="none">
        <circle cx="60" cy="60" r="40" />
        <path d="M28 44 Q60 60 92 44" />
        <path d="M28 76 Q60 60 92 76" />
      </g>
      <text x="60" y="58" textAnchor="middle" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="38" fill="#1c1c1c">RG</text>
      <text x="60" y="86" textAnchor="middle" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="30" fill="#1c1c1c">TA</text>
    </svg>
  )
}
