export interface NavItem {
  key: string;
  label: string;
  href: string;
  hasArrow?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', href: '/' },
  { key: 'events', label: 'Events', href: '/events-list' },
  { key: 'plan', label: 'Start a new plan', href: '/plan', hasArrow: false },
];
