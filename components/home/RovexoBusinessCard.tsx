"use client";

import Image from "next/image";
import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { RovexoBusiness } from "@/components/home/constants";
import styles from "@/components/home/RovexoBusinessCard.module.css";

type RovexoBusinessCardProps = {
  business: RovexoBusiness;
  className?: string;
};

export function RovexoBusinessCard({ business, className }: RovexoBusinessCardProps) {
  return (
    <Link href={business.href} className={cn(styles.card, className)}>
      <div className={styles.media}>
        <Image
          src={business.logoUrl}
          alt=""
          fill
          loading="lazy"
          className={styles.image}
          sizes="176px"
        />
        {business.verified ? <span className={styles.badge}>Verified</span> : null}
      </div>

      <div className={styles.body}>
        <p className={styles.title}>{business.name}</p>
        <p className={styles.subtitle}>{business.category}</p>
        <div className={styles.metaRow}>
          {business.verified ? (
            <span className={styles.verified}>
              <RovexoIcon icon={RovexoIcons.badges.verified} size={16} className={styles.metaIcon} />
              Verified
            </span>
          ) : (
            <span className={styles.verified}>Business</span>
          )}
          <span className={styles.count}>{business.listingCount}+ listings</span>
        </div>
      </div>
    </Link>
  );
}
