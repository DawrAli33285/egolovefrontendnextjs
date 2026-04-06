export interface Pillar {
    id: number;
    icon: string;
    weight: number;
  }
  
  export interface PillarScore {
    egoScore: number;
    loveScore: number;
    weight: number;
  }
  
  export interface GlobalScores {
    ego: number;
    love: number;
  }
  
  export const PILLARS: Pillar[] = [
    { id: 1, icon: '🧭', weight: 1.2 },
    { id: 2, icon: '🎭', weight: 1.0 },
    { id: 3, icon: '❤️', weight: 1.3 },
    { id: 4, icon: '🤝', weight: 1.1 },
    { id: 5, icon: '🧘', weight: 1.2 },
    { id: 6, icon: '🎁', weight: 0.9 },
    { id: 7, icon: '🙏', weight: 0.8 },
    { id: 8, icon: '🦉', weight: 1.0 },
    { id: 9, icon: '☮️', weight: 0.7 },
  ];
  
  export function calcGlobalScores(pillarScores: PillarScore[]): GlobalScores {
    let totalWeight = 0;
    let weightedEgo = 0;
    let weightedLove = 0;
    for (const p of pillarScores) {
      weightedEgo += p.egoScore * p.weight;
      weightedLove += p.loveScore * p.weight;
      totalWeight += p.weight;
    }
    return {
      ego: Math.round(weightedEgo / totalWeight),
      love: Math.round(weightedLove / totalWeight),
    };
  }
  
  export function getAvatar(egoPercent: number): string {
    if (egoPercent < 30) return 'awakened';
    if (egoPercent < 50) return 'awakening';
    if (egoPercent < 70) return 'tension';
    return 'dominant';
  }