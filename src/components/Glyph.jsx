// Tek noktadan ince çizgi ikon seti (24x24, stroke tabanlı).
const PATHS = {
  'layout-dashboard': 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  radar: 'M12 12l6-3M4 12a8 8 0 108-8M12 12l4 6',
  stack: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  cloud: 'M6 17a4 4 0 010-8 5 5 0 019-2 4 4 0 011 9z',
  bell: 'M6 16V10a6 6 0 0112 0v6l2 2H4zM10 21h4',
  settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM3 12h3M18 12h3M12 3v3M12 18v3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2',
  power: 'M12 4v8M7 7a7 7 0 1010 0',
  plane: 'M21 16l-9-5V4a1.5 1.5 0 00-3 0v7l-6 3v2l6-1.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L15 19v-2.5l6 1.5z',
  sun: 'M12 7a5 5 0 100 10 5 5 0 000-10zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0',
  alert: 'M12 3l9 16H3zM12 10v4M12 17h.01',
  bolt: 'M13 3L5 13h5l-1 8 8-10h-5z',
  droplet: 'M12 3s6 6 6 10a6 6 0 11-12 0c0-4 6-10 6-10z',
  wind: 'M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h9a2.5 2.5 0 11-2.5 2.5',
  gauge: 'M12 13l4-3M5 18a8 8 0 1114 0',
  activity: 'M3 12h4l3 8 4-16 3 8h4',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  thermo: 'M12 14V5a2 2 0 014 0M14 14a3 3 0 11-3 0',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  play: 'M8 5l11 7-11 7z',
  pause: 'M9 5v14M15 5v14',
  replay: 'M3 11a8 8 0 1 1 .9 4.2M3 11V5M3 11h6',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  flame: 'M12 3c3 4 5 6 5 9a5 5 0 1 1-10 0c0-1.6.8-2.9 1.6-3.7C9 11 11 9 12 3z',
  flag: 'M5 21V4h12l-2 4 2 4H5',
  mic: 'M12 3a3 3 0 013 3v5a3 3 0 01-6 0V6a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v3',
  'mic-off': 'M9 9v2a3 3 0 004.6 2.5M15 11V6a3 3 0 00-5.6-1.5M5 11a7 7 0 0011.3 5.5M12 18v3M4 4l16 16',
  vr: 'M4 8h16a1 1 0 011 1v6a1 1 0 01-1 1h-4.5l-1.7-2.2a2 2 0 00-3.6 0L8.5 16H4a1 1 0 01-1-1V9a1 1 0 011-1z',
}

export function Glyph({ name, className = '', size = 20 }) {
  return (
    <svg className={`glyph ${className}`} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name] || ''} />
    </svg>
  )
}
