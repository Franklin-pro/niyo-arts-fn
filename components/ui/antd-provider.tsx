"use client";

import { App, ConfigProvider, theme } from "antd";
import type { ReactNode } from "react";

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#b28a27",
          colorInfo: "#3158b8",
          colorSuccess: "#247a55",
          colorWarning: "#b7791f",
          colorError: "#b42318",
          colorText: "#202124",
          colorTextSecondary: "#666b73",
          colorBgLayout: "#f6f6f3",
          colorBorder: "#e5e5e0",
          borderRadius: 10,
          controlHeight: 44,
          fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
          wireframe: false,
        },
        components: {
          Button: { fontWeight: 600, primaryShadow: "0 6px 16px rgba(178, 138, 39, .18)" },
          Card: { borderRadiusLG: 16 },
          Input: { activeShadow: "0 0 0 3px rgba(178, 138, 39, .12)" },
          Menu: { itemBorderRadius: 10, itemSelectedBg: "#f4efdf", itemSelectedColor: "#755a18" },
          Table: { headerBg: "#f8f8f5", rowHoverBg: "#fbfaf6" },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
