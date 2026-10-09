// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { TimetableVelocityWidget } from "./TimetableVelocityWidget";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("TimetableVelocityWidget", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
  });

  async function render(element: React.ReactElement) {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(element));
  }

  it("renders semester velocity metrics, days to finals, and burn-down", async () => {
    await render(createElement(TimetableVelocityWidget, { isOpen: true, onClose: vi.fn() }));

    expect(container.textContent).toContain("Week 7 of 14");
    expect(container.textContent).toContain("42 Days");
    expect(container.textContent).toContain("50%");
    expect(container.textContent?.toLowerCase()).toContain("accelerated");
  });

  it("switches day of week and displays lecture checklist", async () => {
    await render(createElement(TimetableVelocityWidget, { isOpen: true, onClose: vi.fn() }));

    const tueBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.trim() === "Tue");
    expect(tueBtn).toBeDefined();

    await act(async () => {
      tueBtn?.click();
    });

    expect(container.textContent).toContain("EEE3002");
    expect(container.textContent).toContain("Signals & Linear Systems");
    expect(container.textContent).toContain("Pre-Lecture High-Yield Checklist:");
    expect(container.textContent).toContain("Fourier transform frequency-domain duality");
  });

  it("triggers onOpenExamGadget and onOpenPortfolio callbacks", async () => {
    const handleExam = vi.fn();
    const handlePortfolio = vi.fn();

    await render(createElement(TimetableVelocityWidget, {
      isOpen: true,
      onClose: vi.fn(),
      onOpenExamGadget: handleExam,
      onOpenPortfolio: handlePortfolio,
    }));

    const examBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Launch Exam Gadget"));
    expect(examBtn).toBeDefined();

    await act(async () => {
      examBtn?.click();
    });
    expect(handleExam).toHaveBeenCalled();

    const portBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Coursework Portfolio Auditor"));
    expect(portBtn).toBeDefined();

    await act(async () => {
      portBtn?.click();
    });
    expect(handlePortfolio).toHaveBeenCalled();
  });
});
