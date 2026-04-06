import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PILLARS } from '../data/pillars';
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Chart as ChartJS,
} from 'chart.js';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type PillarPercent = {
  ego?: number;
  love?: number;
};

type RadarChartProps = {
  pillarPercentMap?: Record<string, PillarPercent>;
};

export default function RadarChart({ pillarPercentMap }: RadarChartProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS<'radar'> | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = PILLARS.map(p => t(`pillars.${p.id}.name`));
    const egoData = PILLARS.map(p => pillarPercentMap?.[p.id]?.ego ?? 50);
    const loveData = PILLARS.map(p => pillarPercentMap?.[p.id]?.love ?? 50);

    chartRef.current = new Chart(ref.current, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'EGO',
            data: egoData,
            backgroundColor: 'rgba(184,134,11,0.15)',
            borderColor: 'rgba(184,134,11,0.8)',
            pointBackgroundColor: 'rgba(184,134,11,1)',
            borderWidth: 2,
          },
          {
            label: 'LOVE',
            data: loveData,
            backgroundColor: 'rgba(91,33,182,0.15)',
            borderColor: 'rgba(91,33,182,0.8)',
            pointBackgroundColor: 'rgba(91,33,182,1)',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, font: { size: 9 } },
            pointLabels: { font: { size: 10, weight: '600' } },
          },
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [pillarPercentMap, t]);

  return (
    <div className="max-w-sm mx-auto">
      <canvas ref={ref} />
    </div>
  );
}