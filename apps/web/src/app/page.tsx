"use client";

import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { TelegramAuthRequestSchema } from "@contracts/auth";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    setReady(true);

    const initData = WebApp.initData || "";
    const parsed = TelegramAuthRequestSchema.safeParse({ initData });

    if (!parsed.success) {
      setError("Unable to validate init data.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError("API URL is not configured.");
      return;
    }

    fetch(`${apiUrl}/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(parsed.data)
    }).catch(() => setError("Failed to reach API."));
  }, []);

  if (error) return <div>{error}</div>;
  return <div>{ready ? "Loaded" : "..."}</div>;
}
