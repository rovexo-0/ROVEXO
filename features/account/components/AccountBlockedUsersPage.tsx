"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock, CanonicalButton, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { PeopleLineIcon } from "@/components/icons/RvxLineIcons";
import { blockUsernameSchema } from "@/lib/account/schemas";
import type { BlockedUser } from "@/lib/account/blocked-users";
import { z } from "zod";

type BlockForm = z.infer<typeof blockUsernameSchema>;

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
    <AccountCanonicalShell title="Blocked Users" backHref="/account/settings">
      <CanonicalSection title="Block a user">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-ds-4" noValidate>
            <CanonicalInput
              id="username"
              label="Username"
              placeholder="seller_username"
              error={errors.username?.message}
              {...register("username")}
            />
            <CanonicalButton type="submit" fullWidth loading={isSubmitting}>
              {isSubmitting ? "Blocking…" : "Block user"}
            </CanonicalButton>
            {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
          </form>
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Blocked list">
        {loading ? <CanonicalInfoBlock variant="description">Loading…</CanonicalInfoBlock> : null}
        {!loading && !blocked.length ? (
          <CanonicalInfoBlock variant="description">You have not blocked anyone.</CanonicalInfoBlock>
        ) : null}
        <CanonicalCard variant="list">
          {blocked.map((entry) => (
            <div key={entry.id}>
              <CanonicalMenuRow
                title={`@${entry.username}`}
                description={entry.fullName}
                icon={<PeopleLineIcon />}
              />
              <CanonicalMenuRow title="Unblock" onClick={() => void unblock(entry.id)} />
            </div>
          ))}
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
