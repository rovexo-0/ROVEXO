export type TimezoneOption = {
  value: string;
  label: string;
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "Europe/Dublin", label: "Dublin (GMT/IST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Madrid", label: "Madrid (CET)" },
  { value: "Europe/Rome", label: "Rome (CET)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET)" },
  { value: "Europe/Warsaw", label: "Warsaw (CET)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

export function getTimezoneLabel(value: string): string {
  return TIMEZONE_OPTIONS.find((entry) => entry.value === value)?.label ?? value;
}
