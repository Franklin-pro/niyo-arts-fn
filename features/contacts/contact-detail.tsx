"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Select,
  Skeleton,
  Space,
  Tooltip,
  Typography,
  App,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CopyOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  AdminFeedback,
  AdminPageHeader,
  useAdminResource,
} from "@/features/admin/admin-shared";
import { StatusChip } from "@/components/admin/status-chip";
import { toAdminRows, formatAdminDate } from "@/lib/admin-utils";
import { adminApi } from "@/services/api";

const { Title, Text, Paragraph } = Typography;

const STATUSES = ["new", "read", "replied"] as const;
type Status = (typeof STATUSES)[number];

function relativeTime(date?: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return d.toLocaleDateString();
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ContactDetail({ id }: { id: string }) {
  const { message: toast } = App.useApp();
  const [refresh, setRefresh] = useState(0);
  const [errorAction, setErrorAction] = useState("");
  const [busy, setBusy] = useState(false);

  const {
    data: contact,
    error,
    loading,
  } = useAdminResource(
    () =>
      adminApi.contacts
        .list()
        .then(
          ({ data }) =>
            toAdminRows(data).find((row) => row.id === id) ?? null,
        ),
    [id, refresh],
  );

  const update = async (status: string) => {
    if (!STATUSES.includes(status as Status)) return;
    setBusy(true);
    setErrorAction("");
    try {
      await adminApi.contacts.updateStatus(id, status as Status);
      toast.success(`Marked as ${status}.`);
      setRefresh((c) => c + 1);
    } catch (reason) {
      setErrorAction(
        reason instanceof Error
          ? reason.message
          : "Unable to update message status.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value?: string, label = "Value") => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const subject = String(contact?.subject || "Message details");
  const currentStatus = String(contact?.status || "new");
  const senderName = contact?.name ? String(contact.name) : "Unknown sender";
  const senderEmail = contact?.email ? String(contact.email) : undefined;
  const senderPhone = contact?.phone ? String(contact.phone) : undefined;
  const createdAt = contact?.createdAt;
  const body = String(contact?.message || "No message content.");

  return (
    <>
      <AdminPageHeader
        title={subject}
        description={
          createdAt
            ? `${formatAdminDate(createdAt)} · ${relativeTime(createdAt as string)}`
            : undefined
        }
        action={
          <Link className="adm-link" href="/admin/contacts">
            <ArrowLeftOutlined /> Back to messages
          </Link>
        }
      />

      <AdminFeedback error={error || errorAction} />

      {loading ? (
        <Card className="adm-antd-card">
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      ) : !contact && !error ? (
        <Card className="adm-antd-card">
          <Empty description="Message not found." />
        </Card>
      ) : contact ? (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Header card: sender + status + quick actions */}
          <Card className="adm-antd-card">
            <div className="adm-contact-header">
              <Space size="middle" align="center" wrap>
                <Avatar
                  size={56}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1677ff", fontWeight: 600 }}
                >
                  {initials(senderName)}
                </Avatar>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {senderName}
                  </Title>
                  <Space size="small" wrap>
                    {senderEmail ? (
                      <Text type="secondary">
                        <MailOutlined />{" "}
                        <a href={`mailto:${senderEmail}`}>{senderEmail}</a>
                      </Text>
                    ) : null}
                    {senderPhone ? (
                      <Text type="secondary">
                        <PhoneOutlined />{" "}
                        <a href={`tel:${senderPhone}`}>{senderPhone}</a>
                      </Text>
                    ) : null}
                  </Space>
                </div>
              </Space>

              <Space wrap>
                <StatusChip value={currentStatus} />
                <Select<Status>
                  aria-label="Message status"
                  value={currentStatus as Status}
                  disabled={busy}
                  loading={busy}
                  onChange={(s) => void update(s)}
                  options={STATUSES.map((s) => ({
                    value: s,
                    label: s.charAt(0).toUpperCase() + s.slice(1),
                  }))}
                  style={{ minWidth: 140 }}
                />
                {senderEmail ? (
                  <Button
                    type="primary"
                    icon={<MailOutlined />}
                    href={`mailto:${senderEmail}?subject=Re: ${encodeURIComponent(
                      subject,
                    )}`}
                    onClick={() => {
                      // Auto-mark as replied when the user initiates a reply.
                      if (currentStatus !== "replied") void update("replied");
                    }}
                  >
                    Reply by email
                  </Button>
                ) : null}
              </Space>
            </div>
          </Card>

          {/* Message card */}
          <Card className="adm-antd-card" title="Message">
            <Paragraph
              className="adm-message-body"
              style={{ whiteSpace: "pre-wrap", marginBottom: 0, fontSize: 15 }}
            >
              {body}
            </Paragraph>
          </Card>

   
        </Space>
      ) : null}
    </>
  );
}