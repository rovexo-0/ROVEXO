"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { Button } from "@/components/ui/Button";
import { blockUsernameSchema } from "@/lib/account/schemas";
import type { BlockedUser } from "@/lib/account/blocked-users";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { z } from "zod";

type BlockForm = z.infer<typeof blockUsernameSchema>;

const inputClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

export function AccountBlockedUsersPage() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlockForm>({
    resolver: zodResolver(blockUsernameSchema),
    defaultValues: { username: "" },
  });

  const loadBlocked = async () => {
    const response = await fetch("/api/account/blocked-users");
    const payload = (await response.json()) as { blocked: BlockedUser[] };
    setBlocked(payload.blocked ?? []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/account/blocked-users");
      const payload = (await response.json()) as { blocked: BlockedUser[] };
      if (!cancelled) {
        setBlocked(payload.blocked ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/account/blocked-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string };
    if (response.ok) {
      reset({ username: "" });
      await loadBlocked();
      setMessage("User blocked.");
    } else {
      setMessage(payload.error ?? "Unable to block user.");
    }
  });

  const unblock = async (id: string) => {
    await fetch(`/api/account/blocked-users/${id}`, { method: "DELETE" });
    await loadBlocked();
  };

  return (
    <AccountPageShell
      title="Blocked users"
      subtitle="Block users to prevent them from messaging you on ROVEXO."
      backHref="/account/profile"
      backLabel="Security"
    >
      <form onSubmit={onSubmit} className="rx-surface-card flex flex-col gap-ds-3 p-ds-5" noValidate>
        <h2 className="text-base font-semibold text-text-primary">Block a user</h2>
        <div>
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            className={cn(inputClassName, "mt-ds-1")}
            placeholder="seller_username"
            {...register("username")}
          />
          {errors.username ? <p className="text-xs text-danger">{errors.username.message}</p> : null}
        </div>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Blocking…" : "Block user"}
        </Button>
        {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
      </form>

      <section className="rx-surface-card mt-ds-4 p-ds-5">
        <h2 className="text-base font-semibold text-text-primary">Blocked list</h2>
        {loading ? <p className="mt-ds-3 text-sm text-text-secondary">Loading…</p> : null}
        {!loading && !blocked.length ? (
          <p className="mt-ds-3 text-sm text-text-secondary">You have not blocked anyone.</p>
        ) : null}
        <ul className="mt-ds-3 flex flex-col gap-ds-3">
          {blocked.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-ds-3 rounded-ds-lg border border-border p-ds-3"
            >
              <div>
                <p className="font-medium text-text-primary">@{entry.username}</p>
                <p className="text-sm text-text-secondary">{entry.fullName}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => void unblock(entry.id)}>
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </AccountPageShell>
  );
}
