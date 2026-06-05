import React from 'react';

interface IcoProps { d: React.ReactNode; size?: number; stroke?: number; fill?: string; style?: React.CSSProperties; }
export const Ico = ({ d, size = 20, stroke = 1.8, fill = 'none', style }: IcoProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>{d}</svg>
);

export const ICONS = {
  back:   <Ico d={<path d="M15 18l-6-6 6-6" />} />,
  next:   <Ico d={<path d="M9 18l6-6-6-6" />} />,
  plus:   <Ico d={<path d="M12 5v14M5 12h14" />} />,
  check:  <Ico d={<path d="M5 12l5 5L20 7" />} />,
  x:      <Ico d={<path d="M6 6l12 12M18 6L6 18" />} />,
  star:   <Ico d={<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />} fill="currentColor" stroke="none" />,
  spark:  <Ico d={<g><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></g>} />,
  flame:  <Ico d={<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6 0 2-2 3-2 3s-1-3-1-6c-3 2-6 5-6 9 0 4 3 7 5 7z" />} />,
  book:   <Ico d={<path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5zM4 17h14" />} />,
  cards:  <Ico d={<g><rect x="3" y="6" width="14" height="14" rx="2" /><path d="M7 6V4a1 1 0 011-1h12a1 1 0 011 1v14" /></g>} />,
  pdf:    <Ico d={<g><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6" /></g>} />,
  pencil: <Ico d={<g><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z" /></g>} />,
  speaker:<Ico d={<g><path d="M11 5L6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 010 7" /></g>} />,
  printer:<Ico d={<g><path d="M6 9V2h12v7" /><rect x="6" y="14" width="12" height="8" /><path d="M6 14H4a2 2 0 01-2-2V11a2 2 0 012-2h16a2 2 0 012 2v1a2 2 0 01-2 2h-2" /></g>} />,
  trash:  <Ico d={<g><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></g>} />,
  shuffle:<Ico d={<g><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></g>} />,
  leaf:   <Ico d={<g><path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z" /><path d="M11 6v14" /></g>} />,
  gear:   <Ico d={<g><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></g>} />,
};
