"use client";

import { useEffect, useState, useCallback } from "react";
import WebApp from "@twa-dev/sdk";
import { TelegramAuthRequestSchema } from "@shared/contracts/auth";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const fetchTasks = useCallback(async (currentUserId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/tasks`, {
        headers: {
          "X-Telegram-Id": String(currentUserId),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message ?? "Unable to fetch tasks");
      }

      setTasks(data.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

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

    const telegramUserId = WebApp.initDataUnsafe?.user?.id;

    if (!telegramUserId) {
      setError("Unable to determine Telegram user.");
      return;
    }

    setUserId(telegramUserId);

    const headers = {
      "Content-Type": "application/json",
      "X-Telegram-Id": String(telegramUserId),
    };

    fetch(`${apiBase}/auth/telegram`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(parsed.data),
    })
      .then(() => fetchTasks(telegramUserId))
      .catch(() => setError("Failed to reach API."));
  }, [fetchTasks]);

  const handleCreate = async () => {
    if (!userId || !newTitle.trim()) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Id": String(userId),
        },
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message ?? "Failed to create task");
      }

      setNewTitle("");
      await fetchTasks(userId);
    } catch (err) {
      console.error(err);
      setError("Failed to create task.");
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (!userId) {
      return;
    }

    const nextStatus = task.status === "completed" ? "pending" : "completed";

    try {
      const response = await fetch(`${apiBase}/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Id": String(userId),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message ?? "Failed to update task");
      }

      await fetchTasks(userId);
    } catch (err) {
      console.error(err);
      setError("Failed to update task.");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!userId) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "X-Telegram-Id": String(userId),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message ?? "Failed to delete task");
      }

      await fetchTasks(userId);
    } catch (err) {
      console.error(err);
      setError("Failed to delete task.");
    }
  };

  if (error) return <div>{error}</div>;

  return (
    <main style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Telegram Tasks Demo</h1>
      <p>Transport header demo using Telegram user scoped tasks.</p>
      {!ready && <p>Initializing…</p>}
      {userId && <p>Authenticated as Telegram user <strong>{userId}</strong>.</p>}

      <section style={{ marginTop: "1rem" }}>
        <h2>Create Task</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Task title"
            style={{ flex: 1, padding: "0.5rem" }}
          />
          <button onClick={handleCreate} disabled={!newTitle.trim() || !userId}>
            Add
          </button>
        </div>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Your Tasks</h2>
        {loading ? (
          <p>Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p>No tasks yet. Create one above!</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {tasks.map((task) => (
              <li
                key={task.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    <strong>{task.title}</strong>
                    {" "}({task.priority}) – {task.status}
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleToggleStatus(task)}>
                      {task.status === "completed" ? "Mark Pending" : "Mark Completed"}
                    </button>
                    <button onClick={() => handleDelete(task.id)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
