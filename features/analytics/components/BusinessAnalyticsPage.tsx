"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { Avatar } from "@/components/ui/Avatar";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { BusinessAnalyticsChart } from "@/features/analytics/components/BusinessAnalyticsChart";
import { useBusinessAnalyticsV1 } from "@/features/analytics/hooks/use-business-analytics-v1";
import {
  BUSINESS_ANALYTICS_PERIODS,
  formatBusinessGbp,
  formatBusinessPercent,
  londonDateKey,
  type BusinessAnalyticsPeriodId,
} from "@/lib/analytics/business-analytics-v1";
import type {
  BusinessAnalyticsData,
  BusinessAnalyticsMetric,
} from "@/lib/analytics/types";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import "@/styles/rovexo/business-analytics-v1.css";

type BusinessAnalyticsPageProps = {
  initialData: BusinessAnalyticsData;
  backHref?: string;
};

type AnalyticsTab = "sales" | "traffic";

const SALES_SEE_ALL_HREF = "/business/orders";
const PRODUCTS_SEE_ALL_HREF = "/business/inventory";

const METRIC_EMOJI: Record<string, string> = {
  sales: PLATFORM_EMOJI.balance,
  orders: PLATFORM_EMOJI.bag,
  "quantity-sold": PLATFORM_EMOJI.listings,
  "average-sale": PLATFORM_EMOJI.analytics,
  "listing-views": PLATFORM_EMOJI.eye,
  "traffic-quantity-sold": PLATFORM_EMOJI.bag,
  "click-through-rate": PLATFORM_EMOJI.search,
  "conversion-rate": PLATFORM_EMOJI.analytics,
};

function formatChartY(value: number, format: "currency" | "number"): string {
  if (format === "currency") {
    if (!Number.isFinite(value) || value <= 0) return "£0";
    if (value >= 1000 && value % 1000 === 0) return `£${value / 1000}k`;
    return `£${Math.round(value)}`;
  }
  return String(Math.round(Number.isFinite(value) ? value : 0));
}

function MetricCard({ metric }: { metric: BusinessAnalyticsMetric }) {
  const up = (metric.deltaPercent ?? 0) > 0;
  return (
    <article className={`biz-analytics__metric biz-analytics__metric--${metric.id}`} data-metric={metric.id}>
      <span className="biz-analytics__metric-icon" aria-hidden>
        <PlatformEmoji emoji={METRIC_EMOJI[metric.id] ?? PLATFORM_EMOJI.analytics} size={16} />
      </span>
      <p className="biz-analytics__metric-label">{metric.label}</p>
      <p className="biz-analytics__metric-value">{metric.display}</p>
      {metric.deltaPercent != null && metric.deltaLabel ? (
        <p className={`biz-analytics__delta ${up ? "biz-analytics__delta--up" : "biz-analytics__delta--down"}`}>
          {up ? "▲" : "▼"} {formatBusinessPercent(Math.abs(metric.deltaPercent))}
          <span>{metric.deltaLabel}</span>
        </p>
      ) : null}
    </article>
  );
}

