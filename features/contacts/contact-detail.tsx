"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { toAdminRows, formatAdminDate } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

const STATUSES = ["new", "read", "replied"] as const;

export function ContactDetail({ id }: { id: string }) {
  const [refresh, setRefresh] = useState(0);
  const [errorAction, setErrorAction] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: contact, error, loading } = useAdminResource(
    () => adminApi.contacts.list().then(({ data }) => toAdminRows(data).find((row) => row.id === id) ?? null),
    [id, refresh],
  );
  const update = async (status: string) => {
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) return;
    setBusy(true); setErrorAction("");
    try {
      await adminApi.contacts.updateStatus(id, status as (typeof STATUSES)[number]);
      setRefresh((current) => current + 1);
    } catch (reason) { setErrorAction(reason instanceof Error ? reason.message : "Unable to update message status."); }
    finally { setBusy(false); }
  };
  return <>
    <AdminPageHeader title={String(contact?.subject || "Message details")} description={contact?.createdAt ? formatAdminDate(contact.createdAt) : undefined}
      action={<Link className="adm-link" href="/admin/contacts">Back to messages</Link>} />
    <AdminFeedback error={error || errorAction} />
    {loading ? <div className="adm-skel adm-skel-row" aria-busy="true" /> : contact ? (
      <article className="adm-panel adm-contact-detail">
        <div className="adm-row-controls"><StatusChip value={String(contact.status || "new")} />
          <label>Status <select value={String(contact.status || "new")} disabled={busy} onChange={(event) => void update(event.target.value)}>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select></label>
        </div>
        <dl className="adm-order-summary">
          <div><dt>Name</dt><dd>{String(contact.name || "—")}</dd></div>
          <div><dt>Email</dt><dd>{contact.email ? <a href={`mailto:${String(contact.email)}`}>{String(contact.email)}</a> : "—"}</dd></div>
          {contact.phone && <div><dt>Phone</dt><dd>{String(contact.phone)}</dd></div>}
          <div><dt>Message</dt><dd className="adm-message-body">{String(contact.message || "No message content.")}</dd></div>
        </dl>
      </article>
    ) : !error ? <p role="status">Message not found.</p> : null}
  </>;
}
