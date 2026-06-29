"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type SimulatorDevice =
  | "windows"
  | "macos"
  | "iphone"
  | "android"
  | "tablet"
  | "desktop"
  | "laptop"
  | "ultrawide";

type SimulatorOrientation = "landscape" | "portrait";
type SimulatorTheme = "light" | "dark";

const DEVICES: { id: SimulatorDevice; label: string; width: number; height: number }[] = [
  { id: "iphone", label: "iPhone", width: 390, height: 844 },
  { id: "android", label: "Android", width: 412, height: 915 },
  { id: "tablet", label: "Tablet", width: 834, height: 1112 },
  { id: "laptop", label: "Laptop", width: 1280, height: 800 },
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  { id: "macos", label: "macOS", width: 1440, height: 900 },
  { id: "windows", label: "Windows", width: 1366, height: 768 },
  { id: "ultrawide", label: "UltraWide", width: 2560, height: 1080 },
];

type AppStudioSimulatorProps = {
  src?: string;
  title?: string;
};

export function AppStudioSimulator({ src = "/", title = "Live simulator" }: AppStudioSimulatorProps) {
  const [device, setDevice] = useState<SimulatorDevice>("desktop");
  const [orientation, setOrientation] = useState<SimulatorOrientation>("portrait");
  const [theme, setTheme] = useState<SimulatorTheme>("light");

  const active = DEVICES.find((item) => item.id === device) ?? DEVICES[4];
  const width = orientation === "landscape" ? active.height : active.width;
  const height = orientation === "landscape" ? active.width : active.height;

  return (
    <div className="as-simulator">
      <div className="as-simulator__toolbar">
        <p className="as-simulator__title">{title}</p>
        <div className="as-simulator__controls">
          <div className="as-simulator__group">
            {DEVICES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn("as-simulator__chip", device === item.id && "as-simulator__chip--active")}
                onClick={() => setDevice(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="as-simulator__group">
            <button
              type="button"
              className={cn("as-simulator__chip", orientation === "portrait" && "as-simulator__chip--active")}
              onClick={() => setOrientation("portrait")}
            >
              Portrait
            </button>
            <button
              type="button"
              className={cn("as-simulator__chip", orientation === "landscape" && "as-simulator__chip--active")}
              onClick={() => setOrientation("landscape")}
            >
              Landscape
            </button>
          </div>
          <div className="as-simulator__group">
            <button
              type="button"
              className={cn("as-simulator__chip", theme === "light" && "as-simulator__chip--active")}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={cn("as-simulator__chip", theme === "dark" && "as-simulator__chip--active")}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
        </div>
      </div>
      <div className={cn("as-simulator__stage", theme === "dark" && "as-simulator__stage--dark")}>
        <div className="as-simulator__frame" style={{ width: Math.min(width, 1200), height: Math.min(height, 720) }}>
          <iframe src={src} title={title} className="as-simulator__iframe" />
        </div>
      </div>
    </div>
  );
}
