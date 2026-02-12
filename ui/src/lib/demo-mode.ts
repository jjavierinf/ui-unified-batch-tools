import { SqlFile } from "./types";

export const DEMO_MODE_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1";

const REPLACEMENTS: Array<[string, string]> = [
  ["sqlserver_gamingintegration_tr_dailytransactionamount", "conn_feed_trx_daily"],
  ["gamingintegration_tr_dailytransactionamount", "feed_trx_daily"],
  ["GamingIntegration_tr_GameTransaction", "SourceBridge_tr_TransactionLog"],
  ["GamingIntegration_gc_Game", "SourceBridge_gc_GameCatalog"],
  ["Accounts_dbo_AccountReference", "Core_dbo_EntityReference"],
  ["Accounts_dbo_AccountLogType", "Core_dbo_EventClass"],
  ["CRM_integration", "alpha_integration"],
  ["BEATS_integration", "beta_integration"],
  ["gaming_integration", "source_bridge"],
  ["data_sources", "source_hub"],
  ["AccountReference", "EntityReference"],
  ["GameTransaction", "TransactionLog"],
  ["AccountLogType", "EventClass"],
  ["DailyTransactionAmount", "DailyAmount"],
  ["sqlserver_Gaming", "sqlserver_SourceBridge"],
  ["sqlserver_Accounts", "sqlserver_Core"],
  ["db_data_model", "db_serving"],
  ["db_stage", "db_landing"],
  ["data-engineering", "team_alpha"],
  ["analytics", "team_analytics"],
  ["platform", "team_platform"],
  ["#incidents-data", "#incidents-alpha"],
  ["#alerts-data", "#alerts-alpha"],
  ["#incidents-crm", "#incidents-source"],
  ["#alerts-crm", "#alerts-source"],
  ["#incidents-beats", "#incidents-beta"],
  ["#alerts-beats", "#alerts-beta"],
  ["#incidents-datasources", "#incidents-hub"],
  ["#alerts-datasources", "#alerts-hub"],
  ["javier", "owner_alpha"],
  ["maria", "owner_beta"],
  ["carlos", "owner_gamma"],
  ["lucia", "owner_delta"],
];

const SORTED_REPLACEMENTS = [...REPLACEMENTS].sort((a, b) => b[0].length - a[0].length);

export function anonymizeText(text: string): string {
  let next = text;
  for (const [from, to] of SORTED_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

export function deepAnonymize<T>(value: T): T {
  if (!DEMO_MODE_ENABLED) return value;
  if (typeof value === "string") return anonymizeText(value) as T;
  if (Array.isArray(value)) return value.map((item) => deepAnonymize(item)) as T;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepAnonymize(v)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

export function anonymizeFiles(files: Record<string, SqlFile>): Record<string, SqlFile> {
  if (!DEMO_MODE_ENABLED) return files;
  return Object.fromEntries(
    Object.entries(files).map(([path, file]) => [
      anonymizeText(path),
      {
        ...file,
        content: anonymizeText(file.content),
        savedContent: anonymizeText(file.savedContent),
      },
    ])
  );
}
