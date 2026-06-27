"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function SuperAdminGrantsPanel() {
  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState("10");
  const [credits, setCredits] = useState("1");
  const [message, setMessage] = useState<string | null>(null);

  async function grant(body: Record<string, unknown>) {
    setMessage(null);
    const response = await fetch("/api/super-admin/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Benefit granted." : payload.error ?? "Grant failed.");
  }

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white">
        <div className="grid gap-ds-3 md:grid-cols-2">
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="User ID"
            className="rx-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <input
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            placeholder="Product ID (featured/bump)"
            className="rx-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
        </div>
      </Card>

      <div className="grid gap-ds-3 md:grid-cols-2 xl:grid-cols-3">
        <Card padding="md" className="bg-white">
          <p className="font-semibold">Featured listing</p>
          <Button
            className="mt-ds-3"
            fullWidth
            onClick={() => void grant({ type: "feature", userId, productId })}
          >
            Grant Featured
          </Button>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="font-semibold">Bump</p>
          <Button
            className="mt-ds-3"
            fullWidth
            onClick={() => void grant({ type: "bump", userId, productId })}
          >
            Grant Bump
          </Button>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="font-semibold">Premium</p>
          <Button className="mt-ds-3" fullWidth onClick={() => void grant({ type: "premium", userId })}>
            Grant Premium
          </Button>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="font-semibold">Wallet balance</p>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="number"
            className="rx-input mt-ds-3 min-h-ds-7 w-full rounded-ds-md px-ds-3 text-sm"
          />
          <Button
            className="mt-ds-3"
            fullWidth
            onClick={() =>
              void grant({
                type: "wallet",
                userId,
                amount: Number(amount),
                description: "Super Admin wallet grant",
              })
            }
          >
            Add balance
          </Button>
        </Card>
        <Card padding="md" className="bg-white">
          <p className="font-semibold">Promotion credits</p>
          <input
            value={credits}
            onChange={(event) => setCredits(event.target.value)}
            type="number"
            className="rx-input mt-ds-3 min-h-ds-7 w-full rounded-ds-md px-ds-3 text-sm"
          />
          <Button
            className="mt-ds-3"
            fullWidth
            onClick={() => void grant({ type: "credits", userId, credits: Number(credits) })}
          >
            Add credits
          </Button>
        </Card>
      </div>

      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}
    </div>
  );
}
