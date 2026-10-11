import React, { useState } from 'react';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  avatarColor?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'rounded' | 'circle' | 'square';
  className?: string;
  showOnline?: boolean;
  isOnline?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px] rounded-lg',
  sm: 'w-8 h-8 text-xs rounded-xl',
  md: 'w-10 h-10 text-sm rounded-xl',
  lg: 'w-12 h-12 text-base rounded-2xl',
  xl: 'w-16 h-16 text-xl rounded-2xl',
  '2xl': 'w-20 h-20 sm:w-24 sm:h-24 text-3xl sm:text-4xl rounded-2xl sm:rounded-3xl',
};

const COLOR_MAP: Record<string, { border: string; text: string; bg: string }> = {
  orange: { border: 'border-orange-500/60', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  blue: { border: 'border-sky-500/60', text: 'text-sky-400', bg: 'bg-sky-500/10' },
  purple: { border: 'border-purple-500/60', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  green: { border: 'border-emerald-500/60', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  pink: { border: 'border-pink-500/60', text: 'text-pink-400', bg: 'bg-pink-500/10' },
  teal: { border: 'border-teal-500/60', text: 'text-teal-400', bg: 'bg-teal-500/10' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  avatarColor = 'orange',
  name = 'User',
  size = 'md',
  shape = 'rounded',
  className = '',
  showOnline = false,
  isOnline = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase();

  const colorStyle = (avatarColor && COLOR_MAP[avatarColor]) || {
    border: 'border-accent/60',
    text: 'text-accent',
    bg: 'bg-accent/10',
  };

  const isHexColor = avatarColor?.startsWith('#');
  const customColorStyle = isHexColor
    ? {
        borderColor: `${avatarColor}99`,
        color: avatarColor,
        backgroundColor: `${avatarColor}1A`,
      }
    : undefined;

  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-none' : '';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden font-bit font-bold select-none transition-all ${
        SIZE_CLASSES[size]
      } ${shapeClass} ${
        !avatarUrl || hasError
          ? `border ${colorStyle.border} ${colorStyle.text} ${colorStyle.bg} shadow-sm`
          : 'border border-white/20 bg-zinc-900 shadow-md'
      } ${className}`}
      style={!avatarUrl || hasError ? customColorStyle : undefined}
    >
      {avatarUrl && !hasError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="leading-none drop-shadow-sm">{initial}</span>
      )}

      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-paper ${
            isOnline ? 'bg-emerald-400' : 'bg-zinc-500'
          }`}
        />
      )}
    </div>
  );
};

export default UserAvatar;
