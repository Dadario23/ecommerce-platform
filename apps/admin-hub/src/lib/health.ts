// Integraciones de solo lectura para el panel de salud. Ninguna función lanza:
// sin env var configurada degradan a "unconfigured" y ante error/timeout a
// "unknown" — el dashboard nunca se rompe por un tercero caído.

export type UptimeState = "up" | "down" | "paused" | "no-monitor" | "unconfigured" | "unknown";

export type TenantUptime = { state: UptimeState; monitorUrl: string | null };

export type BackupStatus = {
  state: "success" | "failure" | "in_progress" | "unknown";
  runAt: string | null;
  htmlUrl: string | null;
};

type UptimeMonitor = { friendlyName?: string; status?: string; url?: string };

const FETCH_TIMEOUT_MS = 5000;

export async function getUptimeByTenant(slugs: string[]): Promise<Record<string, TenantUptime>> {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) {
    return Object.fromEntries(slugs.map((s) => [s, { state: "unconfigured" as const, monitorUrl: null }]));
  }

  let monitors: UptimeMonitor[];
  try {
    const res = await fetch("https://api.uptimerobot.com/v3/monitors", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`UptimeRobot respondió ${res.status}`);
    const body = (await res.json()) as { data?: UptimeMonitor[] };
    monitors = body.data ?? [];
  } catch (err) {
    console.error("[admin-hub] Error consultando UptimeRobot:", err);
    return Object.fromEntries(slugs.map((s) => [s, { state: "unknown" as const, monitorUrl: null }]));
  }

  const stateFor = (status: string | undefined): UptimeState => {
    if (status === "UP") return "up";
    if (status === "DOWN") return "down";
    if (status === "PAUSED") return "paused";
    return "unknown";
  };

  return Object.fromEntries(
    slugs.map((slug) => {
      // Convención de RUNBOOK.md: los monitores se llaman "<slug> webhook".
      const monitor =
        monitors.find((m) => (m.friendlyName ?? "").toLowerCase().startsWith(slug.toLowerCase())) ??
        monitors.find((m) => (m.url ?? "").includes(slug));
      if (!monitor) return [slug, { state: "no-monitor" as const, monitorUrl: null }];
      return [slug, { state: stateFor(monitor.status), monitorUrl: monitor.url ?? null }];
    })
  );
}

// GITHUB_TOKEN es opcional: el repo es público y la API anónima alcanza
// (60 req/hora por IP). Configurarlo solo si el repo pasa a privado.
export async function getLastBackupRun(): Promise<BackupStatus> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "Dadario23/ecommerce-platform";
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/backup.yml/runs?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
    );
    if (!res.ok) throw new Error(`GitHub respondió ${res.status}`);
    const body = (await res.json()) as {
      workflow_runs?: { status?: string; conclusion?: string | null; created_at?: string; html_url?: string }[];
    };
    const run = body.workflow_runs?.[0];
    if (!run) return { state: "unknown", runAt: null, htmlUrl: null };
    return {
      state: run.status !== "completed" ? "in_progress" : run.conclusion === "success" ? "success" : "failure",
      runAt: run.created_at ?? null,
      htmlUrl: run.html_url ?? null,
    };
  } catch (err) {
    console.error("[admin-hub] Error consultando GitHub Actions:", err);
    return { state: "unknown", runAt: null, htmlUrl: null };
  }
}
