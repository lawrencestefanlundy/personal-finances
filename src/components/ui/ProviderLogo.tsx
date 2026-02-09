'use client';

import { getFaviconUrl } from '@/data/providers';

interface ProviderLogoProps {
  provider?: string;
  size?: number;
  className?: string;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

function getColorForProvider(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function LetterAvatar({ provider, size, className, hidden = false }: {
  provider: string;
  size: number;
  className: string;
  hidden?: boolean;
}) {
  const letter = provider.charAt(0).toUpperCase();
  const bgColor = getColorForProvider(provider);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm flex-shrink-0 text-white font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        backgroundColor: bgColor,
        display: hidden ? 'none' : 'inline-flex',
      }}
      title={provider}
    >
      {letter}
    </span>
  );
}

export default function ProviderLogo({ provider, size = 20, className = '' }: ProviderLogoProps) {
  if (!provider) return null;

  const faviconUrl = getFaviconUrl(provider, size * 2); // 2x for retina

  if (faviconUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt={provider}
          width={size}
          height={size}
          className={`rounded-sm inline-block flex-shrink-0 ${className}`}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling;
            if (fallback) (fallback as HTMLElement).style.display = 'inline-flex';
          }}
        />
        <LetterAvatar provider={provider} size={size} className={className} hidden />
      </>
    );
  }

  return <LetterAvatar provider={provider} size={size} className={className} />;
}
