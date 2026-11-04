"use client";

import { useState } from "react";
import { Button, Popconfirm, Select } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminList, useAdminResource } from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { toAdminRows } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";
import type { AdminRecord } from "@/lib/admin-utils";

const STATUSES = ["new", "read", "replied"] as const;

export function ContactList() {
  const [refresh, setRefresh] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const { data, error, loading } = useAdminResource(
    () => adminApi.contacts.list().then(({ data }) => toAdminRows(data)),
    [refresh],
  );
  const updateStatus = async (row: AdminRecord, status: string) => {
    const id = String(row.id || "");
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;
    setBusyId(id); setActionError("");
    try {
      await adminApi.contacts.updateStatus(id, status as (typeof STATUSES)[number]);
      setRefresh((current) => current + 1);
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to update message status."); }
    finally { setBusyId(""); }
  };
  const remove = async (row: AdminRecord) => {
    const id = String(row.id || "");
    if (!id || !window.confirm(`Delete the message from ${String(row.name || row.email || "this customer")}?`)) return;
    setBusyId(id); setActionError("");
    try {
      await adminApi.contacts.remove(id);
      setRefresh((current) => current + 1);
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to delete message."); }
    finally { setBusyId(""); }
  };
  return <>
    <AdminFeedback error={actionError} />
    <AdminList
      title="Messages" singular="message" rows={data} error={error} loading={loading}
      detailHref={(row) => `/admin/contacts/${encodeURIComponent(String(row.id || ""))}`}
      summary={(row) => String(row.name || row.email || "Contact message")}
      subtitle={(row) => [row.email, row.subject, String(row.message || "").slice(0, 80)].filter(Boolean).join(" · ")}
      controls={(row) => <>
        <Popconfirm title="Delete this message?" description="This action cannot be undone." onConfirm={() => void remove(row)} okText="Delete" okButtonProps={{ danger: true }}>
          <Button danger type="text" icon={<DeleteOutlined />} disabled={busyId === String(row.id || "")} aria-label="Delete message" />
        </Popconfirm>
      </>}
    />
  </>;
}
