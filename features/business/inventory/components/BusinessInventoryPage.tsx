"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { useToast } from "@/components/ui/Toast";
import { MoreLineIcon, SearchLineIcon } from "@/components/icons/RvxLineIcons";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalModal } from "@/src/components/canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import {
  filterInventoryItems,
  formatInventoryStockOverview,
  inventoryFilterStats,
  normalizeInventoryViewFilter,
  type InventoryItem,
  type InventoryViewFilter,
} from "@/lib/business/inventory-overview-v1";
import { PWA_BUSINESS_ACTION_EMOJI } from "@/lib/business/pwa-business-menu-v1";
import type { BusinessInventoryData } from "@/lib/business/types";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { editListingHref } from "@/lib/sell/canonical-edit-listing-engine-v1";
import "@/styles/rovexo/business-onboarding-v1.css";

type BusinessInventoryPageProps = {
  data: BusinessInventoryData;
};

const FILTER_CARDS: {
  id: InventoryViewFilter;
  label: string;
  stat: keyof ReturnType<typeof inventoryFilterStats>;
}[] = [
  { id: "all", label: "All products", stat: "all" },
  { id: "active", label: "In stock", stat: "inStock" },
  { id: "low_stock", label: "Low stock", stat: "low" },
  { id: "out_of_stock", label: "Out of stock", stat: "out" },
];