export function BusinessAnalyticsPage({
  initialData,
  backHref = "/business/menu",
}: BusinessAnalyticsPageProps) {
  const { data, loading, changePeriod } = useBusinessAnalyticsV1(initialData);
  const [tab, setTab] = useState<AnalyticsTab>("sales");
  const [customFrom, setCustomFrom] = useState(() => londonDateKey(new Date(initialData.rangeStart)));
  const [customTo, setCustomTo] = useState(() => londonDateKey(new Date(initialData.rangeEnd)));

  const salesOverview = data.sales.overview;
  const trafficOverview = data.traffic.overview;
  const showCustom = data.period === "custom";

  const salesY = useMemo(
    () => (value: number) => formatChartY(value, "currency"),
    [],
  );
  const viewsY = useMemo(
    () => (value: number) => formatChartY(value, "number"),
    [],
  );

  function onPeriod(period: BusinessAnalyticsPeriodId) {
    if (period === "custom") {
      void changePeriod("custom", { from: customFrom, to: customTo });
      return;
    }
    void changePeriod(period);
  }

  return (
    <AccountCanonicalShell
      title="Analytics"
      backHref={backHref}
      backLabel="Business Menu"
      showHeaderTitle
      showBottomNav={false}
    >
      <div
        className="biz-analytics"
        data-business-analytics="v1"
        data-analytics-tab={tab}
        data-analytics-period={data.period}
        data-analytics-isolated={data.isolated ? "true" : "false"}
        aria-busy={loading}
      >
        <section className="biz-analytics__identity" data-analytics-identity>
          <Avatar
            src={data.identity.avatarUrl}
            name={data.identity.businessName}
            alt={data.identity.businessName}
            size="lg"
          />
          <div className="biz-analytics__identity-copy">
            <p className="biz-analytics__identity-name">
              <span>{data.identity.businessName}</span>
              <span aria-hidden>{PLATFORM_EMOJI.dropdown}</span>
            </p>
            <p className="biz-analytics__identity-sub">Business overview</p>
          </div>
        </section>

        <div className="biz-analytics__tabs" role="tablist" aria-label="Analytics views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "sales"}
            className={`biz-analytics__tab${tab === "sales" ? " biz-analytics__tab--active" : ""}`}
            onClick={() => setTab("sales")}
          >
            Sales
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "traffic"}
            className={`biz-analytics__tab${tab === "traffic" ? " biz-analytics__tab--active" : ""}`}
            onClick={() => setTab("traffic")}
          >
            Traffic
          </button>
        </div>

        <div className="biz-analytics__periods" role="group" aria-label="Date range">
          {BUSINESS_ANALYTICS_PERIODS.map((period) => (
            <button
              key={period.id}
              type="button"
              className={`biz-analytics__pill${data.period === period.id ? " biz-analytics__pill--active" : ""}`}
              aria-pressed={data.period === period.id}
              onClick={() => onPeriod(period.id)}
            >
              {period.label}
              {period.id === "custom" ? (
                <span className="biz-analytics__pill-icon" aria-hidden>
                  <PlatformEmoji emoji={PLATFORM_EMOJI.date} size={14} />
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {showCustom ? (
          <form
            className="biz-analytics__custom"
            onSubmit={(event) => {
              event.preventDefault();
              void changePeriod("custom", { from: customFrom, to: customTo });
            }}
          >
            <label>
              From
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={londonDateKey(new Date())}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </label>
            <button type="submit">Apply</button>
          </form>
        ) : null}

        {loading ? (
          <p className="sr-only" aria-live="polite">
            Updating analytics
          </p>
        ) : null}

        {tab === "sales" ? (
          <>
            <section className="biz-analytics__metrics" aria-label="Sales overview">
              <MetricCard metric={salesOverview.sales} />
              <MetricCard metric={salesOverview.orders} />
              <MetricCard metric={salesOverview.quantitySold} />
              <MetricCard metric={salesOverview.averageSale} />
            </section>

            <BusinessAnalyticsChart chart={data.sales.chart} formatY={salesY} />

            <section className="biz-analytics__section" data-analytics-section="top-products">
              <div className="biz-analytics__section-head">
                <h2>Top Products</h2>
                <Link className="biz-analytics__see-all" href={PRODUCTS_SEE_ALL_HREF}>
                  See all
                </Link>
              </div>
              {data.sales.topProducts.length === 0 ? (
                <p className="biz-analytics__empty">No products sold in this period.</p>
              ) : (
                <>
                  <div className="biz-analytics__cols" aria-hidden>
                    <span />
                    <span>Qty Sold</span>
                    <span>Sales</span>
                    <span />
                  </div>
                  {data.sales.topProducts.map((product) => (
                    <Link key={product.id} href={product.href} className="biz-analytics__row">
                      <span className="biz-analytics__thumb">
                        <ProductRowImage
                          src={product.imageUrl}
                          alt=""
                          containerClassName="relative h-12 w-12"
                          sizes="48px"
                        />
                      </span>
                      <p className="biz-analytics__row-title">{product.title}</p>
                      <p className="biz-analytics__row-num">{product.qtySold}</p>
                      <p className="biz-analytics__row-money">{formatBusinessGbp(product.sales)}</p>
                      <span className="biz-analytics__chevron" aria-hidden>
                        {PLATFORM_EMOJI.chevron}
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </section>

            <section className="biz-analytics__section" data-analytics-section="recent-sales">
              <div className="biz-analytics__section-head">
                <h2>Recent Sales</h2>
                <Link className="biz-analytics__see-all" href={SALES_SEE_ALL_HREF}>
                  See all
                </Link>
              </div>
              {data.sales.recentSales.length === 0 ? (
                <p className="biz-analytics__empty">No sales in this period.</p>
              ) : (
                data.sales.recentSales.map((sale) => (
                  <Link key={sale.id} href={sale.href} className="biz-analytics__row biz-analytics__row--sale">
                    <span className="biz-analytics__thumb">
                      <ProductRowImage
                        src={sale.imageUrl}
                        alt=""
                        containerClassName="relative h-12 w-12"
                        sizes="48px"
                      />
                    </span>
                    <p className="biz-analytics__row-title">{sale.title}</p>
                    <span className="biz-analytics__sale-meta">
                      <p className="biz-analytics__row-money">{formatBusinessGbp(sale.amount)}</p>
                      <time dateTime={sale.soldAt}>{sale.dateLabel}</time>
                    </span>
                    <span className="biz-analytics__chevron" aria-hidden>
                      {PLATFORM_EMOJI.chevron}
                    </span>
                  </Link>
                ))
              )}
            </section>
          </>
        ) : (
          <>
            <section className="biz-analytics__metrics" aria-label="Traffic overview">
              <MetricCard metric={trafficOverview.listingViews} />
              <MetricCard metric={trafficOverview.quantitySold} />
              <MetricCard metric={trafficOverview.clickThroughRate} />
              <MetricCard metric={trafficOverview.conversionRate} />
            </section>

            <BusinessAnalyticsChart chart={data.traffic.chart} formatY={viewsY} />

            <section className="biz-analytics__section" data-analytics-section="traffic-sources">
              <div className="biz-analytics__section-head">
                <h2>Where buyers found you</h2>
              </div>
              <p className="biz-analytics__empty">
                Source attribution is not recorded on ROVEXO listing views, so this breakdown is unavailable.
              </p>
            </section>

            <section className="biz-analytics__section" data-analytics-section="keywords">
              <div className="biz-analytics__section-head">
                <h2>Top searched keywords</h2>
              </div>
              <p className="biz-analytics__empty">
                Listing search keywords are not recorded, so this list is unavailable.
              </p>
            </section>
          </>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
