export type AdminRecord = Record<string, unknown> & {
  id?: string;
  slug?: string;
  reference?: string;
  status?: string;
};

export function toAdminRows(records: object[]): AdminRecord[] {
  return records.map((record) => {
    const row: AdminRecord = {};
    Object.entries(record).forEach(([key, value]) => { row[key] = value; });
    return row;
  });
}

export function slugFromTitle(title: string) {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getStatusTone(value: string) {
  const status = value.toLowerCase();
  if (["delivered", "replied", "paid", "active", "successful", "success"].includes(status)) return "good";
  if (["shipped", "read", "processing"].includes(status)) return "info";
  if (["cancelled", "failed", "refunded"].includes(status)) return "bad";
  if (["new", "pending", "unpaid", "pending_payment"].includes(status)) return "warn";
  return "neutral";
}

export function formatAdminPrice(value: unknown, currency: unknown = "USD") {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "";
  const code = String(currency || "USD");
  const amount = Number(value).toLocaleString();
  return code === "USD" ? `$${amount}` : `${code} ${amount}`;
}

export function formatAdminDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return String(value ?? "");
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function displayAdminValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
