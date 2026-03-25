export default function TierBadge({ tier, onClick }) {
  if (!tier) return null;
  
  const label = tier.toLowerCase() === 'enterprise' ? 'Enterprise' : 
                tier.toLowerCase() === 'pro' ? 'Pro' : 'Free';
  
  return (
    <span 
      className={`tier-badge tier-badge-${tier.toLowerCase()}`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={onClick ? 'Klik untuk upgrade atau ganti paket' : ''}
    >
      {label}
    </span>
  );
}
