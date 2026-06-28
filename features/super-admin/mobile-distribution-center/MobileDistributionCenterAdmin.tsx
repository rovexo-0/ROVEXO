"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import { SuperAdminMobileLogo } from "@/features/super-admin/mobile-distribution-center/SuperAdminMobileLogo";
import { buildQrSvg } from "@/lib/mobile-distribution-center-engine/timeline";
import {
  MOBILE_BIOMETRIC_ACTIONS,
  MOBILE_COMPLIANCE_ITEMS,
  MOBILE_COMPLIANCE_STANDARDS,
  MOBILE_DOWNLOAD_CARDS,
  MOBILE_INSTALL_STATUS_LABELS,
  MOBILE_LIVE_STATUS_LEGEND,
  MOBILE_ORI_CATEGORIES,
} from "@/lib/mobile-distribution-center-engine/registry";
import type {
  MobileDistributionEngineSnapshot,
  MobileDistributionLanguage,
  MobileInstallStatus,
  MobileLiveStatus,
} from "@/lib/mobile-distribution-center-engine/types";

export type MobileDistributionCenterTab =
  | "download"
  | "devices"
  | "versions"
  | "security"
  | "analytics"
  | "compliance"
  | "notifications"
  | "omega";

type MobileDistributionCenterAdminProps = {
  initialSnapshot: MobileDistributionEngineSnapshot;
  defaultTab?: MobileDistributionCenterTab;
};

const INSTALL_CLASS: Record<MobileInstallStatus, string> = {
  "already-installed": "mdc-badge--green",
  "latest-version": "mdc-badge--blue",
  outdated: "mdc-badge--yellow",
  "update-available": "mdc-badge--yellow",
  "installation-pending": "mdc-badge--gray",
  "verification-pending": "mdc-badge--gray",
};

const LIVE_CLASS: Record<MobileLiveStatus, string> = {
  installed: "mdc-live--green",
  "latest-version": "mdc-live--blue",
  "update-available": "mdc-live--yellow",
  compromised: "mdc-live--red",
  offline: "mdc-live--gray",
};

const TABS: { id: MobileDistributionCenterTab; label: string }[] = [
  { id: "download", label: "Download" },
  { id: "devices", label: "Devices" },
  { id: "versions", label: "Versions" },
  { id: "security", label: "Security" },
  { id: "analytics", label: "Analytics" },
  { id: "compliance", label: "Compliance" },
  { id: "notifications", label: "Notifications" },
  { id: "omega", label: "OMEGA & ORI" },
];

