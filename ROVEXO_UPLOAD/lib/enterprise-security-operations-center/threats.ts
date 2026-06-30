import type { ThreatIntelligence } from "@/lib/enterprise-security-operations-center/types";

export function createDefaultThreats(): ThreatIntelligence[] {
  return [
    { id: "th-1", ip: "203.0.113.42", country: "RU", asn: "AS12345", vpnDetected: true, torDetected: false, proxyDetected: true, hostingDetected: false, knownBot: true, confidence: 92, geoRisk: "high" },
    { id: "th-2", ip: "198.51.100.8", country: "US", asn: "AS64496", vpnDetected: false, torDetected: false, proxyDetected: false, hostingDetected: true, knownBot: false, confidence: 68, geoRisk: "low" },
    { id: "th-3", ip: "192.0.2.15", country: "GB", asn: "AS2856", vpnDetected: false, torDetected: true, proxyDetected: false, hostingDetected: false, knownBot: false, confidence: 88, geoRisk: "medium" },
    { id: "th-4", ip: "203.0.113.99", country: "CN", asn: "AS4134", vpnDetected: true, torDetected: false, proxyDetected: true, hostingDetected: true, knownBot: true, confidence: 95, geoRisk: "high" },
  ];
}

export function highRiskThreats(threats: ThreatIntelligence[]): ThreatIntelligence[] {
  return threats.filter((t) => t.geoRisk === "high" || t.confidence >= 85);
}

export function botThreats(threats: ThreatIntelligence[]): ThreatIntelligence[] {
  return threats.filter((t) => t.knownBot);
}

export function anonymizedThreats(threats: ThreatIntelligence[]): ThreatIntelligence[] {
  return threats.filter((t) => t.vpnDetected || t.torDetected || t.proxyDetected);
}
