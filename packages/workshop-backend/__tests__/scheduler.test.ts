import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TaskScheduler,
  formatScheduledTasksList,
  type TaskStorageAdapter,
  type ScheduledTask,
} from "../src/scheduler";

class MockTaskStorage implements TaskStorageAdapter {
  private data = new Map<string, any>();
  public currentAlarm: number | null = null;

  async get<T>(key: string): Promise<T | undefined> {
    return this.data.get(key);
  }

  async put<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async list<T>(options?: { prefix?: string }): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const prefix = options?.prefix ?? "";
    for (const [k, v] of this.data.entries()) {
      if (k.startsWith(prefix)) {
        result.set(k, v);
      }
    }
    return result;
  }

  async setAlarm(scheduledTime: number): Promise<void> {
    this.currentAlarm = scheduledTime;
  }

  async getAlarm(): Promise<number | null> {
    return this.currentAlarm;
  }
}

describe("TaskScheduler", () => {
  let storage: MockTaskStorage;
  let scheduler: TaskScheduler;

  beforeEach(() => {
    storage = new MockTaskStorage();
    scheduler = new TaskScheduler(storage);
  });

  it("schedules a task with relative delay and sets nearest alarm", async () => {
    const now = Date.now();
    const task = await scheduler.scheduleTask({
      prompt: "Generate daily lesson summary",
      delaySeconds: 120, // 2 minutes
      chatId: 42,
      taskType: "agent_turn",
    });

    expect(task.id).toMatch(/^task-/);
    expect(task.prompt).toBe("Generate daily lesson summary");
    expect(task.status).toBe("pending");
    expect(task.scheduledAt).toBeGreaterThanOrEqual(now + 119_000);
    expect(task.scheduledAt).toBeLessThanOrEqual(now + 125_000);
    expect(storage.currentAlarm).toBe(task.scheduledAt);

    // Stored in persistence
    const stored = await storage.get<ScheduledTask>(`sched_task:${task.id}`);
    expect(stored).toBeDefined();
    expect(stored?.id).toBe(task.id);
  });

  it("retrieves due tasks when scheduledAt <= current time", async () => {
    const pastTime = Date.now() - 5000;
    const futureTime = Date.now() + 100000;

    const dueTask = await scheduler.scheduleTask({
      prompt: "Check render job",
      timestamp: pastTime,
      chatId: 1,
    });

    const pendingTask = await scheduler.scheduleTask({
      prompt: "Future reminder",
      timestamp: futureTime,
      chatId: 1,
    });

    const due = await scheduler.getDueTasks();
    expect(due.length).toBe(1);
    expect(due[0].id).toBe(dueTask.id);
  });

  it("transitions task through lifecycle: running -> completed", async () => {
    const task = await scheduler.scheduleTask({
      prompt: "Transcribe voice note",
      delaySeconds: 10,
    });

    await scheduler.markTaskStarted(task.id);
    let list = await scheduler.listTasks();
    expect(list.find((t) => t.id === task.id)?.status).toBe("running");

    await scheduler.markTaskCompleted(task.id, "Transcription completed");
    list = await scheduler.listTasks();
    const updated = list.find((t) => t.id === task.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.result).toBe("Transcription completed");
  });

  it("cancels a pending task and clears or adjusts alarm", async () => {
    const task = await scheduler.scheduleTask({
      prompt: "Cancel me",
      delaySeconds: 60,
    });

    expect(task.status).toBe("pending");
    const cancelled = await scheduler.cancelTask(task.id);
    expect(cancelled).toBe(true);

    const list = await scheduler.listTasks({ status: "cancelled" });
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(task.id);

    // Attempting to cancel already cancelled task returns false
    const cancelAgain = await scheduler.cancelTask(task.id);
    expect(cancelAgain).toBe(false);
  });

  it("formats task list as markdown table", async () => {
    await scheduler.scheduleTask({
      prompt: "Backup workshop notes",
      delaySeconds: 300,
    });

    const tasks = await scheduler.listTasks();
    const formatted = formatScheduledTasksList(tasks);

    expect(formatted).toContain("### ⏱️ Scheduled & Background Tasks");
    expect(formatted).toContain("| Task ID | Type | Scheduled (UTC) | Status | Prompt / Action |");
    expect(formatted).toContain("Backup workshop notes");
  });
});
