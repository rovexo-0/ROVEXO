#!/usr/bin/env node
/**
 * Migrates remaining super-admin *Admin.tsx files to EnterpriseAdminShell / EnterpriseEngineAdminShell.
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "features/super-admin");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function write(file, content) {
  fs.writeFileSync(path.join(ROOT, file), content);
}

function ensureAdminImports(content) {
  const adminImport = 'import { EnterpriseAdminShell } from "@/features/super-admin/components/premium";';
  const omegaImport = 'import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";';
  if (!content.includes(adminImport)) {
    const btn = 'import { Button } from "@/components/ui/Button";';
    content = content.replace(btn, `${btn}\nimport { EnterpriseAdminShell } from "@/features/super-admin/components/premium";`);
  }
  if (!content.includes(omegaImport) && !content.includes("createOmegaValidations")) {
    const typesIdx = content.search(/import type /);
    if (typesIdx > 0) {
      const lineEnd = content.indexOf("\n", typesIdx);
      content = `${content.slice(0, lineEnd + 1)}import { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";\n${content.slice(lineEnd + 1)}`;
    }
  }
  return content;
}

// --- Enterprise Workflow Engine ---
{
  const file = "enterprise-workflow-engine/EnterpriseWorkflowEngineAdmin.tsx";
  let c = read(file);
  c = ensureAdminImports(c);
  if (!c.includes("const MODULE_ID")) {
    c = c.replace(
      'import type { WorkflowEngineSnapshot, WorkflowEngineTab } from "@/lib/enterprise-workflow-engine/types";',
      'import type { WorkflowEngineSnapshot, WorkflowEngineTab } from "@/lib/enterprise-workflow-engine/types";\nimport { createOmegaValidations } from "@/lib/super-admin/premium/omega-status";\n\nconst MODULE_ID = WORKFLOW_ENGINE_MODULE_DESCRIPTOR.id;',
    );
  }
  const validations = `
  const validations = createOmegaValidations(
    undefined,
    snapshot.health.status === "healthy" ? "healthy" : snapshot.health.status === "warning" ? "warning" : "critical",
  );
`;
  if (!c.includes("const validations")) {
    c = c.replace("  return (\n    <div className=\"ea-admin\">", `${validations}\n  return (\n    <div className=\"ea-admin\">`);
  }
  c = c.replace(
    /  return \(\s*<div className="ea-admin">[\s\S]*?<nav className="ea-tabs"[\s\S]*?<\/nav>\s*\n/m,
    `  return (
    <EnterpriseAdminShell
      moduleId={MODULE_ID}
      eyebrow="Enterprise Workflow Engine"
      title="Automation Platform"
      description="Configure, build, schedule, and orchestrate enterprise workflows across the ROVEXO platform."
      enterpriseScore={snapshot.health.score}
      healthStatus={snapshot.health.status}
      validations={validations}
      routeTabs={WORKFLOW_ENGINE_ROUTES}
      activeTab={activeTab}
      isPending={isPending}
      message={message}
      banner={snapshot.pendingPublish ? "Pending publish — draft workflows differ from live." : undefined}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search workflows…"
      aiInsight="OMEGA PRIME: Workflow Engine is production ready for global enterprise audit."
      actions={
        <>
          <Button type="button" disabled={isPending} onClick={() => runAction("publish")}>Publish</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>Export</Button>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => refresh()}>Refresh</Button>
        </>
      }
      quickLinks={[
        { label: "Module Registry", href: "/super-admin/module-registry" },
        { label: "Enterprise Core", href: "/super-admin/enterprise-core" },
      ]}
    >
`,
  );
  c = c.replace(/\n    <\/div>\n  \);\n}\n$/, "\n    </EnterpriseAdminShell>\n  );\n}\n");
  write(file, c);
  console.log("Migrated", file);
}

console.log("Done batch 1");
