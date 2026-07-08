"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { Button } from "@/components/ui/Button";
import { ResponsivePreviewFrame } from "@/features/super-admin/mission-control/ResponsivePreviewFrame";
import { cn } from "@/lib/cn";
import { PLATFORM_STUDIO_FIELD_TYPES, PLATFORM_STUDIO_PERMISSIONS } from "@/lib/platform-studio/registry";
import type {
  PlatformStudioDocument,
  PlatformStudioFormField,
  PlatformStudioHistoryEntry,
  PlatformStudioModule,
  PlatformStudioSnapshot,
} from "@/lib/platform-studio/types";

type PlatformStudioProps = {
  initialSnapshot: PlatformStudioSnapshot;
};

type StudioTab =
  | "modules"
  | "forms"
  | "workflows"
  | "dashboards"
  | "automations"
  | "permissions"
  | "database"
  | "pages"
  | "components"
  | "history";

const TABS: { id: StudioTab; label: string }[] = [
  { id: "modules", label: "Modules" },
  { id: "forms", label: "Form Builder" },
  { id: "workflows", label: "Workflows" },
  { id: "dashboards", label: "Dashboards" },
  { id: "automations", label: "Automations" },
  { id: "permissions", label: "Permissions" },
  { id: "database", label: "Database Config" },
  { id: "pages", label: "Page Builder" },
  { id: "components", label: "Component Registry" },
  { id: "history", label: "Audit & History" },
];