export function MobileDistributionCenterAdmin({
  initialSnapshot,
  defaultTab = "download",
}: MobileDistributionCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab, setActiveTab] = useState<MobileDistributionCenterTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const qrSvg = useMemo(() => buildQrSvg(JSON.stringify(snapshot.qrInstall)), [snapshot.qrInstall]);
  const unreadCount = snapshot.notifications.filter((n) => !n.read).length;
  const installLabel = MOBILE_INSTALL_STATUS_LABELS.find((s) => s.id === snapshot.installStatus)?.label ?? snapshot.installStatus;

  const filteredDevices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.devices;
    return snapshot.devices.filter(
      (d) => d.name.toLowerCase().includes(q) || d.model.toLowerCase().includes(q) || d.country.toLowerCase().includes(q),
    );
  }, [query, snapshot.devices]);

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/api/super-admin/mobile-distribution");
    const data = (await response.json()) as { mobileDistribution?: MobileDistributionEngineSnapshot };
    if (data.mobileDistribution) setSnapshot(data.mobileDistribution);
  }, []);

  const switchLanguage = useCallback((language: MobileDistributionLanguage) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/mobile-distribution/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: MobileDistributionEngineSnapshot };
      setMessage(response.ok ? `Language synchronized — ${language === "en" ? "English" : "Romanian"}.` : data.error ?? "Language switch failed.");
      if (data.snapshot) setSnapshot(data.snapshot);
    });
  }, []);

  const deviceAction = useCallback(
    (action: "remove" | "rename" | "remote-logout" | "block" | "trust", deviceId: string, name?: string) => {
      startTransition(async () => {
        const response = await fetch("/api/super-admin/mobile-distribution/device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, deviceId, name }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: MobileDistributionEngineSnapshot };
        setMessage(response.ok ? `Device ${action} completed.` : data.error ?? "Device action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        setRenameId(null);
      });
    },
    [],
  );

  const refreshQr = useCallback(() => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/mobile-distribution/qr", { method: "POST" });
      const data = (await response.json()) as { ok?: boolean; snapshot?: MobileDistributionEngineSnapshot };
      if (data.snapshot) setSnapshot(data.snapshot);
      setMessage("QR installation token refreshed.");
    });
  }, []);

  const exportReport = useCallback((format: string) => {
    startTransition(async () => {
      const response = await fetch("/api/super-admin/mobile-distribution/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      setMessage(response.ok ? `Report exported as ${format.toUpperCase()}.` : data.error ?? "Export failed.");
    });
  }, []);

  return (
    <EnterpriseAdminShell
      moduleId="mobile-distribution-center"
      eyebrow="Enterprise Core · Tools"
      title="ROVEXO Super Admin Mobile"
      description="Enterprise Administration Application"
      enterpriseScore={snapshot.analytics.latestVersionPercent}
      stateTabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as MobileDistributionCenterTab)}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search devices…"
      aiInsight="OMEGA PRIME: Mobile Distribution Center is production ready for global enterprise audit."
      actions={
        <Button disabled={isPending} variant="secondary" onClick={() => refreshSnapshot()}>Refresh</Button>
      }
      quickLinks={[
        { label: "Certification", href: "/super-admin/certification" },
        { label: "Compliance", href: "/super-admin/audit" },
        { label: "OMEGA Enterprise", href: "/super-admin/mobile/omega" },
      ]}
    >
      <div className="mdc-validation-badges" aria-label="Validation status">
        <span className={cn("mdc-val-badge", snapshot.qrValid && "mdc-val-badge--ok")}>QR {snapshot.qrValid ? "Valid" : "Invalid"}</span>
        <span className={cn("mdc-val-badge", snapshot.signatureValid && "mdc-val-badge--ok")}>Signature {snapshot.signatureValid ? "Valid" : "Invalid"}</span>
        <span className="mdc-val-badge mdc-val-badge--ok">Biometric Ready</span>
      </div>

      {activeTab === "download" ? (
        <div className="mdc-download-grid">
          <section className="ea-panel ea-panel--hero" aria-labelledby="mdc-download-title">
            <div className="mdc-download-cards">
              {MOBILE_DOWNLOAD_CARDS.map((card) => (
                <a
                  key={card.id}
                  href={snapshot.downloadLinks[card.hrefKey]}
                  className={cn("mdc-logo-card", (card.id === "ios" || card.id === "android") && "mdc-logo-card--primary")}
                  target={card.id === "ios" || card.id === "android" ? "_blank" : undefined}
                  rel={card.id === "ios" || card.id === "android" ? "noopener noreferrer" : undefined}
                >
                  <span className="mdc-download-card__icon" aria-hidden>{card.icon}</span>
                  <span>{card.label}</span>
                </a>
              ))}
            </div>
          </section>

          <section className="ea-panel" aria-labelledby="mdc-qr-title">
            <h3 id="mdc-qr-title">QR Installation · One Tap</h3>
            <div className="mdc-qr-wrap">
              <div className="mdc-qr" style={{ color: "#0A0A0A" }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="mdc-qr-hint">Scan using your phone</p>
            </div>
            <dl className="mdc-dl">
              <div><dt>Version</dt><dd>{snapshot.qrInstall.version}</dd></div>
              <div><dt>Version ID</dt><dd className="mdc-mono">{snapshot.qrInstall.versionId}</dd></div>
              <div><dt>Device Type</dt><dd>{snapshot.qrInstall.deviceType}</dd></div>
              <div><dt>Installation Token</dt><dd className="mdc-mono">{snapshot.qrInstall.installationToken}</dd></div>
              <div><dt>Security Signature</dt><dd className="mdc-mono">{snapshot.qrInstall.securitySignature}</dd></div>
              <div><dt>Expiration</dt><dd>{new Date(snapshot.qrInstall.expiration).toLocaleString()}</dd></div>
            </dl>
            <a href={snapshot.qrInstall.oneTapUrl} className="mdc-btn mdc-btn--primary mdc-btn--block">One Tap Installation</a>
            <Button disabled={isPending} variant="secondary" onClick={refreshQr}>Refresh QR Token</Button>
          </section>

          <section className="ea-panel" aria-labelledby="mdc-lang-title">
            <h3 id="mdc-lang-title">Language Center</h3>
            <p className="mdc-sync-status">{snapshot.languageSync}</p>
            <div className="mdc-lang-grid">
              {snapshot.supportedLanguages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={cn("mdc-lang-btn", snapshot.language === lang.id && "mdc-lang-btn--active")}
                  onClick={() => switchLanguage(lang.id)}
                  disabled={isPending}
                >
                  <span aria-hidden>{lang.flag}</span> {lang.label}
                </button>
              ))}
            </div>
            <p className="mdc-future-lang">Future languages ready: {snapshot.live.futureReady.join(", ")}</p>
          </section>

          <section className="ea-panel" aria-labelledby="mdc-install-status-title">
            <h3 id="mdc-install-status-title">Installation Status</h3>
            <p className={cn("mdc-status-badge", INSTALL_CLASS[snapshot.installStatus])}>{installLabel}</p>
            <ul className="mdc-live-legend">
              {MOBILE_LIVE_STATUS_LEGEND.map((item) => (
                <li key={item.id} className={cn("mdc-live-legend__item", LIVE_CLASS[item.id as MobileLiveStatus])}>
                  <span className="mdc-live-dot" aria-hidden /> {item.label}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === "devices" ? (
        <div className="mdc-devices-layout">
          <div className="mdc-devices-header">
            <Link href="/super-admin/mobile-distribution/devices" className="ea-link">Open Device Lifecycle Manager →</Link>
          </div>
          <div className="mdc-stat-grid mdc-stat-grid--compact">
            <div className="mdc-stat"><span>Registered</span><strong>{snapshot.deviceStats.registered}</strong></div>
            <div className="mdc-stat"><span>Active</span><strong>{snapshot.deviceStats.active}</strong></div>
            <div className="mdc-stat"><span>Inactive</span><strong>{snapshot.deviceStats.inactive}</strong></div>
            <div className="mdc-stat"><span>Trusted</span><strong>{snapshot.deviceStats.trusted}</strong></div>
            <div className="mdc-stat"><span>Pending</span><strong>{snapshot.deviceStats.pending}</strong></div>
            <div className="mdc-stat"><span>Blocked</span><strong>{snapshot.deviceStats.blocked}</strong></div>
          </div>
          <div className="ea-list">
            {filteredDevices.map((device) => (
              <article key={device.id} className={cn("mdc-device-card", device.trustStatus === "blocked" && "mdc-device-card--blocked")}>
                <div className="mdc-device-card__head">
                  <strong>{device.name}</strong>
                  <span className={cn("mdc-live-dot", LIVE_CLASS[device.liveStatus])} title={device.liveStatus} />
                </div>
                <dl className="mdc-dl mdc-dl--compact">
                  <div><dt>Model</dt><dd>{device.model}</dd></div>
                  <div><dt>OS</dt><dd>{device.osVersion}</dd></div>
                  <div><dt>Last Login</dt><dd>{new Date(device.lastLogin).toLocaleString()}</dd></div>
                  <div><dt>Country</dt><dd>{device.country}</dd></div>
                  <div><dt>IP</dt><dd>{device.ip}</dd></div>
                  <div><dt>Trust</dt><dd>{device.trustStatus}</dd></div>
                  <div><dt>Trust Score</dt><dd>{device.trustScore}%</dd></div>
                  <div><dt>App Version</dt><dd>{device.appVersion}</dd></div>
                </dl>
                <div className="mdc-device-actions">
                  {renameId === device.id ? (
                    <>
                      <input className="mdc-rename-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} aria-label="Device name" />
                      <Button disabled={isPending} variant="primary" onClick={() => deviceAction("rename", device.id, renameValue)}>Save</Button>
                      <Button disabled={isPending} variant="secondary" onClick={() => setRenameId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button disabled={isPending} variant="secondary" onClick={() => { setRenameId(device.id); setRenameValue(device.name); }}>Rename</Button>
                      <Button disabled={isPending} variant="secondary" onClick={() => deviceAction("remote-logout", device.id)}>Logout</Button>
                      {device.trustStatus !== "trusted" ? <Button disabled={isPending} variant="secondary" onClick={() => deviceAction("trust", device.id)}>Trust</Button> : null}
                      {device.trustStatus !== "blocked" ? <Button disabled={isPending} variant="secondary" onClick={() => deviceAction("block", device.id)}>Block</Button> : null}
                      <Button disabled={isPending} variant="secondary" onClick={() => deviceAction("remove", device.id)}>Remove</Button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "versions" ? (
        <section className="ea-panel" aria-labelledby="mdc-versions-title">
          <h3 id="mdc-versions-title">Version Center</h3>
          <div className="mdc-version-summary">
            <div><span>Current</span><strong>v{snapshot.versionCenter.currentVersion}</strong></div>
            <div><span>Latest</span><strong>v{snapshot.versionCenter.latestVersion}</strong></div>
            <div><span>Stable</span><strong>v{snapshot.versionCenter.stableVersion}</strong></div>
            <div><span>Beta</span><strong>v{snapshot.versionCenter.betaVersion}</strong></div>
            <div><span>Rollback</span><strong>{snapshot.versionCenter.rollbackAvailable ? "Available" : "N/A"}</strong></div>
          </div>
          <ul className="ea-list">
            {snapshot.versionCenter.releases.map((rel) => (
              <li key={rel.id} className={cn("mdc-release", rel.channel === "beta" && "mdc-release--beta")}>
                <div className="mdc-release__head">
                  <strong>v{rel.version}</strong>
                  <span className="mdc-release__channel">{rel.channel}</span>
                </div>
                <dl className="mdc-dl mdc-dl--compact">
                  <div><dt>Build</dt><dd>{rel.build}</dd></div>
                  <div><dt>Release Date</dt><dd>{rel.releaseDate}</dd></div>
                  <div><dt>Size</dt><dd>{rel.downloadSize}</dd></div>
                  <div><dt>Checksum</dt><dd className="mdc-mono">{rel.checksum}</dd></div>
                  <div><dt>Signature</dt><dd className="mdc-mono">{rel.signature}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "security" ? (
        <div className="mdc-security-grid">
          <section className="ea-panel">
            <h3>Security Center</h3>
            <dl className="mdc-dl mdc-dl--grid">
              <div><dt>Encryption</dt><dd>{snapshot.securityCenter.encryption}</dd></div>
              <div><dt>Digital Signature</dt><dd className="mdc-mono">{snapshot.securityCenter.digitalSignature}</dd></div>
              <div><dt>Package Integrity</dt><dd>{snapshot.securityCenter.packageIntegrity}</dd></div>
              <div><dt>Certificate Status</dt><dd>{snapshot.securityCenter.certificateStatus}</dd></div>
              <div><dt>Risk Score</dt><dd>{snapshot.securityCenter.riskScore}/100</dd></div>
              <div><dt>Guardian</dt><dd>{snapshot.securityCenter.guardianStatus}</dd></div>
              <div><dt>Sentinel</dt><dd>{snapshot.securityCenter.sentinelStatus}</dd></div>
              <div><dt>Antivirus</dt><dd>{snapshot.securityCenter.antivirusStatus}</dd></div>
              <div><dt>OMEGA</dt><dd>{snapshot.securityCenter.omegaStatus}</dd></div>
            </dl>
          </section>
          <section className="ea-panel">
            <h3>Biometric Security</h3>
            <ul className="ea-list">
              <li className={snapshot.biometric.faceId ? "mdc-check-list__on" : "mdc-check-list__off"}>Face ID</li>
              <li className={snapshot.biometric.touchId ? "mdc-check-list__on" : "mdc-check-list__off"}>Touch ID</li>
              <li className={snapshot.biometric.androidBiometrics ? "mdc-check-list__on" : "mdc-check-list__off"}>Android Biometrics</li>
            </ul>
            <h4 className="mdc-subhead">Require biometric before</h4>
            <ul className="ea-list">
              {MOBILE_BIOMETRIC_ACTIONS.map((a) => (
                <li key={a.id} className={snapshot.biometric[a.key] ? "mdc-check-list__on" : "mdc-check-list__off"}>{a.label}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === "analytics" ? (
        <div className="mdc-analytics-grid">
          <section className="ea-panel">
            <h3>Analytics</h3>
            <div className="mdc-stat-grid">
              <div className="mdc-stat"><span>Downloads Today</span><strong>{snapshot.analytics.downloadsToday}</strong></div>
              <div className="mdc-stat"><span>Downloads This Month</span><strong>{snapshot.analytics.downloadsThisMonth}</strong></div>
              <div className="mdc-stat"><span>Active Devices</span><strong>{snapshot.analytics.activeDevices}</strong></div>
              <div className="mdc-stat"><span>Latest Version %</span><strong>{snapshot.analytics.latestVersionPercent}%</strong></div>
              <div className="mdc-stat"><span>Install Success</span><strong>{snapshot.analytics.installSuccessRate}%</strong></div>
              <div className="mdc-stat"><span>Update Rate</span><strong>{snapshot.analytics.updateRate}%</strong></div>
              <div className="mdc-stat"><span>Crash Rate</span><strong>{snapshot.analytics.crashRate}%</strong></div>
            </div>
          </section>
          <section className="ea-panel">
            <h3>Countries</h3>
            <ul className="ea-list">
              {snapshot.analytics.countryDistribution.map((c) => (
                <li key={c.country}><span>{c.country}</span><div className="mdc-bar"><div style={{ width: `${c.percent}%` }} /></div><strong>{c.percent}%</strong></li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>Platforms</h3>
            <ul className="ea-list">
              {snapshot.analytics.platformDistribution.map((p) => (
                <li key={p.platform}><span>{p.platform}</span><div className="mdc-bar"><div style={{ width: `${p.percent}%` }} /></div><strong>{p.percent}%</strong></li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>Export</h3>
            <div className="mdc-export-btns">
              {(["pdf", "csv", "json", "markdown"] as const).map((fmt) => (
                <Button key={fmt} disabled={isPending} variant="secondary" onClick={() => exportReport(fmt)}>{fmt.toUpperCase()}</Button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "compliance" ? (
        <section className="ea-panel" aria-labelledby="mdc-compliance-title">
          <h3 id="mdc-compliance-title">Compliance</h3>
          <ul className="ea-list">
            {MOBILE_COMPLIANCE_ITEMS.map((item) => (
              <li key={item.id} className={snapshot.compliance[item.key] ? "mdc-check-list__on" : "mdc-check-list__off"}>{item.label}</li>
            ))}
          </ul>
          <h4 className="mdc-subhead">Standards Readiness</h4>
          <dl className="mdc-dl mdc-dl--grid">
            {MOBILE_COMPLIANCE_STANDARDS.map((std) => (
              <div key={std.id}><dt>{std.label}</dt><dd>{snapshot.compliance[std.key]}</dd></div>
            ))}
          </dl>
        </section>
      ) : null}

      {activeTab === "notifications" ? (
        <section className="ea-panel" aria-labelledby="mdc-notifications-title">
          <h3 id="mdc-notifications-title">Push Notifications</h3>
          <ul className="ea-list">
            {snapshot.notifications.map((n) => (
              <li key={n.id} className={cn("mdc-notify", `mdc-notify--${n.priority}`, !n.read && "mdc-notify--unread")}>
                <span className="mdc-notify__type">{n.type.replace("-", " ")}</span>
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "omega" ? (
        <div className="mdc-omega-grid">
          <section className="ea-panel">
            <h3>OMEGA Monitoring</h3>
            <dl className="mdc-dl mdc-dl--grid">
              <div><dt>Downloads</dt><dd>{snapshot.omega.downloads.toLocaleString()}</dd></div>
              <div><dt>Updates</dt><dd>{snapshot.omega.updates.toLocaleString()}</dd></div>
              <div><dt>Installations</dt><dd>{snapshot.omega.installations.toLocaleString()}</dd></div>
              <div><dt>Active Devices</dt><dd>{snapshot.omega.activeDevices.toLocaleString()}</dd></div>
              <div><dt>Crashes</dt><dd>{snapshot.omega.crashes}</dd></div>
              <div><dt>Performance</dt><dd>{snapshot.omega.performance}</dd></div>
              <div><dt>Security</dt><dd>{snapshot.omega.security}</dd></div>
              <div><dt>Integrity</dt><dd>{snapshot.omega.integrity}</dd></div>
              <div><dt>Certificates</dt><dd>{snapshot.omega.certificates}</dd></div>
              <div><dt>Health</dt><dd>{snapshot.omega.health}</dd></div>
            </dl>
            <h4 className="mdc-subhead">Version Distribution</h4>
            <ul className="ea-list">
              {snapshot.omega.versionDistribution.map((v) => (
                <li key={v.version}><span>v{v.version}</span><div className="mdc-bar"><div style={{ width: `${v.percent}%` }} /></div><strong>{v.percent}%</strong></li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>ORI · AI Assistant</h3>
            <div className="ea-admin__score">
              <span>Health Score</span>
              <strong>{snapshot.ori.healthScore}%</strong>
            </div>
            <p className="mdc-ori-analysis">{snapshot.ori.deviceAnalysis}</p>
            <ul className="ea-list">
              {snapshot.ori.insights.map((insight) => (
                <li key={insight.id} className={`mdc-ori mdc-ori--${insight.priority}`}>
                  <span className="mdc-ori__cat">{MOBILE_ORI_CATEGORIES.find((c) => c.id === insight.category)?.label}</span>
                  <strong>{insight.title}</strong>
                  <p>{insight.summary}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>Integrations</h3>
            <ul className="ea-list">
              {Object.entries(snapshot.integrations).map(([key, on]) => (
                <li key={key} className={on ? "mdc-check-list__on" : "mdc-check-list__off"}>
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </EnterpriseAdminShell>
  );
}
