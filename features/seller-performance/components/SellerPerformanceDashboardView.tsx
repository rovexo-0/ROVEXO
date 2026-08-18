import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { CanonicalBadgeArtwork } from "@/components/badge/CanonicalBadgeArtwork";
import { ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { SellerPerformanceHistorySection } from "@/features/seller-performance/components/SellerPerformanceHistorySection";
import styles from "@/features/seller-performance/components/SellerPerformancePage.module.css";
import { BADGE_CATALOG } from "@/lib/badge/badge-engine-v1";
import { listCountableAchievementProgress } from "@/lib/seller-performance/achievements";
import { minScoreForLevel } from "@/lib/seller-performance/levels";
import {
  SELLER_LEVEL_LABELS,
  SELLER_SCORE_MAX,
  type SellerPerformanceComponentKey,
} from "@/lib/seller-performance/master-spec";
import type {
  ScoreHistoryRange,
  SellerPerformanceDashboard,
} from "@/lib/seller-performance/types";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

type PublicBadgeRow = { id: string; label: string; tooltip?: string };

type DisplayBadge = {
  id: string;
  label: string;
  detail: string;
};

type SellerPerformanceDashboardViewProps = {
  data: SellerPerformanceDashboard;
  historyRange?: ScoreHistoryRange;
  publicBadges?: PublicBadgeRow[];
};

const FACTOR_ICONS: Record<SellerPerformanceComponentKey, AccountIconName> = {
  reviews: "reviews",
  completedOrders: "orders",
  responseRate: "messages",
  averageResponseTime: "messages",
  dispatchTime: "shipping",
  cancellationRate: "returns",
  validReports: "disputes",
  profileCompletion: "profile",
  storeActivity: "stores",
};

const PRIMARY_FACTORS: SellerPerformanceComponentKey[] = [
  "averageResponseTime",
  "dispatchTime",
  "completedOrders",
  "reviews",
  "cancellationRate",
];

function markSeen(seen: Set<string>, id: string, label: string) {
  seen.add(id);
  seen.add(label.trim().toLowerCase());
}

function alreadySeen(seen: Set<string>, id: string, label: string) {
  return seen.has(id) || seen.has(label.trim().toLowerCase());
}

function formatEarnedOn(iso: string | null): string {
  if (!iso) return "Earned";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Earned";
  return `Earned on ${date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function buildBadgeLists(
  achievements: SellerPerformanceDashboard["achievements"],
  publicBadges: PublicBadgeRow[],
): { earned: DisplayBadge[]; locked: DisplayBadge[] } {
  const earned: DisplayBadge[] = [];
  const locked: DisplayBadge[] = [];
  const seen = new Set<string>();

  for (const achievement of achievements) {
    if (!achievement.earned) continue;
    earned.push({
      id: achievement.id,
      label: achievement.label,
      detail: formatEarnedOn(achievement.earnedAt),
    });
    markSeen(seen, achievement.id, achievement.label);
  }

  for (const badge of publicBadges) {
    if (alreadySeen(seen, badge.id, badge.label)) continue;
    earned.push({
      id: badge.id,
      label: badge.label,
      detail: "Earned",
    });
    markSeen(seen, badge.id, badge.label);
  }

  for (const achievement of achievements) {
    if (achievement.earned) continue;
    if (alreadySeen(seen, achievement.id, achievement.label)) continue;
    locked.push({
      id: achievement.id,
      label: achievement.label,
      detail: achievement.description,
    });
    markSeen(seen, achievement.id, achievement.label);
  }

  for (const definition of Object.values(BADGE_CATALOG)) {
    if (definition.status !== "active") continue;
    if (definition.audience === "buyer") continue;
    if (alreadySeen(seen, definition.id, definition.label)) continue;
    locked.push({
      id: definition.id,
      label: definition.label,
      detail: definition.tooltip,
    });
    markSeen(seen, definition.id, definition.label);
  }

  return { earned, locked };
}

/** Selling → Performance — live engine values, reference layout. */
export function SellerPerformanceDashboardView({
  data,
  historyRange = "90d",
  publicBadges = [],
}: SellerPerformanceDashboardViewProps) {
  const levelName = SELLER_LEVEL_LABELS[data.score.level];
  const nextLevelName = data.progress.nextLevel
    ? SELLER_LEVEL_LABELS[data.progress.nextLevel]
    : null;
  const nextLevelMin = data.progress.nextLevel
    ? minScoreForLevel(data.progress.nextLevel)
    : SELLER_SCORE_MAX;
  const progressPercent = Math.max(0, Math.min(100, data.progress.percent));
  const scorePercent = Math.max(0, Math.min(100, data.score.score));
  const { earned, locked } = buildBadgeLists(data.achievements, publicBadges);
  const inProgress = data.score.factors
    ? listCountableAchievementProgress(data.score.factors, data.score.achievements)
    : [];
  const inProgressIds = new Set<string>(inProgress.map((row) => row.id));
  const lockedVisible = locked.filter((badge) => !inProgressIds.has(badge.id));
  const primaryFactors = PRIMARY_FACTORS.map((key) =>
    data.factorBreakdown.find((factor) => factor.key === key),
  ).filter((factor): factor is NonNullable<typeof factor> => Boolean(factor));

  return (
    <AccountCanonicalShell
      title="Performance"
      backHref="/seller"
      backLabel="Selling"
      showHeaderTitle
      intro="Track your progress and unlock badges as you grow."
    >
      <div
        className={`ac-canonical ${styles.page}`}
        data-seller-performance="v2.0-standard"
      >
        <div className={styles.summaryGrid}>
          <CanonicalCard className={styles.summaryCard}>
            <p className={styles.cardKicker}>Your Score</p>
            <div className={styles.scoreWrap}>
              <div
                className={styles.scoreRing}
                style={{ ["--p" as string]: scorePercent }}
                role="img"
                aria-label={`Seller score ${data.score.score} out of ${SELLER_SCORE_MAX}`}
              >
                <div className={styles.scoreRingInner}>
                  <p className={styles.scoreValue}>{data.score.score}</p>
                  <p className={styles.scoreMax}>/{SELLER_SCORE_MAX}</p>
                </div>
              </div>
            </div>
          </CanonicalCard>

          <CanonicalCard className={styles.summaryCard}>
            <p className={styles.cardKicker}>Current Level</p>
            <div className={styles.levelTop}>
              <div className={styles.levelBadge} aria-hidden>
                <ShieldLineIcon />
              </div>
              <div>
                <p className={styles.levelName}>{levelName}</p>
                {nextLevelName ? (
                  <p className={styles.nextLevel}>Next level: {nextLevelName}</p>
                ) : (
                  <p className={styles.nextLevel}>Highest level reached</p>
                )}
              </div>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label="Progress to next level"
            >
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
            <div className={styles.levelMeta}>
              {data.progress.pointsToNext != null ? (
                <span>{data.progress.pointsToNext} points to go</span>
              ) : (
                <span>Level complete</span>
              )}
              <span>
                {data.score.score} / {nextLevelMin}
              </span>
            </div>
          </CanonicalCard>

          <CanonicalCard className={styles.summaryCard}>
            <p className={styles.cardKicker}>Next Level Rewards</p>
            <p className={styles.levelName}>{nextLevelName ?? levelName}</p>
            {data.progress.requirements.length ? (
              <ul className={styles.rewardList}>
                {data.progress.requirements.map((requirement) => (
                  <li key={requirement.kind} className={styles.rewardItem}>
                    <span>
                      <span className={styles.rewardMark} aria-hidden>
                        ✓
                      </span>{" "}
                      {requirement.label}
                    </span>
                    <span>
                      {requirement.current} / {requirement.target}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyHint}>No next-level requirements available.</p>
            )}
          </CanonicalCard>
        </div>

        <CanonicalSection title="Performance Factors">
          <CanonicalCard variant="list">
            {primaryFactors.length ? (
              primaryFactors.map((factor) => (
                <CanonicalMenuRow
                  key={factor.key}
                  title={factor.label}
                  value={factor.currentValue}
                  showChevron={false}
                  icon={
                    <span className={`ac-canonical__menu-icon ${styles.factorIcon}`} aria-hidden>
                      <AccountIcon name={FACTOR_ICONS[factor.key]} />
                    </span>
                  }
                />
              ))
            ) : (
              <p className={styles.emptyHint}>No factor values available yet.</p>
            )}
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Score Trend">
          {data.scoreHistory.length ? (
            <SellerPerformanceHistorySection
              initialRange={historyRange}
              initialPoints={data.scoreHistory}
            />
          ) : (
            <p className={styles.emptyHint}>No score history is available yet.</p>
          )}
        </CanonicalSection>

        <CanonicalSection title="Badges & Achievements">
          <p className={styles.sectionIntro}>
            Earn badges by reaching milestones and providing great service.
          </p>

          <div className={styles.subsection} data-performance-earned={earned.length}>
            <h3 className={styles.subsectionTitle}>Earned ({earned.length})</h3>
            {earned.length ? (
              <div className={styles.earnedRail}>
                {earned.map((badge) => (
                  <article
                    key={badge.id}
                    className={styles.earnedCard}
                    data-badge-card={badge.id}
                    data-badge-card-state="earned"
                  >
                    <CanonicalBadgeArtwork
                      badgeKey={badge.id}
                      state="earned"
                      size={56}
                      title={badge.label}
                    />
                    <p className={styles.badgeName}>{badge.label}</p>
                    <p className={styles.badgeMeta}>{badge.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.emptyHint}>No badges earned yet.</p>
            )}
          </div>

          <div className={styles.subsection} data-performance-progress={inProgress.length}>
            <h3 className={styles.subsectionTitle}>In Progress ({inProgress.length})</h3>
            {inProgress.length ? (
              <div className={styles.progressList}>
                {inProgress.map((row) => {
                  const percent = Math.max(0, Math.min(100, (row.current / row.target) * 100));
                  return (
                    <article
                      key={row.id}
                      className={styles.progressCard}
                      data-badge-card={row.id}
                      data-badge-card-state="in_progress"
                    >
                      <div className={styles.progressHead}>
                        <CanonicalBadgeArtwork
                          badgeKey={row.id}
                          state="in_progress"
                          size={40}
                          showStateMark={false}
                          title={row.label}
                        />
                        <div className={styles.progressCopy}>
                          <p className={styles.badgeName}>{row.label}</p>
                          <span className={styles.progressCount}>
                            {row.current} / {row.target}
                          </span>
                        </div>
                      </div>
                      <div
                        className={styles.progressTrack}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={row.target}
                        aria-valuenow={row.current}
                        aria-label={`${row.label} progress`}
                      >
                        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                      </div>
                      <p className={styles.badgeMeta}>{row.remaining} more to unlock</p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyHint}>No measurable badge progress yet.</p>
            )}
          </div>

          <div className={styles.subsection} data-performance-locked={lockedVisible.length}>
            <h3 className={styles.subsectionTitle}>Locked ({lockedVisible.length})</h3>
            {lockedVisible.length ? (
              <div className={styles.lockedGrid}>
                {lockedVisible.map((badge) => (
                  <article
                    key={badge.id}
                    className={styles.lockedCard}
                    data-badge-card={badge.id}
                    data-badge-card-state="locked"
                  >
                    <div className={styles.lockedHead}>
                      <CanonicalBadgeArtwork
                        badgeKey={badge.id}
                        state="locked"
                        size={40}
                        title={badge.label}
                      />
                    </div>
                    <p className={styles.badgeName}>{badge.label}</p>
                    {badge.detail ? <p className={styles.badgeMeta}>{badge.detail}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.emptyHint}>No locked badges.</p>
            )}
          </div>
        </CanonicalSection>
      </div>
    </AccountCanonicalShell>
  );
}
