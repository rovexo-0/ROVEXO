"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 2000;
const PARTICLE_COUNT = 24;

type ParticleKind = "coin" | "note" | "sparkle";

type Particle = {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  wobble: number;
};

type CelebrationAnimationProps = {
  active?: boolean;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickKind(): ParticleKind {
  const roll = Math.random();
  if (roll < 0.45) return "coin";
  if (roll < 0.75) return "note";
  return "sparkle";
}

function createParticles(width: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const kind = pickKind();
    const size =
      kind === "coin"
        ? randomBetween(14, 22)
        : kind === "note"
          ? randomBetween(18, 28)
          : randomBetween(4, 9);

    return {
      kind,
      x: randomBetween(0, width),
      y: randomBetween(-80, -12),
      vx: randomBetween(-0.6, 0.6),
      vy: randomBetween(2.8, 5.8),
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.08, 0.08),
      size,
      opacity: randomBetween(0.75, 1),
      wobble: randomBetween(0.4, 1.2),
    };
  });
}

function drawCoin(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  alpha: number,
  time: number,
) {
  const { x, y, size, rotation } = particle;
  const radius = size / 2;

  ctx.save();
  ctx.translate(x, y + Math.sin(time * 0.004 + particle.wobble) * 2);
  ctx.rotate(rotation);

  ctx.shadowColor = "rgba(245, 197, 66, 0.65)";
  ctx.shadowBlur = size * 0.45;

  const gradient = ctx.createRadialGradient(-radius * 0.25, -radius * 0.25, 0, 0, 0, radius);
  gradient.addColorStop(0, `rgba(255, 232, 140, ${alpha})`);
  gradient.addColorStop(0.55, `rgba(212, 175, 55, ${alpha})`);
  gradient.addColorStop(1, `rgba(166, 124, 0, ${alpha})`);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.lineWidth = 1.25;
  ctx.strokeStyle = `rgba(255, 214, 102, ${alpha * 0.9})`;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(120, 78, 0, ${alpha * 0.95})`;
  ctx.font = `bold ${Math.max(10, size * 0.55)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("£", 0, 1);

  ctx.restore();
}

function drawNote(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  alpha: number,
  time: number,
) {
  const { x, y, size, rotation } = particle;
  const width = size * 1.35;
  const height = size * 0.72;

  ctx.save();
  ctx.translate(x, y + Math.sin(time * 0.003 + particle.wobble) * 1.5);
  ctx.rotate(rotation);

  ctx.shadowColor = "rgba(133, 187, 101, 0.5)";
  ctx.shadowBlur = size * 0.35;

  ctx.fillStyle = `rgba(133, 187, 101, ${alpha})`;
  ctx.strokeStyle = `rgba(90, 140, 72, ${alpha * 0.9})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(-width / 2, -height / 2, width, height, 2);
  } else {
    ctx.rect(-width / 2, -height / 2, width, height);
  }
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
  ctx.fillRect(-width / 2 + 3, -height / 2 + 3, width - 6, height * 0.22);

  ctx.fillStyle = `rgba(40, 70, 32, ${alpha * 0.85})`;
  ctx.font = `600 ${Math.max(8, size * 0.32)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("£", 0, 1);

  ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, particle: Particle, alpha: number) {
  const { x, y, size } = particle;

  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.8})`;
  ctx.shadowBlur = size * 1.8;

  ctx.strokeStyle = `rgba(255, 248, 220, ${alpha})`;
  ctx.lineWidth = Math.max(1, size * 0.18);
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
  ctx.fill();

  ctx.restore();
}

export function CelebrationAnimation({ active = true }: CelebrationAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!active || finished) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    const particles = createParticles(width);
    let animationFrame = 0;
    let lastFrame = performance.now();
    const startedAt = lastFrame;
    let cancelled = false;

    const resize = () => {
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = (now: number) => {
      if (cancelled) return;

      const elapsed = now - startedAt;
      if (elapsed >= DURATION_MS) {
        setFinished(true);
        return;
      }

      const delta = Math.min((now - lastFrame) / 16.67, 2.5);
      lastFrame = now;

      const fadeStart = DURATION_MS * 0.62;
      const globalFade =
        elapsed > fadeStart ? 1 - (elapsed - fadeStart) / (DURATION_MS - fadeStart) : 1;

      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.rotationSpeed * delta;

        if (particle.y > height + particle.size) continue;

        const alpha = particle.opacity * globalFade;
        if (alpha <= 0.02) continue;

        if (particle.kind === "coin") {
          drawCoin(context, particle, alpha, now);
        } else if (particle.kind === "note") {
          drawNote(context, particle, alpha, now);
        } else {
          drawSparkle(context, particle, alpha);
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      context.clearRect(0, 0, width, height);
    };
  }, [active, finished]);

  if (!active || finished) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[120] touch-none motion-reduce:hidden"
      style={{ willChange: "opacity, transform" }}
      aria-hidden
    />
  );
}
