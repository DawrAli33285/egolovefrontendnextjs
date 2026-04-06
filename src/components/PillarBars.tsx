import { useTranslation } from 'react-i18next';
import { PILLARS } from '../data/pillars';

interface PillarPercent {
  ego: number;
  love: number;
}

interface PillarTranslation {
  name: string;
}

interface PillarBarsProps {
  pillarPercentMap?: Record<number, PillarPercent>;
}

export default function PillarBars({ pillarPercentMap }: PillarBarsProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm max-w-xl mx-auto">
      <h3 className="text-base font-bold text-indigo-950 mb-4">{t('results.pillarsTitle')}</h3>
      {PILLARS.map((p) => {
        const pp: PillarPercent = pillarPercentMap?.[p.id] ?? { ego: 50, love: 50 };
        const pillarT = t(`pillars.${p.id}`, { returnObjects: true }) as PillarTranslation;

        return (
          <div key={p.id} className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-700">
                {p.icon} {pillarT.name}
              </span>
              <span className="text-xs text-gray-400">
                EGO {pp.ego}% · LOVE {pp.love}%
              </span>
            </div>
            <div className="h-5 bg-gray-100 rounded-sm overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-yellow-500 to-yellow-700 flex items-center justify-center text-white text-[8px] font-bold transition-all duration-700"
                style={{ width: `${pp.ego}%`, minWidth: pp.ego > 0 ? 20 : 0 }}
              >
                {pp.ego > 10 ? `${pp.ego}%` : ''}
              </div>
              <div
                className="bg-gradient-to-r from-violet-400 to-violet-700 flex items-center justify-center text-white text-[8px] font-bold transition-all duration-700"
                style={{ width: `${pp.love}%`, minWidth: pp.love > 0 ? 20 : 0 }}
              >
                {pp.love > 10 ? `${pp.love}%` : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}