export function BusinessInventoryPage({ data }: BusinessInventoryPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>(data.items);
  const [query, setQuery] = useState("");
  const filter = normalizeInventoryViewFilter(searchParams.get("filter"));
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const productCount = items.length;
  const stats = useMemo(() => inventoryFilterStats(items), [items]);
  const filteredItems = useMemo(
    () => filterInventoryItems(items, query, filter),
    [items, query, filter],
  );
  const countLabel = `${productCount} ${productCount === 1 ? "product" : "products"}`;

  const refreshInventory = useCallback(() => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const run = (async () => {
      try {
        const response = await fetch("/api/business/inventory", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          setFailed(true);
          return;
        }
        const json = (await response.json()) as { items?: InventoryItem[] };
        if (Array.isArray(json.items)) {
          setItems(json.items);
          setFailed(false);
        }
      } catch {
        setFailed(true);
      }
    })();
    refreshInFlight.current = run.finally(() => {
      refreshInFlight.current = null;
    });
    return refreshInFlight.current;
  }, []);

  useEffect(() => {
    void refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshInventory();
    };
    const onPageShow = () => {
      void refreshInventory();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [refreshInventory]);

  useEffect(() => {
    if (!openMenuId) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(`[data-inventory-row-menu="${openMenuId}"]`)) return;
      if (target?.closest(`[data-inventory-menu-trigger="${openMenuId}"]`)) return;
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [openMenuId]);

  function selectFilter(next: InventoryViewFilter) {
    setOpenMenuId(null);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    const qs = params.toString();
    router.replace(qs ? `/business/inventory?${qs}` : "/business/inventory", { scroll: false });
  }

  function openSellEditor(item: InventoryItem) {
    setOpenMenuId(null);
    router.push(editListingHref(item.id));
  }

  function requestDelete(item: InventoryItem) {
    setOpenMenuId(null);
    setPendingDelete(item);
  }

  async function confirmDelete() {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/listings/${pendingDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        pushToast({
          title: payload?.error ?? "Unable to delete listing.",
          variant: "error",
        });
        return;
      }
      setPendingDelete(null);
      await refreshInventory();
    } catch {
      pushToast({ title: "Unable to delete listing.", variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  if (failed && items.length === 0) {
    return (
      <AccountCanonicalShell
        title="INVENTORY"
        backHref="/business/menu"
        backLabel="Business Menu"
        showHeaderTitle
        showBottomNav={false}
      >
        <FailClosedPanel onRetry={() => void refreshInventory()} />
      </AccountCanonicalShell>
    );
  }

  return (
    <AccountCanonicalShell
      title="INVENTORY"
      backHref="/business/menu"
      backLabel="Business Menu"
      showHeaderTitle
      showBottomNav={false}
    >
      <div
        className="biz-inventory"
        data-business-inventory="overview-v2"
        data-inventory-count={productCount}
        data-inventory-filter={filter}
      >
        <header className="biz-inventory__identity">
          <span className="biz-inventory__store-icon" aria-hidden>
            <PlatformEmoji emoji={PWA_BUSINESS_ACTION_EMOJI.inventory} width={22} height={22} />
          </span>
          <div className="biz-inventory__identity-copy">
            <p className="biz-inventory__company">{data.company.companyName}</p>
            <p className="biz-inventory__count">{countLabel}</p>
          </div>
        </header>

        <label className="biz-inventory__search">
          <SearchLineIcon className="biz-inventory__search-icon" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search inventory"
            aria-label="Search inventory"
            autoComplete="off"
          />
        </label>

        <div className="biz-inventory__cards" role="tablist" aria-label="Inventory filters">
          {FILTER_CARDS.map((card) => {
            const selected = filter === card.id;
            return (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className="biz-inventory__card"
                data-inventory-filter-card={card.id}
                data-active={selected ? "true" : "false"}
                onClick={() => selectFilter(card.id)}
              >
                <span className="biz-inventory__card-value">{stats[card.stat]}</span>
                <span className="biz-inventory__card-label">{card.label}</span>
              </button>
            );
          })}
        </div>

        {items.length === 0 ? (
          <p className="biz-inventory__empty">No products in your inventory yet.</p>
        ) : filteredItems.length === 0 ? (
          <p className="biz-inventory__empty">No products found.</p>
        ) : (
          <ul className="biz-inventory__list">
            {filteredItems.map((item) => {
              const menuOpen = openMenuId === item.id;
              return (
                <li key={item.id} className="biz-inventory__row" data-inventory-row={item.id}>
                  <span className="biz-inventory__thumb" aria-hidden>
                    <ProductRowImage
                      src={item.imageUrl}
                      alt=""
                      containerClassName="relative h-12 w-12"
                      sizes="48px"
                    />
                  </span>
                  <div className="biz-inventory__meta">
                    <p className="biz-inventory__item-title">{item.title}</p>
                    <p className="biz-inventory__sku">SKU: {item.sku}</p>
                  </div>
                  <p
                    className="biz-inventory__stock"
                    data-stock-status={item.status}
                  >
                    {formatInventoryStockOverview(item.stock)}
                  </p>
                  <div className="biz-inventory__menu-wrap">
                    <button
                      type="button"
                      className="biz-inventory__menu-trigger"
                      data-inventory-menu-trigger={item.id}
                      aria-label={`Actions for ${item.title}`}
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                      onClick={() =>
                        setOpenMenuId((current) => (current === item.id ? null : item.id))
                      }
                    >
                      <MoreLineIcon className="h-5 w-5" />
                    </button>
                    {menuOpen ? (
                      <div
                        className="biz-inventory__menu"
                        role="menu"
                        data-inventory-row-menu={item.id}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openSellEditor(item)}
                        >
                          <span aria-hidden>{PLATFORM_EMOJI.edit}</span>
                          Edit product
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openSellEditor(item)}
                        >
                          <span aria-hidden>{PWA_BUSINESS_ACTION_EMOJI.inventory}</span>
                          Manage stock
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="biz-inventory__menu-danger"
                          onClick={() => requestDelete(item)}
                        >
                          <span aria-hidden>{PLATFORM_EMOJI.delete}</span>
                          Delete product
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <CanonicalModal
        open={pendingDelete !== null}
        variant="delete"
        title="Delete product?"
        cancelLabel="Cancel"
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        loading={isDeleting}
        onClose={() => {
          if (isDeleting) return;
          setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      >
        <p>
          Are you sure you want to delete
          {pendingDelete ? ` "${pendingDelete.title}"?` : " this product?"}
        </p>
        <p>This action cannot be undone.</p>
      </CanonicalModal>
    </AccountCanonicalShell>
  );
}
