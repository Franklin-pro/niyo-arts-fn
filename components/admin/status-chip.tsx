import { Tag } from "antd";
import { getStatusTone } from "@/lib/admin-utils";

export function StatusChip({ value }: { value: string }) {
  if (!value) return null;
  const color = { good: "success", info: "processing", warn: "warning", bad: "error", neutral: "default" }[getStatusTone(value)];
  return <Tag color={color}>{value.replaceAll("_", " ")}</Tag>;
}
