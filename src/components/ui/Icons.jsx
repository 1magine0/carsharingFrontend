/* eslint-disable react-refresh/only-export-components --
   Static icon registry (object of tiny SVG components), not a fast-refresh target. */
/* Minimal line icons. stroke=currentColor. ESM port of the design prototype. */

export const Icon = ({ d, size = 20, fill = "none", sw = 1.8, children, ...p }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

export const Icons = {
  Car: (p) => <Icon {...p}><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" /><path d="M3 11h18v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><circle cx="7" cy="14" r="0.6" fill="currentColor" stroke="none" /><circle cx="17" cy="14" r="0.6" fill="currentColor" stroke="none" /></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Icon>,
  Sliders: (p) => <Icon {...p}><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" /></Icon>,
  Grid: (p) => <Icon {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></Icon>,
  Map: (p) => <Icon {...p}><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z" /><path d="M9 4v14M15 6v14" /></Icon>,
  Pin: (p) => <Icon {...p}><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>,
  Bolt: (p) => <Icon {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" /></Icon>,
  Gift: (p) => <Icon {...p}><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M4 13h16M12 9v11" /><path d="M12 9S10.5 4.8 8.3 5C6.6 5.2 7 8 9 9zM12 9s1.5-4.2 3.7-4C17.4 5.2 17 8 15 9z" /></Icon>,
  Moon: (p) => <Icon {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" /></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>,
  Close: (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>,
  Check: (p) => <Icon {...p}><path d="m4 12 5 5L20 6" /></Icon>,
  ChevR: (p) => <Icon {...p}><path d="m9 5 7 7-7 7" /></Icon>,
  ChevD: (p) => <Icon {...p}><path d="m5 9 7 7 7-7" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Icon>,
  Cal: (p) => <Icon {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></Icon>,
  Seat: (p) => <Icon {...p}><path d="M6 19v-2a3 3 0 0 1 3-3h3M7 4h6a2 2 0 0 1 2 2v6H9a2 2 0 0 1-2-2V4zM18 14v5" /></Icon>,
  Fuel: (p) => <Icon {...p}><path d="M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M4 21h11M5 11h9" /><path d="M14 8l3 2v6a2 2 0 0 0 2 0V9.5L16.5 7" /></Icon>,
  Gear: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></Icon>,
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" /></Icon>,
  Logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Heart: (p) => <Icon {...p}><path d="M12 20s-7-4.5-9.2-9C1.3 8 3 4.5 6.5 4.5c2 0 3.2 1.3 3.5 2 .3-.7 1.5-2 3.5-2 3.5 0 5.2 3.5 3.7 6.5C19 15.5 12 20 12 20z" /></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z" /></Icon>,
  Pencil: (p) => <Icon {...p}><path d="M16.5 3.8a2 2 0 0 1 2.8 2.8L7 19l-4 1 1-4 12.5-12.2z" /><path d="M14.5 5.8l3 3" /></Icon>,
  Trash: (p) => <Icon {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></Icon>,
  Bell: (p) => <Icon {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></Icon>,
  Menu: (p) => <Icon {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Icon>,
};

export default Icons;
