"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR } from "@/lib/enterprise-mobile-control-center/descriptor";
import {
  MOBILE_CC_API,
  MOBILE_CC_ROUTES,
  UNIQUE_BUILD_TYPES,
  PUSH_TYPES,
  OTA_ROLLOUT_TYPES,
} from "@/lib/enterprise-mobile-control-center/registry";
import type { MobileCcSnapshot, MobileCcTab } from "@/lib/enterprise-mobile-control-center/types";
import { listAndroidBuildTypes, listIosBuildTypes } from "@/lib/enterprise-mobile-control-center/builds";

type EnterpriseMobileControlCenterAdminProps = {
  initialSnapshot: MobileCcSnapshot;
  defaultTab?: MobileCcTab;
};

export function EnterpriseMobileControlCenterAdmin({
  initialSnapshot,
  defaultTab = "dashboard",
}: EnterpriseMobileControlCenterAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab] = useState(defaultTab);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const response = await fetch(ENTERPRISE_MOBILE_CC_MODULE_DESCRIPTOR.api.v1Snapshot);
    const data = (await response.json()) as { mobileControlCenter?: MobileCcSnapshot };
    if (data.mobileControlCenter) setSnapshot(data.mobileControlCenter);
  }, []);

  const runAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      startTransition(async () => {
        const endpoint =
          action === "build"
            ? MOBILE_CC_API.build
            : action === "publish"
              ? MOBILE_CC_API.publish
              : action === "rollback"
                ? MOBILE_CC_API.rollback
                : action === "send-push"
                  ? MOBILE_CC_API.sendPush
                  : action === "create-ota"
                    ? MOBILE_CC_API.createOta
                    : action === "remote-logout"
                      ? MOBILE_CC_API.remoteLogout
                      : action === "disable-device"
                        ? MOBILE_CC_API.disableDevice
                        : `${MOBILE_CC_API.snapshot}/action`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, mfaVerified: true, ...payload }),
        });
        const data = (await response.json()) as { ok?: boolean; error?: string; mobileControlCenter?: MobileCcSnapshot };
        setMessage(response.ok ? "Mobile action completed." : data.error ?? "Action failed.");
        if (data.mobileControlCenter) setSnapshot(data.mobileControlCenter);
        else await refresh();
      });
    },
    [refresh],
  );

  return (
    <div className="mcc-admin">
      <header className="mcc-admin__header">
        <div>
          <p className="mcc-admin__eyebrow">Enterprise Mobile Control Center</p>
          <h2 className="mcc-admin__title">Super Admin Mobile Platform</h2>
          <p className="mcc-admin__desc">
            Manage Android and iOS builds, releases, OTA updates, devices, and push notifications.
          </p>
        </div>
        <div className="mcc-admin__scores">
          <div className="mcc-score">
            <span>Release Health</span>
            <strong>{snapshot.dashboard.releaseHealth}%</strong>
          </div>
          <div className="mcc-score mcc-score--devices">
            <span>Active Devices</span>
            <strong>{snapshot.dashboard.activeDevices}</strong>
          </div>
          <div className="mcc-score mcc-score--push">
            <span>Push</span>
            <strong>{snapshot.dashboard.pushStatus}</strong>
          </div>
        </div>
      </header>

      <div className="mcc-admin__actions">
        <Button type="button" disabled={isPending} onClick={() => runAction("build", { buildType: "build-android-aab" })}>
          Build Android AAB
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("build", { buildType: "build-testflight" })}>
          Build TestFlight
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>
          Refresh
        </Button>
        <Link href="/super-admin/mobile-distribution" className="mcc-link">Mobile Distribution</Link>
        <Link href="/super-admin/ai" className="mcc-link">Enterprise AI OS</Link>
      </div>

      {message && <p className="mcc-admin__message">{message}</p>}
      {snapshot.pendingPublish && <p className="mcc-admin__banner">Pending publish — draft differs from live.</p>}

      <nav className="mcc-tabs" aria-label="Mobile control sections">
        {MOBILE_CC_ROUTES.map((route) => (
          <Link
            key={route.id}
            href={route.href}
            className={cn("mcc-tab", activeTab === route.id && "mcc-tab--active")}
          >
            {route.label}
          </Link>
        ))}
      </nav>

      {activeTab === "dashboard" && (
        <div className="mcc-grid">
          <section className="mcc-panel">
            <h3>Dashboard</h3>
            <dl className="mcc-metrics">
              <div><dt>Android Build</dt><dd>{snapshot.dashboard.androidBuild}</dd></div>
              <div><dt>iOS Build</dt><dd>{snapshot.dashboard.iosBuild}</dd></div>
              <div><dt>Production</dt><dd>{snapshot.dashboard.productionVersion}</dd></div>
              <div><dt>Beta</dt><dd>{snapshot.dashboard.betaVersion}</dd></div>
              <div><dt>Internal</dt><dd>{snapshot.dashboard.internalVersion}</dd></div>
              <div><dt>Latest Release</dt><dd>{snapshot.dashboard.latestRelease}</dd></div>
              <div><dt>Installed Devices</dt><dd>{snapshot.dashboard.installedDevices}</dd></div>
              <div><dt>Crash Reports</dt><dd>{snapshot.dashboard.crashReports}</dd></div>
              <div><dt>OTA Status</dt><dd>{snapshot.dashboard.otaStatus}</dd></div>
              <div><dt>Build Queue</dt><dd>{snapshot.dashboard.buildQueue}</dd></div>
            </dl>
          </section>
          <section className="mcc-panel">
            <h3>Analytics</h3>
            <dl className="mcc-metrics">
              <div><dt>DAU</dt><dd>{snapshot.analytics.dailyActiveDevices}</dd></div>
              <div><dt>MAU</dt><dd>{snapshot.analytics.monthlyActiveDevices}</dd></div>
              <div><dt>Retention</dt><dd>{(snapshot.analytics.retention * 100).toFixed(0)}%</dd></div>
              <div><dt>Push Delivery</dt><dd>{snapshot.analytics.pushDeliveryRate}%</dd></div>
              <div><dt>Startup</dt><dd>{snapshot.analytics.avgStartupMs}ms</dd></div>
              <div><dt>Sync</dt><dd>{snapshot.analytics.avgSyncMs}ms</dd></div>
            </dl>
          </section>
          {snapshot.aiSuggestions.length > 0 && (
            <section className="mcc-panel">
              <h3>AI Suggestions</h3>
              <ul className="mcc-list">
                {snapshot.aiSuggestions.map((s) => (
                  <li key={s.id}><strong>{s.title}</strong> — {s.description}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {activeTab === "builds" && (
        <section className="mcc-panel">
          <h3>Build Center</h3>
          <div className="mcc-build-modes">
            {UNIQUE_BUILD_TYPES.map((type) => (
              <Button key={type} type="button" variant="secondary" disabled={isPending} onClick={() => runAction("build", { buildType: type })}>
                {type.replace("build-", "")}
              </Button>
            ))}
          </div>
          <ul className="mcc-list">
            {snapshot.buildHistory.map((b) => (
              <li key={b.id}><strong>{b.platform}</strong> {b.type} — v{b.version} #{b.buildNumber} · {b.status}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "downloads" && (
        <section className="mcc-panel">
          <h3>Download Center</h3>
          <ul className="mcc-list">
            {snapshot.downloads.map((d) => (
              <li key={d.id}><strong>{d.type}</strong> — {d.platform} v{d.version} · {d.url}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "ios" && (
        <section className="mcc-panel">
          <h3>iOS Center</h3>
          <div className="mcc-build-modes">
            {listIosBuildTypes().map((type) => (
              <Button key={type} type="button" variant="secondary" disabled={isPending} onClick={() => runAction("build", { buildType: type })}>
                {type.replace("build-", "")}
              </Button>
            ))}
          </div>
          <ul className="mcc-list">
            {snapshot.releases.filter((r) => r.platform === "ios").map((r) => (
              <li key={r.id}>{r.channel} v{r.version} — {r.status}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "android" && (
        <section className="mcc-panel">
          <h3>Android Center</h3>
          <div className="mcc-build-modes">
            {listAndroidBuildTypes().map((type) => (
              <Button key={type} type="button" variant="secondary" disabled={isPending} onClick={() => runAction("build", { buildType: type })}>
                {type.replace("build-", "")}
              </Button>
            ))}
          </div>
          <ul className="mcc-list">
            {snapshot.releases.filter((r) => r.platform === "android").map((r) => (
              <li key={r.id}>{r.channel} v{r.version} — {r.status}</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "devices" && (
        <section className="mcc-panel">
          <h3>Device Management</h3>
          <ul className="mcc-list">
            {snapshot.devices.map((d) => (
              <li key={d.id}>
                <strong>{d.name}</strong> ({d.platform}) — v{d.appVersion} · {d.online ? "online" : "offline"} · {d.securityStatus}
                <span className="mcc-device-actions">
                  <Button type="button" size="sm" disabled={isPending} onClick={() => runAction("remote-logout", { deviceId: d.id })}>Logout</Button>
                  <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("disable-device", { deviceId: d.id })}>Disable</Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "ota" && (
        <section className="mcc-panel">
          <h3>OTA Update Center</h3>
          <div className="mcc-build-modes">
            {OTA_ROLLOUT_TYPES.map((type) => (
              <Button key={type} type="button" variant="secondary" disabled={isPending} onClick={() => runAction("create-ota", { otaType: type })}>
                {type}
              </Button>
            ))}
          </div>
          <ul className="mcc-list">
            {snapshot.otaUpdates.map((o) => (
              <li key={o.id}><strong>{o.type}</strong> v{o.version} — {o.status} ({o.rolloutPercent}%)</li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "push" && (
        <section className="mcc-panel">
          <h3>Push Center</h3>
          <div className="mcc-build-modes">
            {PUSH_TYPES.map((type) => (
              <Button key={type} type="button" variant="secondary" disabled={isPending} onClick={() => runAction("send-push", { pushType: type })}>
                {type}
              </Button>
            ))}
          </div>
          <ul className="mcc-list">
            {snapshot.pushCampaigns.map((p) => (
              <li key={p.id}><strong>{p.title}</strong> — {p.type} · {(p.deliveryRate * 100).toFixed(0)}% delivery</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
