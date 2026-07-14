import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const css = fs.readFileSync(
  path.join(process.cwd(), "styles/rovexo/wallet-hub-v1.css"),
  "utf8",
);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Wallet v1.1 visual fixture</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
  .frame { width: 390px; margin: 0 auto; min-height: 100vh; background: #fff; }
  .account-canonical-header__bar--titled {
    display: grid; grid-template-columns: 40px 1fr 40px; align-items: center;
    height: 64px; padding: 0 20px; gap: 8px;
  }
  .account-canonical-header__title { margin: 0; text-align: center; font-size: 32px; font-weight: 700; }
  .fake-back, .wallet-v2__help {
    width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid #eee; border-radius: 12px; color: #111;
  }
  ${css}
</style>
</head>
<body>
<div class="frame account-canonical-shell">
  <div class="account-canonical">
    <header class="account-canonical-header__bar--titled">
      <span class="fake-back" aria-hidden>←</span>
      <h1 class="account-canonical-header__title">Wallet</h1>
      <span class="wallet-v2__help" aria-hidden>?</span>
    </header>
    <main class="cds-layout__content cds-layout__content--account-canonical">
      <div class="wallet-v2" data-wallet-ui="v1.1-simplified">
        <section class="wallet-v2__hero">
          <div class="wallet-v2__hero-top">
            <p class="wallet-v2__hero-label">Available Balance</p>
            <span class="wallet-v2__status-pill"><span class="wallet-v2__status-dot"></span>Available</span>
          </div>
          <p class="wallet-v2__hero-balance">£0.00</p>
          <div class="wallet-v2__hero-actions">
            <a class="wallet-v2__hero-btn wallet-v2__hero-btn--primary" href="#">Withdraw</a>
            <a class="wallet-v2__hero-btn wallet-v2__hero-btn--secondary" href="#">Bank Account</a>
          </div>
        </section>

        <section class="wallet-v2__balance-card">
          <a class="wallet-v2__balance-row" href="#"><span class="wallet-v2__balance-icon">⏱</span><span class="wallet-v2__balance-label">Pending</span><span class="wallet-v2__balance-amount">£0.00</span><span class="wallet-v2__balance-chevron">›</span></a>
          <a class="wallet-v2__balance-row" href="#"><span class="wallet-v2__balance-icon">👛</span><span class="wallet-v2__balance-label">Available</span><span class="wallet-v2__balance-amount">£0.00</span><span class="wallet-v2__balance-chevron">›</span></a>
          <a class="wallet-v2__balance-row" href="#"><span class="wallet-v2__balance-icon">↻</span><span class="wallet-v2__balance-label">Processing</span><span class="wallet-v2__balance-amount">£0.00</span><span class="wallet-v2__balance-chevron">›</span></a>
          <a class="wallet-v2__balance-row" href="#"><span class="wallet-v2__balance-icon">✓</span><span class="wallet-v2__balance-label">Paid Out</span><span class="wallet-v2__balance-amount">£0.00</span><span class="wallet-v2__balance-chevron">›</span></a>
        </section>

        <section class="wallet-v2__section wallet-v2__section--quick">
          <div class="wallet-v2__section-head"><h2 class="wallet-v2__section-title">Quick Actions</h2></div>
          <div class="wallet-v2__quick-card">
            <div class="wallet-v2__quick-grid">
              <a class="wallet-v2__quick" href="#"><span class="wallet-v2__quick-icon">+</span><span class="wallet-v2__quick-label">Add Bank</span></a>
              <a class="wallet-v2__quick" href="#"><span class="wallet-v2__quick-icon">↑</span><span class="wallet-v2__quick-label">Withdraw</span></a>
              <a class="wallet-v2__quick" href="#"><span class="wallet-v2__quick-icon">≡</span><span class="wallet-v2__quick-label">Transactions</span></a>
              <a class="wallet-v2__quick" href="#"><span class="wallet-v2__quick-icon">▭</span><span class="wallet-v2__quick-label">Payment Methods</span></a>
            </div>
          </div>
        </section>

        <section class="wallet-v2__section">
          <div class="wallet-v2__section-head"><h2 class="wallet-v2__section-title">Insights</h2><a class="wallet-v2__section-link" href="#">View all</a></div>
          <div class="wallet-v2__insights">
            <article class="wallet-v2__insight-card"><h3 class="wallet-v2__insight-heading">This Month</h3></article>
            <article class="wallet-v2__insight-card"><h3 class="wallet-v2__insight-heading">Next Payout</h3></article>
          </div>
        </section>

        <section class="wallet-v2__section wallet-v2__section--bank">
          <div class="wallet-v2__section-head"><h2 class="wallet-v2__section-title">Connected Bank</h2></div>
          <div class="wallet-v2__bank-card">
            <a class="wallet-v2__bank-main wallet-v2__bank-main--empty" href="#">
              <span class="wallet-v2__bank-icon">🏦</span>
              <span class="wallet-v2__bank-copy">
                <span class="wallet-v2__bank-name">No bank account connected</span>
                <span class="wallet-v2__bank-inline-cta">Connect Bank Account →</span>
              </span>
              <span class="wallet-v2__bank-chevron">›</span>
            </a>
          </div>
        </section>

        <section class="wallet-v2__section">
          <div class="wallet-v2__section-head"><h2 class="wallet-v2__section-title">Transactions</h2><a class="wallet-v2__section-link" href="#">View all</a></div>
          <div class="wallet-v2__txn-card">
            <div class="wallet-v2__txn-empty">
              <div class="wallet-v2__txn-empty-icon">📄</div>
              <p class="wallet-v2__txn-empty-title">No transactions yet</p>
              <p class="wallet-v2__txn-empty-copy">Sales and withdrawals will appear here.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</div>
<script>
  const root = document.querySelector('.wallet-v2');
  const hero = document.querySelector('.wallet-v2__hero');
  const bankBtn = [...document.querySelectorAll('.wallet-v2__hero-btn')].at(-1);
  const metrics = document.querySelector('.wallet-v2__metrics');
  const balance = document.querySelector('.wallet-v2__balance-card');
  const quick = document.querySelector('.wallet-v2__quick-card');
  const report = {
    rootW: root.getBoundingClientRect().width,
    heroOverflowRight: Math.round(hero.getBoundingClientRect().right - root.getBoundingClientRect().right),
    bankBtnClipped: bankBtn.getBoundingClientRect().right > hero.getBoundingClientRect().right + 0.5,
    hasOldMetrics: Boolean(metrics),
    hasBalanceList: Boolean(balance),
    hasQuickCard: Boolean(quick),
    bankHeight: Math.round(document.querySelector('.wallet-v2__bank-main').getBoundingClientRect().height),
  };
  document.title = JSON.stringify(report);
  console.log(JSON.stringify(report));
</script>
</body>
</html>`;

const outDir = path.join(process.cwd(), "tmp");
fs.mkdirSync(outDir, { recursive: true });
const htmlPath = path.join(outDir, "wallet-v1.1-fixture.html");
const shotPath = path.join(outDir, "wallet-v1.1-fixture.png");
fs.writeFileSync(htmlPath, html, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 1200 } });
await page.goto("file://" + htmlPath.replace(/\\/g, "/"));
await page.screenshot({ path: shotPath, fullPage: true });
const title = await page.title();
await browser.close();
console.log("REPORT", title);
console.log("SHOT", shotPath);
const report = JSON.parse(title);
if (
  report.heroOverflowRight > 0 ||
  report.bankBtnClipped ||
  report.hasOldMetrics ||
  !report.hasBalanceList ||
  !report.hasQuickCard ||
  report.bankHeight > 100
) {
  process.exitCode = 1;
}
