import { getStatusTone } from "@/lib/admin-utils";

export function StatusChip({ value }: { value: string }) {
  if (!value) return null;
  return <span className="adm-chip" data-tone={getStatusTone(value)}>{value.replaceAll("_", " ")}</span>;
}
