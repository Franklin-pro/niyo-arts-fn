"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

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
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="adm-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="adm-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close editor"><X /></button>
        </header>
        <div className="adm-editor">{children}</div>
      </aside>
    </div>
  );
}
