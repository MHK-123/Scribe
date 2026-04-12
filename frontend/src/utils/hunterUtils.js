/**
 * Hunter Rank Identity System
 * Maps user stats to thematic rank labels and styles.
 */

export const getHunterRank = (level = 1, rank = null) => {
  // Primary priority: Global Leaderboard Rank
  if (rank !== null) {
    if (rank === 1) return { label: 'S-Rank Hunter', color: '#facc15', shadow: 'rgba(250,204,21,0.4)', bg: 'rgba(250,204,21,0.1)' };
    if (rank === 2) return { label: 'A-Rank Hunter', color: '#c084fc', shadow: 'rgba(192,132,252,0.4)', bg: 'rgba(192,132,252,0.1)' };
    if (rank === 3) return { label: 'B-Rank Hunter', color: '#60a5fa', shadow: 'rgba(96,165,250,0.4)', bg: 'rgba(96,165,250,0.1)' };
    if (rank <= 10) return { label: 'C-Rank Hunter', color: '#94a3b8', shadow: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.1)' };
    return { label: 'Hunter', color: '#64748b', shadow: 'transparent', bg: 'rgba(100,116,139,0.05)' };
  }

  // Secondary priority: Level-based Tiers (for Profile/Header)
  if (level >= 15) return { label: 'S-Rank Hunter', color: '#facc15', shadow: 'rgba(250,204,21,0.4)', bg: 'rgba(250,204,21,0.1)' };
  if (level >= 10) return { label: 'A-Rank Hunter', color: '#c084fc', shadow: 'rgba(192,132,252,0.4)', bg: 'rgba(192,132,252,0.1)' };
  if (level >= 7) return { label: 'B-Rank Hunter', color: '#60a5fa', shadow: 'rgba(96,165,250,0.4)', bg: 'rgba(96,165,250,0.1)' };
  if (level >= 3) return { label: 'Iron Hunter', color: '#94a3b8', shadow: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.1)' };
  
  return { label: 'Hunter', color: '#64748b', shadow: 'transparent', bg: 'rgba(100,116,139,0.05)' };
};
