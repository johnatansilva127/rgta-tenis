export default function Logo({ size = 96 }) {
  return (
    <img
      src="/logo-rgta.png"
      width={size}
      height={size}
      alt="RGTA — Ranking Geral de Tênis Amador"
      style={{ display: 'block', borderRadius: '50%' }}
    />
  )
}
