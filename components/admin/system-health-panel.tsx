"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminButtonPrimary,
  adminButtonSecondary,
} from "@/components/ui/form-styles";

type CheckResult = {
  id: string;
  label: string;
  group: "frontend" | "backend" | "config";
  ok: boolean;
  detail: string;
};

type HealthPayload = {
  ok: boolean;
  checkedAt: string;
  checks: CheckResult[];
};

export function SystemHealthPanel() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const started = performance.now();
      const res = await fetch("/api/admin/health", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload) {
        throw new Error(payload?.error || "Health check failed.");
      }

      const latency = Math.round(performance.now() - started);
      const frontChecks: CheckResult[] = [
        {
          id: "front-admin",
          label: "Admin UI reachable",
          group: "frontend",
          ok: true,
          detail: `Loaded health payload in ${latency}ms`,
        },
        {
          id: "front-json",
          label: "API JSON responses",
          group: "frontend",
          ok: Array.isArray(payload.checks),
          detail: Array.isArray(payload.checks)
            ? `${payload.checks.length} backend checks returned`
            : "Malformed health payload",
        },
      ];

      setData({
        ok: Boolean(payload.ok) && frontChecks.every((item) => item.ok),
        checkedAt: payload.checkedAt || new Date().toISOString(),
        checks: [...frontChecks, ...(payload.checks || [])],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health check failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  async function seedCatalogue() {
    setSeeding(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed-catalogue" }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Seed failed.");
      }
      const created = Number(payload.created ?? 0);
      setNotice(
        created > 0
          ? `Seeded ${created} catalogue row${created === 1 ? "" : "s"}.`
          : "Catalogue already present — nothing new to seed.",
      );
      await run();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed.");
    } finally {
      setSeeding(false);
    }
  }

  const groups: Array<CheckResult["group"]> = ["frontend", "backend", "config"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className={adminButtonPrimary}
        >
          {loading ? "Testing…" : "Run front + back tests"}
        </button>
        <button
          type="button"
          onClick={() => void seedCatalogue()}
          disabled={seeding}
          className={adminButtonSecondary}
        >
          {seeding ? "Seeding…" : "Seed starter catalogue"}
        </button>
        {data ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              data.ok
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {data.ok ? "All clear" : "Needs attention"}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      {groups.map((group) => {
        const items = data?.checks.filter((item) => item.group === group) || [];
        return (
          <section key={group}>
            <h3 className="text-[10px] font-medium tracking-[0.22em] text-deep/45 uppercase">
              {group}
            </h3>
            <ul className="mt-3 divide-y divide-deep/8 rounded-2xl border border-deep/10 bg-white">
              {(items.length
                ? items
                : loading
                  ? [
                      {
                        id: `${group}-loading`,
                        label: "Checking…",
                        group,
                        ok: true,
                        detail: "",
                      },
                    ]
                  : [
                      {
                        id: `${group}-empty`,
                        label: "No checks yet",
                        group,
                        ok: false,
                        detail: "Run tests",
                      },
                    ]
              ).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-deep">{item.label}</p>
                    {item.detail ? (
                      <p className="mt-1 text-xs text-deep/55">{item.detail}</p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium ${
                      item.ok ? "text-emerald-700" : "text-amber-800"
                    }`}
                  >
                    {item.ok ? "Pass" : "Fail"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
