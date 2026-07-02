import type { FirewallRule, FirewallRuleType } from "@/lib/enterprise-security-operations-center/types";
import { FIREWALL_RULE_TYPES } from "@/lib/enterprise-security-operations-center/registry";

export function isValidFirewallRuleType(value: string): value is FirewallRuleType {
  return (FIREWALL_RULE_TYPES as readonly string[]).includes(value);
}

export function createDefaultFirewallRules(): FirewallRule[] {
  return [
    { id: "fw-1", type: "ip", label: "Block known bad IPs", value: "203.0.113.0/24", action: "block", enabled: true },
    { id: "fw-2", type: "country", label: "High-risk geo block", value: "RU,CN,KP", action: "block", enabled: false },
    { id: "fw-3", type: "asn", label: "Hosting provider rate limit", value: "AS64496", action: "rate-limit", enabled: true },
    { id: "fw-4", type: "rate-limit", label: "API global rate limit", value: "1000/min", action: "rate-limit", enabled: true },
    { id: "fw-5", type: "allow-list", label: "Super Admin IPs", value: "10.0.0.0/8", action: "allow", enabled: true },
    { id: "fw-6", type: "block-list", label: "TOR exit nodes", value: "dynamic-tor-list", action: "block", enabled: true },
    { id: "fw-7", type: "session", label: "Max concurrent sessions", value: "5", action: "rate-limit", enabled: true },
    { id: "fw-8", type: "device", label: "Untrusted device block", value: "untrusted", action: "block", enabled: false },
  ];
}

export function activeRules(rules: FirewallRule[]): FirewallRule[] {
  return rules.filter((r) => r.enabled);
}

export function firewallStatus(rules: FirewallRule[], lockdown: boolean): "active" | "degraded" | "lockdown" {
  if (lockdown) return "lockdown";
  const active = activeRules(rules);
  if (active.length >= 5) return "active";
  return "degraded";
}

export function toggleEmergencyLockdown(current: boolean): boolean {
  return !current;
}

export function blockIpRule(ip: string): FirewallRule {
  return {
    id: `fw-block-${Date.now()}`,
    type: "ip",
    label: `Block ${ip}`,
    value: ip,
    action: "block",
    enabled: true,
  };
}
