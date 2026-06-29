import { getPlatformVisualDraft, getPlatformVisualHistory } from "@/lib/platform-visual/reader";
import {
  getVisualCmsEngineSnapshotForAdmin,
  readLiveVisualCmsEngineDocument,
} from "@/lib/visual-cms-engine/engine";
import {
  VISUAL_CMS_BUILDERS,
  VISUAL_CMS_CANVAS_ELEMENTS,
} from "@/lib/visual-cms-engine/registry";
import {
  buildVisualCmsDashboard,
  computeVisualCmsAnalytics,
  filterEnabledBuilders,
} from "@/lib/visual-cms-engine/timeline";
import type {
  VisualCmsEngineContext,
  VisualCmsEngineSnapshot,
} from "@/lib/visual-cms-engine/types";

export async function getVisualCmsEngineSnapshot(): Promise<VisualCmsEngineSnapshot> {
  const [{ draft, live, history }, visualBundle, themeHistory] = await Promise.all([
    getVisualCmsEngineSnapshotForAdmin(),
    getPlatformVisualDraft(),
    getPlatformVisualHistory(),
  ]);

  return {
    scannedAt: new Date().toISOString(),
    builders: VISUAL_CMS_BUILDERS,
    canvasElements: VISUAL_CMS_CANVAS_ELEMENTS,
    draft,
    live,
    history,
    visualBundle,
    themeHistory,
  };
}

export async function getPublicVisualCmsEngineConfig() {
  return readLiveVisualCmsEngineDocument();
}

export async function getVisualCmsEngineContext(): Promise<VisualCmsEngineContext> {
  const [config, themeHistory] = await Promise.all([
    readLiveVisualCmsEngineDocument(),
    getPlatformVisualHistory(),
  ]);

  const dashboard = buildVisualCmsDashboard({ config, themeHistory });

  return {
    dashboard,
    publishStage: config.publishStage,
    activeThemeLabel: config.activeThemeLabel,
    scannedAt: new Date().toISOString(),
  };
}

export async function getVisualCmsPageData() {
  const snapshot = await getVisualCmsEngineSnapshot();
  const context = await getVisualCmsEngineContext();
  const enabledBuilders = filterEnabledBuilders(snapshot.builders, snapshot.live);
  const analytics = computeVisualCmsAnalytics({
    builders: snapshot.builders,
    config: snapshot.live,
  });

  return {
    snapshot,
    context,
    enabledBuilders,
    analytics,
  };
}

export async function getThemeHistoryForAdmin() {
  const [themeHistory, config] = await Promise.all([
    getPlatformVisualHistory(),
    readLiveVisualCmsEngineDocument(),
  ]);

  return {
    scannedAt: new Date().toISOString(),
    themeHistory,
    cmsHistory: await getVisualCmsEngineSnapshotForAdmin().then((s) => s.history),
    activeThemeLabel: config.activeThemeLabel,
    publishStage: config.publishStage,
  };
}
