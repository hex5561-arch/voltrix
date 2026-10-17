/**
 * Durable Task Scheduler & Background Alarm Manager for Voltrix OS
 *
 * Runs scheduled and delayed tasks autonomously on Cloudflare Durable Objects.
 * When an alarm is registered:
 * 1. Tasks are persisted with target execution timestamps.
 * 2. Next nearest alarm is scheduled via `ctx.storage.setAlarm(timestamp)`.
 * 3. The Durable Object wakes up autonomously (even with 0 active web clients),
 *    executes due tasks (agent turns, render checks, notifications), and schedules the next wake-up.
 */

export type TaskType = "agent_turn" | "render_check" | "whatsapp_digest" | "custom";
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ScheduledTask {
  id: string;
  chatId: number;
  taskType: TaskType;
  prompt: string;
  scheduledAt: number; // Unix timestamp in ms
  createdAt: number;
  status: TaskStatus;
  cron?: string;
  intervalSeconds?: number;
  result?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ScheduleTaskInput {
  prompt: string;
  delaySeconds?: number;
  timestamp?: number;
  cron?: string;
  taskType?: TaskType;
  chatId?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskStorageAdapter {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T>(options?: { prefix?: string }): Promise<Map<string, T>>;
  setAlarm?(scheduledTime: number): Promise<void>;
  getAlarm?(): Promise<number | null>;
}

export class TaskScheduler {
  private storage: TaskStorageAdapter;
  private inMemoryTasks: Map<string, ScheduledTask> = new Map();
  private initialized = false;

  constructor(storage: TaskStorageAdapter) {
    this.storage = storage;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await this.storage.list<ScheduledTask>({ prefix: "sched_task:" });
      for (const [key, task] of stored.entries()) {
        const id = key.replace("sched_task:", "");
        this.inMemoryTasks.set(id, task);
      }
    } catch {
      // In-memory mode if storage list is not available
    }
    this.initialized = true;
  }

  /**
   * Schedules a new task and updates the Durable Object alarm
   */
  async scheduleTask(input: ScheduleTaskInput, defaultChatId: number = 0): Promise<ScheduledTask> {
    await this.ensureInitialized();

    const now = Date.now();
    let scheduledAt = now;

    if (input.timestamp !== undefined) {
      scheduledAt = input.timestamp;
    } else if (input.delaySeconds !== undefined) {
      scheduledAt = now + input.delaySeconds * 1000;
    } else {
      scheduledAt = now + 60 * 1000; // Default 1 minute in future
    }

    const id = `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const task: ScheduledTask = {
      id,
      chatId: input.chatId ?? defaultChatId,
      taskType: input.taskType ?? "agent_turn",
      prompt: input.prompt.trim(),
      scheduledAt,
      createdAt: now,
      status: "pending",
      cron: input.cron,
      metadata: input.metadata,
    };

    this.inMemoryTasks.set(id, task);
    await this.storage.put(`sched_task:${id}`, task).catch(() => {});

    await this.refreshAlarm();
    return task;
  }

  /**
   * Returns list of scheduled tasks with optional status or chatId filter
   */
  async listTasks(filter?: { chatId?: number; status?: TaskStatus }): Promise<ScheduledTask[]> {
    await this.ensureInitialized();
    let tasks = Array.from(this.inMemoryTasks.values());

    if (filter?.chatId !== undefined) {
      tasks = tasks.filter((t) => t.chatId === filter.chatId);
    }
    if (filter?.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }

    return tasks.sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  /**
   * Cancels a pending task by ID
   */
  async cancelTask(taskId: string): Promise<boolean> {
    await this.ensureInitialized();
    const task = this.inMemoryTasks.get(taskId);
    if (!task) return false;

    if (task.status !== "pending") {
      return false;
    }

    task.status = "cancelled";
    await this.storage.put(`sched_task:${taskId}`, task).catch(() => {});
    await this.refreshAlarm();
    return true;
  }

  /**
   * Retrieves all tasks that are currently due for execution (scheduledAt <= now)
   */
  async getDueTasks(now: number = Date.now()): Promise<ScheduledTask[]> {
    await this.ensureInitialized();
    return Array.from(this.inMemoryTasks.values())
      .filter((t) => t.status === "pending" && t.scheduledAt <= now)
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  /**
   * Marks a task as actively running
   */
  async markTaskStarted(taskId: string): Promise<void> {
    const task = this.inMemoryTasks.get(taskId);
    if (task) {
      task.status = "running";
      await this.storage.put(`sched_task:${taskId}`, task).catch(() => {});
    }
  }

  /**
   * Marks a task as successfully completed
   */
  async markTaskCompleted(taskId: string, result?: string): Promise<void> {
    const task = this.inMemoryTasks.get(taskId);
    if (task) {
      task.status = "completed";
      task.result = result;
      await this.storage.put(`sched_task:${taskId}`, task).catch(() => {});
      await this.refreshAlarm();
    }
  }

  /**
   * Marks a task as failed with an error message
   */
  async markTaskFailed(taskId: string, error: string): Promise<void> {
    const task = this.inMemoryTasks.get(taskId);
    if (task) {
      task.status = "failed";
      task.error = error;
      await this.storage.put(`sched_task:${taskId}`, task).catch(() => {});
      await this.refreshAlarm();
    }
  }

  /**
   * Re-evaluates nearest upcoming task and schedules the DO alarm
   */
  async refreshAlarm(): Promise<number | null> {
    if (!this.storage.setAlarm) return null;

    const pending = Array.from(this.inMemoryTasks.values())
      .filter((t) => t.status === "pending")
      .map((t) => t.scheduledAt);

    if (pending.length === 0) {
      return null;
    }

    const nextAlarm = Math.min(...pending);
    await this.storage.setAlarm(nextAlarm).catch(() => {});
    return nextAlarm;
  }
}

/**
 * Formats task list as clean markdown table for user and agent display
 */
export function formatScheduledTasksList(tasks: ScheduledTask[]): string {
  if (tasks.length === 0) {
    return "No scheduled tasks found.";
  }

  const lines: string[] = [
    "### ⏱️ Scheduled & Background Tasks",
    "",
    "| Task ID | Type | Scheduled (UTC) | Status | Prompt / Action |",
    "|---|---|---|:---:|---|",
  ];

  tasks.forEach((t) => {
    const dateStr = new Date(t.scheduledAt).toISOString().replace("T", " ").slice(0, 19);
    const statusEmoji =
      t.status === "completed"
        ? "✅ completed"
        : t.status === "running"
        ? "⏳ running"
        : t.status === "pending"
        ? "🕒 pending"
        : t.status === "cancelled"
        ? "🚫 cancelled"
        : "❌ failed";

    const promptSnippet = t.prompt.length > 50 ? t.prompt.slice(0, 47) + "..." : t.prompt;
    lines.push(`| \`${t.id}\` | \`${t.taskType}\` | ${dateStr} | ${statusEmoji} | ${promptSnippet} |`);
  });

  return lines.join("\n");
}
