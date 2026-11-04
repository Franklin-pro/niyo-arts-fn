"use client";

import { useEffect, useState } from "react";
import { Alert, Upload } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
type UploadOptions = Parameters<NonNullable<UploadProps["customRequest"]>>[0];

type CloudinaryImageUploadProps = {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

function getCloudinaryError(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return "";
  const error = payload.error;
  return error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "";
}

function getSecureUrl(payload: unknown) {
  return payload && typeof payload === "object" && "secure_url" in payload && typeof payload.secure_url === "string"
    ? payload.secure_url
    : "";
}

export function CloudinaryImageUpload({
  value,
  onChange,
  disabled = false,
  onUploadingChange,
}: CloudinaryImageUploadProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setFileList(value ? [{
      uid: "current-image",
      name: "Current image",
      status: "done",
      url: value,
      thumbUrl: value,
    }] : []);
  }, [value]);

  const beforeUpload: NonNullable<UploadProps["beforeUpload"]> = (file) => {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Images must be 10 MB or smaller.");
      return Upload.LIST_IGNORE;
    }
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
      setError("Image upload is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      return Upload.LIST_IGNORE;
    }
    setError("");
    return true;
  };

  const uploadImage: NonNullable<UploadProps["customRequest"]> = (options) => {
    const upload = async (uploadOptions: UploadOptions) => {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) {
        throw new Error("Image upload is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      }

      const file = uploadOptions.file;
      if (!(file instanceof File)) throw new Error("Please choose a valid image file.");

      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
        method: "POST",
        body,
      });
      const payload: unknown = await response.json();
      const secureUrl = getSecureUrl(payload);
      if (!response.ok || !secureUrl) {
        throw new Error(getCloudinaryError(payload) || "Cloudinary did not return a usable image URL.");
      }

      onChange?.(secureUrl);
      setError("");
      uploadOptions.onSuccess?.(payload);
    };

    onUploadingChange?.(true);
    void upload(options)
      .catch((reason: unknown) => {
        const uploadError = reason instanceof Error ? reason : new Error("Unable to upload image.");
        setError(uploadError.message);
        options.onError?.(uploadError);
      })
      .finally(() => onUploadingChange?.(false));
  };

  return (
    <>
      <Upload.Dragger
        accept="image/*"
        multiple={false}
        maxCount={1}
        listType="picture"
        fileList={fileList}
        disabled={disabled}
        beforeUpload={beforeUpload}
        customRequest={uploadImage}
        onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        onRemove={() => {
          onChange?.("");
          setError("");
          return true;
        }}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Click or drag an image here to upload</p>
        <p className="ant-upload-hint">PNG, JPG, WEBP, or another image format. Maximum size: 10 MB.</p>
      </Upload.Dragger>
      {error && <Alert className="adm-upload-error" type="error" showIcon title={error} />}
      {value && !error && <Alert className="adm-upload-success" type="success" showIcon title="Image uploaded and ready to save." />}
    </>
  );
}
