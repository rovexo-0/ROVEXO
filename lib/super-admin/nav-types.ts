export type SuperAdminNavItem = {
  href: string;
  label: string;
  description?: string;
  icon?: string;
};

export type SuperAdminNavSection = {
  id: string;
  title: string;
  items: SuperAdminNavItem[];
  collapsible?: boolean;
};
