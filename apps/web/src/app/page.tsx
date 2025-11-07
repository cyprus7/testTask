"use client";

import { useEffect, useState, useCallback } from "react";
import WebApp from "@twa-dev/sdk";
import { TelegramAuthRequestSchema } from "@shared/contracts/auth";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [activeTab, setActiveTab] = useState<"create" | "important" | "all" | "completed">(
    "create",
  );
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
          description: newDescription.trim() ? newDescription.trim() : undefined,
          dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
          priority: newPriority,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error?.message ?? "Failed to create task");
      }

      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setNewPriority("medium");
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

  const importantPriorities = new Set(["high", "urgent"]);

  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const importantTasks = activeTasks.filter((task) =>
    importantPriorities.has(task.priority),
  );
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const renderTaskList = (items: Task[]) => {
    if (loading) {
      return <p>Loading tasks…</p>;
    }

    if (items.length === 0) {
      return <p>No tasks to display.</p>;
    }

    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((task) => {
          const dueDateLabel = task.dueDate
            ? new Date(task.dueDate).toLocaleString()
            : null;

          return (
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
                <div>
                  <strong>{task.title}</strong>
                  <div style={{ fontSize: "0.875rem", color: "#555" }}>
                    Priority: {task.priority}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#555" }}>
                    Status: {task.status}
                  </div>
                  {task.description && (
                    <p style={{ marginTop: "0.5rem" }}>{task.description}</p>
                  )}
                  {dueDateLabel && (
                    <div style={{ fontSize: "0.875rem", color: "#555" }}>
                      Due: {dueDateLabel}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button onClick={() => handleToggleStatus(task)}>
                    {task.status === "completed" ? "Mark Pending" : "Mark Completed"}
                  </button>
                  <button onClick={() => handleDelete(task.id)}>Delete</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  if (error) return <div>{error}</div>;

  return (
    <main style={{ padding: "1rem", paddingBottom: "4.5rem", fontFamily: "sans-serif" }}>
      <h1>Telegram Tasks Demo</h1>
      <p>Transport header demo using Telegram user scoped tasks.</p>
      {!ready && <p>Initializing…</p>}
      {userId && <p>Authenticated as Telegram user <strong>{userId}</strong>.</p>}
      <section style={{ marginTop: "1rem", minHeight: "320px" }}>
        {activeTab === "create" && (
          <div>
            <h2>Create Task</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Task title"
                style={{ padding: "0.5rem" }}
              />
              <textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Description (optional)"
                style={{ padding: "0.5rem", minHeight: "80px" }}
              />
              <input
                type="datetime-local"
                value={newDueDate}
                onChange={(event) => setNewDueDate(event.target.value)}
                placeholder="Due date"
                style={{ padding: "0.5rem" }}
              />
              <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span>Priority</span>
                <select
                  value={newPriority}
                  onChange={(event) => setNewPriority(event.target.value)}
                  style={{ padding: "0.5rem" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <button onClick={handleCreate} disabled={!newTitle.trim() || !userId}>
                Create task
              </button>
            </div>
          </div>
        )}

        {activeTab === "important" && (
          <div>
            <h2>Important Tasks</h2>
            {renderTaskList(importantTasks)}
          </div>
        )}

        {activeTab === "all" && (
          <div>
            <h2>All Active Tasks</h2>
            {renderTaskList(activeTasks)}
          </div>
        )}

        {activeTab === "completed" && (
          <div>
            <h2>Completed Tasks</h2>
            {renderTaskList(completedTasks)}
          </div>
        )}
      </section>

      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#f8f8f8",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-around",
          padding: "0.75rem 0",
        }}
      >
        <button
          onClick={() => setActiveTab("create")}
          style={{ fontWeight: activeTab === "create" ? "bold" : "normal" }}
        >
          Create
        </button>
        <button
          onClick={() => setActiveTab("important")}
          style={{ fontWeight: activeTab === "important" ? "bold" : "normal" }}
        >
          Important
        </button>
        <button
          onClick={() => setActiveTab("all")}
          style={{ fontWeight: activeTab === "all" ? "bold" : "normal" }}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          style={{ fontWeight: activeTab === "completed" ? "bold" : "normal" }}
        >
          Completed
        </button>
      </nav>
    </main>
  );
}
