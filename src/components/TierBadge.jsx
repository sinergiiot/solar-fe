export default function TierBadge({ tier }) {
  if (!tier) return null;
  
  const label = tier.toLowerCase() === 'enterprise' ? 'Enterprise' : 
                tier.toLowerCase() === 'pro' ? 'Pro' : 'Free';
  
  return (
    <span className={`tier-badge tier-badge-${tier.toLowerCase()}`}>
      {label}
    </span>
  );
}
