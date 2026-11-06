"use client";

import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminPageHeader, useAdminResource } from "@/features/admin/admin-shared";
import { CloudinaryImageUpload } from "@/components/admin/cloudinary-image-upload";
import { adminApi } from "@/services/api";
import type { AdminEventInput, ApiEvent } from "@/services/api";

type EventFormValues = AdminEventInput;

function toEventInput(values: EventFormValues): AdminEventInput {
  return {
    title: values.title.trim(),
    date: values.date.trim(),
    location: values.location.trim(),
    description: values.description.trim(),
    imageUrl: values.imageUrl?.trim() || "",
  };
}

export function EventManagement() {
  const [refresh, setRefresh] = useState(0);
  const [form] = Form.useForm<EventFormValues>();
  const [editing, setEditing] = useState<ApiEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyEventId, setBusyEventId] = useState("");
  const { data, error: loadError, loading } = useAdminResource(
    () => adminApi.events.list().then(({ data: events }) => events),
    [refresh],
  );

  function openCreate() {
    setEditing(null);
    setError("");
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(event: ApiEvent) {
    setEditing(event);
    setError("");
    form.setFieldsValue({
      title: event.title,
      date: event.date || "",
      location: event.location || "",
      description: event.description || "",
      imageUrl: event.imageUrl || "",
    });
    setModalOpen(true);
  }

  async function saveEvent(values: EventFormValues) {
    setBusy(true);
    setError("");
    try {
      const input = toEventInput(values);
      if (editing) await adminApi.events.update(editing.id, input);
      else await adminApi.events.create(input);
      setModalOpen(false);
      setRefresh((current) => current + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save event.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEvent(id: string) {
    setBusyEventId(id);
    setError("");
    try {
      await adminApi.events.remove(id);
      setRefresh((current) => current + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete event.");
    } finally {
      setBusyEventId("");
    }
  }

  const columns: TableColumnsType<ApiEvent> = [
    {
      title: "Event",
      key: "event",
      render: (_, event) => (
        <Space size={12}>
          {event.imageUrl && <img className="adm-table-image" src={event.imageUrl} alt="" />}
          <div className="adm-table-record">
            <Typography.Text strong>{event.title}</Typography.Text>
            <Typography.Text type="secondary">{event.location || "No location"}</Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      responsive: ["sm"],
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, event) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(event)} aria-label={`Edit ${event.title}`} />
          <Popconfirm
            title="Delete this event?"
            description={event.title}
            onConfirm={() => void removeEvent(event.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} loading={busyEventId === event.id} aria-label={`Delete ${event.title}`} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Foundation events"
        description={loading ? "Loading events…" : `${data?.length ?? 0} events`}
        action={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New event</Button>}
      />
      <AdminFeedback error={loadError || error} />
      <Table<ApiEvent>
        aria-label="Foundation events"
        rowKey="id"
        columns={columns}
        dataSource={data ?? []}
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `${total} events` }}
        scroll={{ x: 620 }}
      />

      <Modal
        title={editing ? "Edit event" : "New event"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<EventFormValues>
          form={form}
          layout="vertical"
          onFinish={saveEvent}
          initialValues={{ title: "", date: "", location: "", description: "", imageUrl: "" }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, whitespace: true }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Enter the event date." }]}>
            <Input placeholder="For example: 2026-11-06 18:00" />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true, whitespace: true }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Event image">
            <CloudinaryImageUpload disabled={busy} onUploadingChange={setUploading} />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea rows={4} maxLength={5000} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={busy} disabled={uploading}>Save event</Button>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