export function PlatformStudio({ initialSnapshot }: PlatformStudioProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<StudioTab>("modules");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(initialSnapshot.draft.forms[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedForm = useMemo(
    () => draft.forms.find((form) => form.id === selectedFormId) ?? null,
    [draft.forms, selectedFormId],
  );

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "duplicate" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/platform-studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: PlatformStudioDocument;
          snapshot?: PlatformStudioSnapshot;
          error?: string;
          document?: PlatformStudioDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Platform Studio action failed.");
          return;
        }
        if (data.draft) {
          setDraft(data.draft);
          setSnapshot((current) => ({ ...current, draft: data.draft! }));
        }
        if (data.snapshot) setSnapshot(data.snapshot);
        if (action === "export" && data.document) {
          const blob = new Blob([JSON.stringify(data.document, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement("a");
          anchor.href = url;
          anchor.download = `rovexo-platform-studio-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Platform configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  const updateDraft = useCallback((patch: Partial<PlatformStudioDocument>) => {
    setDraft((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  }, []);

  const addFormField = useCallback(
    (type: PlatformStudioFormField["type"]) => {
      if (!selectedForm) return;
      const field: PlatformStudioFormField = {
        id: `field-${Date.now().toString(36)}`,
        type,
        label: type.replace(/-/g, " "),
        required: false,
        hidden: false,
        order: selectedForm.fields.length,
      };
      updateDraft({
        forms: draft.forms.map((form) =>
          form.id === selectedForm.id ? { ...form, fields: [...form.fields, field] } : form,
        ),
      });
    },
    [draft.forms, selectedForm, updateDraft],
  );

  const filteredForms = selectedModule ? draft.forms.filter((f) => f.moduleId === selectedModule) : draft.forms;

  return (
    <div className="ps-shell">
      <header className="ps-shell__header">
        <div>
          <p className="ps-shell__eyebrow">Platform Studio</p>
          <p className="mc-manager__hint">
            No-code configuration for forms, workflows, dashboards, automations, permissions, and pages.
            Mission Control monitors · Theme Studio designs · Platform Studio configures.
          </p>
        </div>
        <div className="mc-dev-tools__actions">
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("reset-draft")}>
            Reset
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("duplicate")}>
            Duplicate
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>
            Export
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("save-draft")}>
            Save Draft
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("publish")}>
            Publish Platform
          </Button>
        </div>
      </header>
      {message ? <p className="mc-manager__message">{message}</p> : null}

      <div className="ps-shell__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn("ps-shell__tab", activeTab === tab.id && "ps-shell__tab--active")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "modules" ? (
        <ModuleGrid
          modules={snapshot.modules}
          selectedModule={selectedModule}
          onSelect={(id) => {
            setSelectedModule(id);
            setActiveTab("forms");
          }}
        />
      ) : null}

      {activeTab === "forms" ? (
        <div className="ps-builder-grid">
          <aside className="ps-panel">
            <h3 className="ps-panel__title">Forms</h3>
            <div className="ps-list">
              {filteredForms.map((form) => (
                <button
                  key={form.id}
                  type="button"
                  className={cn("ps-list__item", selectedFormId === form.id && "ps-list__item--active")}
                  onClick={() => setSelectedFormId(form.id)}
                >
                  <span>{form.name}</span>
                  <span
                    className={cn(
                      "mc-builder__pill",
                      form.status === "published" ? "mc-builder__pill--live" : "mc-builder__pill--draft",
                    )}
                  >
                    {form.status}
                  </span>
                </button>
              ))}
            </div>
            <h3 className="ps-panel__title">Field types</h3>
            <div className="ps-field-palette">
              {PLATFORM_STUDIO_FIELD_TYPES.map((type) => (
                <button key={type} type="button" className="ps-chip" onClick={() => addFormField(type)}>
                  {type}
                </button>
              ))}
            </div>
          </aside>
          <main className="ps-panel ps-panel--wide">
            {selectedForm ? (
              <>
                <h3 className="ps-panel__title">{selectedForm.name}</h3>
                <p className="mc-section__desc">{selectedForm.description ?? `Module: ${selectedForm.moduleId}`}</p>
                <div className="ps-form-canvas">
                  {[...selectedForm.fields]
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.id} className="ps-form-field">
                        <span className="ps-form-field__type">{field.type}</span>
                        <span className="ps-form-field__label">{field.label}</span>
                        {field.required ? <span className="ps-form-field__req">Required</span> : null}
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <p className="mc-section__desc">Select a form to edit.</p>
            )}
          </main>
        </div>
      ) : null}

      {activeTab === "workflows" ? (
        <BuilderList
          title="Workflow Builder"
          items={draft.workflows.map((w) => ({
            id: w.id,
            name: w.name,
            meta: `${w.steps.length} steps · ${w.status}`,
            moduleId: w.moduleId,
          }))}
        />
      ) : null}
      {activeTab === "dashboards" ? (
        <BuilderList
          title="Dashboard Builder"
          items={draft.dashboards.map((d) => ({
            id: d.id,
            name: d.name,
            meta: `${d.widgets.length} widgets · ${d.audience}`,
            moduleId: d.moduleId,
          }))}
        />
      ) : null}
      {activeTab === "automations" ? (
        <BuilderList
          title="Automation Builder"
          items={draft.automations.map((a) => ({
            id: a.id,
            name: a.name,
            meta: `${a.actions.length} actions · ${a.status}`,
            moduleId: a.moduleId,
          }))}
        />
      ) : null}

      {activeTab === "permissions" ? (
        <div className="ps-builder-grid">
          {draft.roles.map((role) => (
            <div key={role.id} className="rx-surface-card rounded-ds-xl p-ds-5">
              <h3 className="font-semibold">{role.name}</h3>
              {role.description ? <p className="text-sm text-text-secondary">{role.description}</p> : null}
              <div className="ps-perm-grid">
                {PLATFORM_STUDIO_PERMISSIONS.map((perm) => (
                  <span key={perm} className={cn("ps-chip", role.permissions.includes(perm) && "ps-chip--active")}>
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "database" ? (
        <div className="ps-list ps-list--cards">
          {draft.fieldConfigs.map((field) => (
            <div key={field.id} className="rx-surface-card rounded-ds-xl p-ds-4">
              <p className="font-semibold">{field.label}</p>
              <p className="text-sm text-text-secondary">
                {field.moduleId} · {field.fieldKey}
              </p>
              <p className="text-xs text-text-muted">
                {field.required ? "Required" : "Optional"} · {field.hidden ? "Hidden" : "Visible"}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "pages" ? (
        <div className="ps-list ps-list--cards">
          {draft.pages.map((page) => (
            <div key={page.id} className="rx-surface-card rounded-ds-xl p-ds-4">
              <p className="font-semibold">{page.name}</p>
              <p className="text-sm text-text-secondary">
                {page.pageType} · {page.route ?? "No route"}
              </p>
              <span
                className={cn(
                  "mc-builder__pill",
                  page.status === "published" ? "mc-builder__pill--live" : "mc-builder__pill--draft",
                )}
              >
                {page.status}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "components" ? (
        <div className="ps-list ps-list--cards">
          {draft.componentRegistry.map((component) => (
            <div key={component.id} className="rx-surface-card rounded-ds-xl p-ds-4">
              <p className="font-semibold">{component.label}</p>
              <p className="text-sm text-text-secondary">
                {component.type} · v{component.version}
              </p>
              <p className="text-xs text-text-muted">
                {component.shared ? "Shared" : "Private"} · {component.moduleId}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "history" ? (
        <HistoryPanel
          auditLog={draft.auditLog}
          history={snapshot.history}
          onRollback={(id) => runAction("rollback", id)}
          isPending={isPending}
        />
      ) : null}

      <section className="ps-preview">
        <ResponsivePreviewFrame src="/" title="Platform live preview" />
      </section>
    </div>
  );
}

function ModuleGrid({
  modules,
  selectedModule,
  onSelect,
}: {
  modules: PlatformStudioModule[];
  selectedModule: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="ps-module-grid">
      {modules.map((module) => (
        <button
          key={module.id}
          type="button"
          className={cn("ps-module-card", selectedModule === module.id && "ps-module-card--active")}
          onClick={() => onSelect(module.id)}
        >
          <span className="ps-module-card__icon"><ModuleIcon href={module.href} id={module.id} /></span>
          <span className="ps-module-card__title">{module.label}</span>
          <span className="ps-module-card__meta">{module.builders.join(" · ")}</span>
          {module.href ? (
            <Link href={module.href} className="ps-module-card__link" onClick={(e) => e.stopPropagation()}>
              Open module
            </Link>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function BuilderList({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string; meta: string; moduleId: string }[];
}) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">{title}</h2>
      <div className="ps-list">
        {items.map((item) => (
          <div key={item.id} className="ps-list__item ps-list__item--static">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-text-secondary">{item.meta}</p>
            </div>
            <span className="ps-chip">{item.moduleId}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistoryPanel({
  auditLog,
  history,
  onRollback,
  isPending,
}: {
  auditLog: PlatformStudioSnapshot["draft"]["auditLog"];
  history: PlatformStudioHistoryEntry[];
  onRollback: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="ps-history-grid">
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Visual audit log</h2>
        <div className="mc-theme-studio__history">
          {auditLog.length === 0 ? <p className="mc-section__desc">Changes will be logged here.</p> : null}
          {auditLog.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">
                  {entry.module} · {entry.action}
                </p>
                <p className="text-sm text-text-secondary">
                  {entry.administrator} · {new Date(entry.timestamp).toLocaleString()}
                  {entry.rollbackAvailable ? " · rollback available" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Version history</h2>
        <div className="mc-theme-studio__history">
          {history.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">{entry.label}</p>
                <p className="text-sm text-text-secondary">{new Date(entry.publishedAt).toLocaleString()}</p>
              </div>
              {entry.rollbackAvailable ? (
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => onRollback(entry.id)}>
                  Rollback
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
