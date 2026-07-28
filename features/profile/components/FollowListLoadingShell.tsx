"use client";

import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import "@/styles/rovexo/view-profile-v1.css";

type FollowListLoadingShellProps = {
  mode: "followers" | "following";
  username: string;
};

/**
 * Instant Followers/Following chrome while the route segment resolves.
 * Header + search only — never the profile skeleton.
 */
export function FollowListLoadingShell({ mode, username }: FollowListLoadingShellProps) {
  const title = mode === "followers" ? "Followers" : "Following";
  const backHref = username ? `/user/${encodeURIComponent(username)}` : "/search";

  return (
    <BetaAppShell>
      <div className="vp-v1" data-follow-list={mode} data-follow-list-loading="shell" data-full-width-engine="v1.0">
        <CanonicalPageHeader title={title} backHref={backHref} />
        <HubPageMain className="vp-v1__main">
          {username ? (
            <p className="vp-v1__username" style={{ marginBottom: 12 }}>
              @{username}
            </p>
          ) : null}
          <label className="sr-only" htmlFor={`follow-search-${mode}-loading`}>
            Search
          </label>
          <input
            id={`follow-search-${mode}-loading`}
            type="search"
            className={cn("vp-v1__follow-search", focusRing)}
            placeholder="Search"
            readOnly
            aria-busy="true"
            value=""
          />
        </HubPageMain>
      </div>
    </BetaAppShell>
  );
}
