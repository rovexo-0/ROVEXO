import { OwnerDemoModePanel } from "@/features/super-admin/components/OwnerDemoModePanel";

export default function OwnerDemoModePage() {
  return (
    <div className="space-y-ds-4 p-ds-4">
      <h1 className="text-xl font-semibold">Owner Demo Mode</h1>
      <OwnerDemoModePanel />
    </div>
  );
}
