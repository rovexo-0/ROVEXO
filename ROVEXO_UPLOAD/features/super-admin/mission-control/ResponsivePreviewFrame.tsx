"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type PreviewDevice = "iphone" | "android" | "tablet" | "desktop" | "macos" | "windows";

const DEVICES: { id: PreviewDevice; label: string; width: number; height: number }[] = [
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
  { id: "android", label: "Android", width: 412, height: 915 },
  { id: "tablet", label: "Tablet", width: 834, height: 1112 },
  { id: "desktop", label: "Desktop", width: 1280, height: 800 },
  { id: "macos", label: "macOS", width: 1440, height: 900 },
  { id: "windows", label: "Windows", width: 1366, height: 768 },
];

type ResponsivePreviewFrameProps = {
  src?: string;
  title?: string;
};

export function ResponsivePreviewFrame({ src = "/", title = "Live preview" }: ResponsivePreviewFrameProps) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const active = DEVICES.find((item) => item.id === device) ?? DEVICES[3];

  return (
    <div className="mc-preview">
      <div className="mc-preview__toolbar">
        <p className="mc-preview__title">{title}</p>
        <div className="mc-preview__devices">
          {DEVICES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("mc-preview__device", device === item.id && "mc-preview__device--active")}
              onClick={() => setDevice(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mc-preview__stage">
        <div
          className="mc-preview__frame"
          style={{ width: Math.min(active.width, 1200), height: Math.min(active.height, 720) }}
        >
          <iframe src={src} title={title} className="mc-preview__iframe" />
        </div>
      </div>
    </div>
  );
}
