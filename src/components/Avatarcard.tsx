import { useTranslation } from 'react-i18next';
import { getAvatar } from '../data/pillars';

interface AvatarTranslation {
  icon: string;
  name: string;
  range: string;
  desc: string;
  quote: string;
}

const avatarStyles: Record<string, string> = {
  awakened:  'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50',
  awakening: 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50',
  tension:   'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50',
  dominant:  'border-yellow-700 bg-gradient-to-br from-yellow-50 to-orange-50',
};

interface AvatarCardProps {
  egoPercent: number;
}

export default function AvatarCard({ egoPercent }: AvatarCardProps) {
  const { t } = useTranslation();
  const avatarKey = getAvatar(egoPercent);
  const av = t(`avatars.${avatarKey}`, { returnObjects: true }) as AvatarTranslation;
  const style = avatarStyles[avatarKey] ?? '';

  return (
    <div className={`border-2 rounded-2xl p-6 text-center max-w-md mx-auto ${style}`}>
      <div className="text-5xl mb-2">{av.icon}</div>
      <div className="text-xl font-black text-indigo-950 mb-1">{av.name}</div>
      <div className="text-xs text-gray-500 mb-3">{av.range}</div>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{av.desc}</p>
      <p className="text-xs italic text-purple-700 leading-snug">{av.quote}</p>
    </div>
  );
}