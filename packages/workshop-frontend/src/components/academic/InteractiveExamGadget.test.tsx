// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { InteractiveExamGadget } from "./InteractiveExamGadget";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("InteractiveExamGadget", () => {
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

  it("renders exam header, marks, question prompt, and pagination", async () => {
    await render(createElement(InteractiveExamGadget, { isOpen: true, onClose: vi.fn() }));

    expect(container.textContent).toContain("Uganda National Examinations Board");
    expect(container.textContent).toContain("Physics (Paper 1 - Theory)");
    expect(container.textContent).toContain("8 Marks");
    expect(container.textContent).toContain("Question 1 of");

    const prevButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Previous"));
    expect(prevButton).toBeDefined();
    expect((prevButton as HTMLButtonElement).disabled).toBe(true);

    const nextButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Next"));
    expect(nextButton).toBeDefined();
    expect((nextButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("navigates through questions with Next and Previous buttons", async () => {
    await render(createElement(InteractiveExamGadget, { isOpen: true, onClose: vi.fn() }));

    const nextButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Next"));
    await act(async () => {
      nextButton?.click();
    });

    expect(container.textContent).toContain("Question 2 of");

    const prevButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Previous"));
    await act(async () => {
      prevButton?.click();
    });

    expect(container.textContent).toContain("Question 1 of");
  });

  it("allows typing written response and flags question", async () => {
    await render(createElement(InteractiveExamGadget, { isOpen: true, onClose: vi.fn() }));

    const textarea = container.querySelector("textarea");
    expect(textarea).toBeDefined();

    await act(async () => {
      if (textarea) {
        textarea.value = "m1*u1 + m2*u2 = (m1+m2)*v";
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    const flagButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Flag for Review"));
    expect(flagButton).toBeDefined();

    await act(async () => {
      flagButton?.click();
    });

    expect(container.textContent).toContain("Flagged");
  });

  it("reveals socratic hints on demand", async () => {
    await render(createElement(InteractiveExamGadget, { isOpen: true, onClose: vi.fn() }));

    const hintButton = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Need a Socratic Hint?"));
    expect(hintButton).toBeDefined();

    await act(async () => {
      hintButton?.click();
    });

    expect(container.textContent).toContain("Examiner Hints:");
  });

  it("submits exam and renders rubric overview breakdown", async () => {
    await render(createElement(InteractiveExamGadget, { isOpen: true, onClose: vi.fn() }));

    const submitBtn = Array.from(container.querySelectorAll("button")).find(b => b.textContent?.includes("Submit Exam"));
    expect(submitBtn).toBeDefined();

    await act(async () => {
      submitBtn?.click();
    });

    expect(container.textContent).toContain("Examination Session Complete");
    expect(container.textContent).toContain("Question Rubric Breakdown");
  });
});
