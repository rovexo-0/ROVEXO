"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";
import {
  DEVICE_BIOMETRIC_REQUIREMENTS,
  DEVICE_CERTIFICATION_BADGES,
  DEVICE_LIFECYCLE_ROUTES,
  DEVICE_REMOTE_ACTIONS,
  DEVICE_TAMPER_CHECKS,
} from "@/lib/device-lifecycle-manager-engine/registry";
import type {
  DeviceLifecycleEngineSnapshot,
  DeviceLifecycleRecord,
  DeviceLifecycleTrustLevel,
} from "@/lib/device-lifecycle-manager-engine/types";

export type DeviceLifecycleTab =
  | "dashboard"
  | "list"
  | "device"
  | "security"
  | "health"
  | "trust"
  | "logs"
  | "history"
  | "recovery"
  | "settings";

type DeviceLifecycleManagerAdminProps = {
  initialSnapshot: DeviceLifecycleEngineSnapshot;
  defaultTab?: DeviceLifecycleTab;
  selectedDeviceId?: string;
};

const TRUST_CLASS: Record<DeviceLifecycleTrustLevel, string> = {
  green: "dlm-trust--green",
  yellow: "dlm-trust--yellow",
  red: "dlm-trust--red",
};

export function DeviceLifecycleManagerAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
  selectedDeviceId,
}: DeviceLifecycleManagerAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState<DeviceLifecycleTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedDevice = useMemo(() => {
    if (selectedDeviceId) return snapshot.devices.find((d) => d.id === selectedDeviceId) ?? snapshot.devices[0];
    return snapshot.devices[0];
  }, [selectedDeviceId, snapshot.devices]);

  const filteredDevices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.devices;
    return snapshot.devices.filter(
      (d) =>
        d.registration.deviceName.toLowerCase().includes(q) ||
        d.registration.deviceModel.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q),
    );
  }, [query, snapshot.devices]);

  const refreshSnapshot = useCallback(async () => {
    const response = await fetch("/api/super-admin/mobile-distribution/devices");
    const data = (await response.json()) as { deviceLifecycle?: DeviceLifecycleEngineSnapshot };
    if (data.deviceLifecycle) setSnapshot(data.deviceLifecycle);
  }, []);

  const remoteAction = useCallback(
    (action: string, deviceId: string, name?: string) => {
      startTransition(async () => {
        const response = await fetch("/api/super-admin/mobile-distribution/devices/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, deviceId, name }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; snapshot?: DeviceLifecycleEngineSnapshot };
        setMessage(response.ok ? `${action} completed.` : data.error ?? "Action failed.");
        if (data.snapshot) setSnapshot(data.snapshot);
        setRenameId(null);
      });
    },
    [],
  );

  const renderDeviceCard = (device: DeviceLifecycleRecord, showActions = true) => (
    <article key={device.id} className={cn("ea-card", device.locked && "ea-card--locked")}>
      <div className="dlm-device-card__head">
        <div>
          <Link href={`/super-admin/mobile-distribution/devices/device?id=${device.id}`} className="ea-link">
            <strong>{device.registration.deviceName}</strong>
          </Link>
          <span className="dlm-device-model">{device.registration.deviceModel}</span>
        </div>
        <span className={cn("dlm-trust-badge", TRUST_CLASS[device.trust.level])}>{device.trust.score}/100</span>
      </div>
      <dl className="dlm-dl dlm-dl--compact">
        <div><dt>OS</dt><dd>{device.registration.osVersion}</dd></div>
        <div><dt>App</dt><dd>v{device.registration.appVersion}</dd></div>
        <div><dt>Trust</dt><dd>{device.trustStatus}</dd></div>
        <div><dt>Health</dt><dd>{device.health.healthScore}%</dd></div>
        <div><dt>Last Login</dt><dd>{new Date(device.registration.lastLogin).toLocaleString()}</dd></div>
        <div><dt>Country</dt><dd>{device.country}</dd></div>
      </dl>
      {showActions ? (
        <div className="dlm-device-actions">
          {renameId === device.id ? (
            <>
              <input className="dlm-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} aria-label="Device name" />
              <Button disabled={isPending} variant="primary" onClick={() => remoteAction("rename", device.id, renameValue)}>Save</Button>
              <Button disabled={isPending} variant="secondary" onClick={() => setRenameId(null)}>Cancel</Button>
            </>
          ) : (
            DEVICE_REMOTE_ACTIONS.slice(0, 6).map((a) => (
              <Button
                key={a.id}
                disabled={isPending}
                variant="secondary"
                onClick={() => {
                  if (a.id === "rename") {
                    setRenameId(device.id);
                    setRenameValue(device.registration.deviceName);
                  } else remoteAction(a.id, device.id);
                }}
              >
                {a.label}
              </Button>
            ))
          )}
        </div>
      ) : null}
    </article>
  );

  return (
    <EnterpriseAdminShell
      moduleId="device-lifecycle-manager"
      eyebrow="Super Admin Mobile · Device Lifecycle Manager"
      title="Enterprise Device Lifecycle"
      description="Registration, authentication, trust, health, security, remote administration, recovery, and certification."
      enterpriseScore={snapshot.dashboard.averageHealthScore}
      routeTabs={DEVICE_LIFECYCLE_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search devices…"
      aiInsight="OMEGA PRIME: Device Lifecycle Manager is production ready for global enterprise audit."
      actions={
        <Button disabled={isPending} variant="secondary" onClick={refreshSnapshot}>Refresh</Button>
      }
      quickLinks={[
        { label: "Mobile Distribution", href: "/super-admin/mobile-distribution" },
        { label: "OMEGA Enterprise", href: "/super-admin/mobile/omega" },
      ]}
    >
      {activeTab === "dashboard" ? (
        <div className="dlm-grid">
          <section className="ea-panel">
            <h3>Lifecycle Dashboard</h3>
            <div className="dlm-stat-grid">
              <div className="dlm-stat"><span>Registered</span><strong>{snapshot.dashboard.registeredDevices}</strong></div>
              <div className="dlm-stat"><span>Trusted</span><strong>{snapshot.dashboard.trustedDevices}</strong></div>
              <div className="dlm-stat"><span>Blocked</span><strong>{snapshot.dashboard.blockedDevices}</strong></div>
              <div className="dlm-stat"><span>Pending</span><strong>{snapshot.dashboard.pendingApproval}</strong></div>
              <div className="dlm-stat"><span>Latest %</span><strong>{snapshot.dashboard.latestVersionPercent}%</strong></div>
              <div className="dlm-stat"><span>Incidents</span><strong>{snapshot.dashboard.securityIncidents}</strong></div>
            </div>
          </section>
          <section className="ea-panel">
            <h3>Active Alerts</h3>
            <ul className="ea-list">
              {snapshot.alerts.filter((a) => !a.resolved).slice(0, 5).map((a) => (
                <li key={a.id} className={`dlm-alert dlm-alert--${a.priority}`}><strong>{a.title}</strong><p>{a.message}</p></li>
              ))}
            </ul>
          </section>
          <section className="ea-panel ea-panel--wide">
            <h3>Recent Devices</h3>
            <div className="ea-list">{filteredDevices.slice(0, 2).map((d) => renderDeviceCard(d, false))}</div>
          </section>
        </div>
      ) : null}

      {activeTab === "list" ? (
        <section className="ea-panel"><h3>Registered Devices</h3><div className="ea-list">{filteredDevices.map((d) => renderDeviceCard(d))}</div></section>
      ) : null}

      {activeTab === "device" && selectedDevice ? (
        <div className="dlm-grid">
          <section className="ea-panel ea-panel--wide">{renderDeviceCard(selectedDevice)}</section>
          <section className="ea-panel">
            <h3>Registration</h3>
            <dl className="dlm-dl">
              {Object.entries(selectedDevice.registration).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>
              ))}
            </dl>
          </section>
          <section className="ea-panel">
            <h3>Certification</h3>
            <ul className="ea-list">
              {DEVICE_CERTIFICATION_BADGES.map((b) => (
                <li key={b.id} className={selectedDevice.certification[b.key] ? "dlm-check-list__on" : "dlm-check-list__off"}>{b.label}</li>
              ))}
            </ul>
            <p className="dlm-cert-status">{selectedDevice.certification.certificateStatus}</p>
          </section>
        </div>
      ) : null}

      {activeTab === "security" ? (
        <div className="dlm-grid">
          {filteredDevices.map((device) => (
            <section key={device.id} className="ea-panel">
              <h3>{device.registration.deviceName}</h3>
              <ul className="ea-list">
                <li className={device.security.encrypted ? "dlm-check-list__on" : "dlm-check-list__off"}>Encrypted</li>
                <li className={device.security.signatureVerified ? "dlm-check-list__on" : "dlm-check-list__off"}>Signature Verified</li>
                <li className={device.security.certificateValid ? "dlm-check-list__on" : "dlm-check-list__off"}>Certificate Valid</li>
                <li className={device.security.guardianProtected ? "dlm-check-list__on" : "dlm-check-list__off"}>Guardian Protected</li>
                <li className={device.security.sentinelProtected ? "dlm-check-list__on" : "dlm-check-list__off"}>Sentinel Protected</li>
                <li className={device.security.omegaVerified ? "dlm-check-list__on" : "dlm-check-list__off"}>OMEGA Verified</li>
                <li className={device.security.antivirusProtected ? "dlm-check-list__on" : "dlm-check-list__off"}>Antivirus Protected</li>
              </ul>
              <h4 className="dlm-subhead">Tamper Detection</h4>
              <ul className="ea-list">
                {DEVICE_TAMPER_CHECKS.map((t) => (
                  <li key={t.id} className={device.tamper[t.id as keyof typeof device.tamper] ? "dlm-check-list__off" : "dlm-check-list__on"}>{t.label}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {activeTab === "health" ? (
        <div className="dlm-grid">
          {filteredDevices.map((device) => (
            <section key={device.id} className="ea-panel">
              <h3>{device.registration.deviceName} · {device.health.healthScore}%</h3>
              <dl className="dlm-dl dlm-dl--grid">
                <div><dt>Battery</dt><dd>{device.health.battery}%</dd></div>
                <div><dt>Storage</dt><dd>{device.health.storage}%</dd></div>
                <div><dt>Memory</dt><dd>{device.health.memory}%</dd></div>
                <div><dt>CPU</dt><dd>{device.health.cpuUsage}%</dd></div>
                <div><dt>Performance</dt><dd>{device.health.appPerformance}</dd></div>
                <div><dt>Crashes</dt><dd>{device.health.crashStatus}</dd></div>
                <div><dt>Connectivity</dt><dd>{device.health.connectivity}</dd></div>
                <div><dt>Push</dt><dd>{device.health.pushNotifications ? "Active" : "Off"}</dd></div>
              </dl>
            </section>
          ))}
        </div>
      ) : null}

      {activeTab === "trust" ? (
        <div className="dlm-grid">
          {filteredDevices.map((device) => (
            <section key={device.id} className="ea-panel">
              <div className="dlm-trust-head">
                <h3>{device.registration.deviceName}</h3>
                <span className={cn("dlm-trust-badge dlm-trust-badge--lg", TRUST_CLASS[device.trust.level])}>{device.trust.score}/100</span>
              </div>
              <dl className="dlm-dl dlm-dl--grid">
                <div><dt>Auth Health</dt><dd>{device.trust.authenticationHealth}%</dd></div>
                <div><dt>Security</dt><dd>{device.trust.securityStatus}%</dd></div>
                <div><dt>App Integrity</dt><dd>{device.trust.appIntegrity}%</dd></div>
                <div><dt>Update</dt><dd>{device.trust.updateStatus}</dd></div>
                <div><dt>Last Scan</dt><dd>{new Date(device.trust.lastScan).toLocaleString()}</dd></div>
                <div><dt>Risk Events</dt><dd>{device.trust.riskEvents}</dd></div>
              </dl>
            </section>
          ))}
        </div>
      ) : null}

      {activeTab === "logs" ? (
        <section className="ea-panel">
          <h3>Device Logs</h3>
          <ul className="ea-list">
            {snapshot.logs.map((log) => (
              <li key={log.id} className={`dlm-log dlm-log--${log.level}`}>
                <span className="dlm-log__meta">{log.source} · {log.deviceId}</span>
                <p>{log.message}</p>
                <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "history" ? (
        <section className="ea-panel">
          <h3>Device History</h3>
          <ul className="ea-list">
            {snapshot.history.map((h) => (
              <li key={h.id} className="dlm-history">
                <span className="dlm-history__cat">{h.category}</span>
                <strong>{h.title}</strong>
                <p>{h.detail}</p>
                <time dateTime={h.timestamp}>{new Date(h.timestamp).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "recovery" ? (
        <section className="ea-panel">
          <h3>Device Recovery</h3>
          <p className="dlm-desc">Remote recovery actions integrated with Disaster Recovery Engine.</p>
          <div className="dlm-device-actions">
            {DEVICE_REMOTE_ACTIONS.filter((a) => ["clear-cache", "reset-biometric", "invalidate-sessions", "force-update"].includes(a.id)).map((a) => (
              <Button key={a.id} disabled={isPending || !selectedDevice} variant="secondary" onClick={() => selectedDevice && remoteAction(a.id, selectedDevice.id)}>
                {a.label}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <div className="dlm-grid">
          <section className="ea-panel">
            <h3>Authentication Settings</h3>
            <ul className="ea-list">
              <li className={snapshot.settings.requireMfa ? "dlm-check-list__on" : "dlm-check-list__off"}>MFA Required</li>
              <li className={snapshot.settings.autoRegister ? "dlm-check-list__on" : "dlm-check-list__off"}>Auto Register</li>
              <li className={snapshot.settings.continuousMonitoring ? "dlm-check-list__on" : "dlm-check-list__off"}>Continuous OMEGA Monitoring</li>
            </ul>
            <h4 className="dlm-subhead">Require biometric before</h4>
            <ul className="ea-list">
              {DEVICE_BIOMETRIC_REQUIREMENTS.map((b) => (
                <li key={b.id} className={snapshot.settings[b.key] ? "dlm-check-list__on" : "dlm-check-list__off"}>{b.label}</li>
              ))}
            </ul>
          </section>
          <section className="ea-panel">
            <h3>ORI Assistant</h3>
            <ul className="ea-list">
              {snapshot.oriInsights.slice(0, 4).map((insight) => (
                <li key={insight.id} className="dlm-ori">
                  <strong>{insight.question}</strong>
                  <p>{insight.answer}</p>
                  <p className="dlm-ori__rec">{insight.recommendation}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </EnterpriseAdminShell>
  );
}
