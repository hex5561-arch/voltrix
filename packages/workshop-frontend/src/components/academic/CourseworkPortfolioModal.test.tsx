// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { CourseworkPortfolioModal } from "./CourseworkPortfolioModal";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("CourseworkPortfolioModal", () => {
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

  it("renders enrolled submissions and architectural audit scores", async () => {
    await render(createElement(CourseworkPortfolioModal, { isOpen: true, onClose: vi.fn() }));

    expect(container.textContent).toContain("Coursework & Project Portfolio Auditor");
    expect(container.textContent).toContain("Digital Filter Design & FFT Benchmark");
    expect(container.textContent).toContain("Academic Copilot Audit Verdict");
  });

  it("allows switching to submit tab to submit new draft", async () => {
    await render(createElement(CourseworkPortfolioModal, { isOpen: true, onClose: vi.fn() }));

    const submitTab = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("+ Submit New Draft"));
    expect(submitTab).toBeDefined();

    await act(async () => {
      submitTab?.click();
    });

    expect(container.textContent).toContain("Paste Code (.py, .ts) or Report Text");
  });

  it("triggers onSendToChat callback when requesting revision guidance", async () => {
    const handleSend = vi.fn();
    const handleClose = vi.fn();

    await render(createElement(CourseworkPortfolioModal, {
      isOpen: true,
      onClose: handleClose,
      onSendToChat: handleSend,
    }));

    const chatBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Work on Revision Steps with Copilot in Chat"));
    expect(chatBtn).toBeDefined();

    await act(async () => {
      chatBtn?.click();
    });

    expect(handleSend).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
});
