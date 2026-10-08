// Platform brand icons (simple-icons, CC0). Platforms without a published mark use a generic lucide icon.
// Every icon carries the platform name for screen readers and as a hover tooltip.
import { siBluesky, siBuymeacoffee, siFacebook, siInstagram, siKofi, siStreamlabs, siTiktok, siTwitch, siX, siYoutube } from 'simple-icons';
import { Gem, Globe, HandHeart, Link2 } from 'lucide-react';
import { platformLabel } from '../lib/api.js';

const BRANDS = {
  youtube: siYoutube, x: siX, twitch: siTwitch, bluesky: siBluesky, tiktok: siTiktok,
  facebook: siFacebook, instagram: siInstagram, kofi: siKofi, buymeacoffee: siBuymeacoffee, streamlabs: siStreamlabs,
};
const FALLBACK = {
  website: Globe, easydonate: HandHeart, tipjai: HandHeart, sociabuzz: HandHeart, streamelements: HandHeart,
  ganknow: Gem, fansly: Gem,
};
// Brand colours that disappear on our dark background are drawn in near-white instead.
const DARK = new Set(['000000', '181717']);

export default function PlatformIcon({ name, size = 16, mono = false, className = '' }) {
  const label = platformLabel(name);
  const brand = BRANDS[name];
  if (brand) {
    const fill = mono || DARK.has(brand.hex) ? 'currentColor' : `#${brand.hex}`;
    return (
      <svg role="img" aria-label={label} viewBox="0 0 24 24" width={size} height={size} className={`shrink-0 ${className}`} fill={fill}>
        <title>{label}</title>
        <path d={brand.path} />
      </svg>
    );
  }
  const Icon = FALLBACK[name] || Link2;
  return (
    <span role="img" aria-label={label} title={label} className={`inline-flex shrink-0 ${className}`}>
      <Icon size={size} aria-hidden="true" />
    </span>
  );
}

/** Icon followed by the name in small text, for places where the name still helps (tabs, legends). */
export function PlatformTag({ name, size = 15, showName = false }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={platformLabel(name)}>
      <PlatformIcon name={name} size={size} />
      {showName && <span>{platformLabel(name)}</span>}
    </span>
  );
}
