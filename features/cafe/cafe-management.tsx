"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Image,
  Popconfirm,
  Space,
  Typography,
  Upload,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import { DeleteOutlined, InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { AdminFeedback, AdminPageHeader } from "@/features/admin/admin-shared";
import { adminApi, getCafeMenuPdfUrl } from "@/services/api";
import type { CafeGalleryImage, CafeMenu } from "@/services/api";

const MAX_MENU_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function getImageUrl(image: CafeGalleryImage) {
  return image.imageUrl || image.url || "";
}

export function CafeManagement() {
  const [menuUrl, setMenuUrl] = useState("");
  const [gallery, setGallery] = useState<CafeGalleryImage[]>([]);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [menuUploadList, setMenuUploadList] = useState<UploadFile[]>([]);
  const [galleryUploadList, setGalleryUploadList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuBusy, setMenuBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [busyImageId, setBusyImageId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadCafeData() {
    setLoading(true);
    setError("");
    try {
      const [menuResult, galleryResult] = await Promise.all([
        adminApi.cafe.menu.get(),
        adminApi.cafe.gallery.list(),
      ]);
      setMenuUrl(getCafeMenuPdfUrl(menuResult.data));
      setGallery(galleryResult.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load cafe content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCafeData();
  }, []);

  const chooseMenu: UploadProps["beforeUpload"] = (file) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file for the cafe menu.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_MENU_SIZE) {
      setError("The menu PDF must be 20 MB or smaller.");
      return Upload.LIST_IGNORE;
    }
    setError("");
    setMenuFile(file);
    return false;
  };

  const chooseGalleryImage: UploadProps["beforeUpload"] = (file) => {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the cafe gallery.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Gallery images must be 10 MB or smaller.");
      return Upload.LIST_IGNORE;
    }
    setError("");
    setGalleryFile(file);
    return false;
  };

  async function uploadMenu() {
    if (!menuFile) return;
    setMenuBusy(true);
    setError("");
    setNotice("");
    try {
      const result = menuUrl
        ? await adminApi.cafe.menu.replace(menuFile)
        : await adminApi.cafe.menu.upload(menuFile);
      setMenuUrl(getCafeMenuPdfUrl(result.data));
      setMenuFile(null);
      setMenuUploadList([]);
      setNotice("Cafe menu saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the cafe menu.");
    } finally {
      setMenuBusy(false);
    }
  }

  async function uploadGalleryImage() {
    if (!galleryFile) return;
    setGalleryBusy(true);
    setError("");
    setNotice("");
    try {
      await adminApi.cafe.gallery.upload(galleryFile);
      setGalleryFile(null);
      setGalleryUploadList([]);
      setNotice("Cafe gallery image uploaded.");
      await loadCafeData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload gallery image.");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function removeGalleryImage(id: string) {
    setBusyImageId(id);
    setError("");
    setNotice("");
    try {
      await adminApi.cafe.gallery.remove(id);
      setGallery((current) => current.filter((image) => image.id !== id));
      setNotice("Gallery image removed.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to remove gallery image.");
    } finally {
      setBusyImageId("");
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Cafe"
        description="Manage the cafe menu PDF and gallery images."
        action={<Button icon={<UploadOutlined />} onClick={() => void loadCafeData()} loading={loading}>Refresh</Button>}
      />
      <AdminFeedback error={error} notice={notice} />

      <Card className="adm-antd-card" title="Cafe menu PDF" variant="borderless">
        {menuUrl ? (
          <Typography.Paragraph>
            Current menu: <a href={menuUrl} target="_blank" rel="noopener noreferrer">Open menu PDF</a>
          </Typography.Paragraph>
        ) : (
          <Typography.Paragraph type="secondary">No menu PDF has been uploaded.</Typography.Paragraph>
        )}
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Upload
            accept="application/pdf,.pdf"
            maxCount={1}
            fileList={menuUploadList}
            beforeUpload={chooseMenu}
            onChange={({ fileList }) => setMenuUploadList(fileList)}
            onRemove={() => {
              setMenuFile(null);
              return true;
            }}
          >
            <Button icon={<InboxOutlined />}>Choose menu PDF</Button>
          </Upload>
          <Button type="primary" onClick={() => void uploadMenu()} disabled={!menuFile} loading={menuBusy}>
            {menuUrl ? "Replace menu" : "Upload menu"}
          </Button>
        </Space>
      </Card>

      <Card className="adm-antd-card" title="Cafe gallery" variant="borderless" style={{ marginTop: 24 }}>
        <Space orientation="vertical" style={{ width: "100%", marginBottom: 24 }}>
          <Upload
            accept="image/*"
            maxCount={1}
            fileList={galleryUploadList}
            beforeUpload={chooseGalleryImage}
            onChange={({ fileList }) => setGalleryUploadList(fileList)}
            onRemove={() => {
              setGalleryFile(null);
              return true;
            }}
          >
            <Button icon={<InboxOutlined />}>Choose gallery image</Button>
          </Upload>
          <Button type="primary" onClick={() => void uploadGalleryImage()} disabled={!galleryFile} loading={galleryBusy}>
            Upload image
          </Button>
        </Space>

        {loading ? (
          <Typography.Text type="secondary">Loading gallery…</Typography.Text>
        ) : gallery.length ? (
          <div className="adm-cafe-gallery">
            {gallery.map((image, index) => (
              <Card
                key={image.id}
                size="small"
                cover={<Image src={getImageUrl(image)} alt={image.alt || `Cafe gallery image ${index + 1}`} />}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Remove this gallery image?"
                    onConfirm={() => void removeGalleryImage(image.id)}
                    okText="Remove"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} loading={busyImageId === image.id}>
                      Remove
                    </Button>
                  </Popconfirm>,
                ]}
              />
            ))}
          </div>
        ) : (
          <Typography.Text type="secondary">No cafe gallery images have been uploaded.</Typography.Text>
        )}
      </Card>
    </>
  );
}
