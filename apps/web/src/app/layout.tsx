import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Task Manager WebApp",
  viewport: "width=device-width, initial-scale=1"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
