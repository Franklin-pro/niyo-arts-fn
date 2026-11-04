"use client";

import { Button, Drawer } from "antd";
import { CloseOutlined } from "@ant-design/icons";

export function EditorDrawer({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer
      title={<div><strong>{title}</strong>{description && <div className="adm-drawer-description">{description}</div>}</div>}
      open
      onClose={onClose}
      placement="right"
      width={560}
      destroyOnHidden
      extra={<Button type="text" aria-label="Close editor" icon={<CloseOutlined />} onClick={onClose} />}
      styles={{ body: { padding: 0 } }}
    >
      <div className="adm-editor">{children}</div>
    </Drawer>
  );
}
