import { describe, it, expect } from "vitest";
import { parseMarkdownQuiz, stripRawOptionsFromMarkdown } from "./quiz-parser";

describe("quiz-parser", () => {
  it("correctly parses multiple choice questions from Physics Gauntlet", () => {
    const rawMarkdown = `
## ⚡ The Voltrix Physics Gauntlet — Round 1

**Q1 — Kinematics.** A ball is thrown straight up at $20\\ \\text{m/s}$. Taking $g = 9.81\\ \\text{m/s}^2$ and ignoring drag, how high does it rise?

A) 5.1 m  B) 10.2 m  C) 20.4 m  D) 40.8 m

**Q2 — Momentum.** Two identical carts sit on a frictionless air track. Cart 1 moves at $3\\ \\text{m/s}$ and strikes Cart 2, initially at rest. The collision is **perfectly elastic**. What are the velocities afterward?

A) Both move at 1.5 m/s  B) Cart 1: 3 m/s, Cart 2: 0  C) Cart 1: 0, Cart 2: 3 m/s  D) Both move at $1.5\\sqrt{2}$ m/s
    `;

    const parsed = parseMarkdownQuiz(rawMarkdown);
    expect(parsed).not.toBeNull();
    expect(parsed?.questions.length).toBe(2);
    expect(parsed?.questions[0].options).toEqual(["5.1 m", "10.2 m", "20.4 m", "40.8 m"]);
    expect(parsed?.questions[1].options.length).toBe(4);
  });

  it("strictly REJECTS free-response exam sub-tasks (Chemistry Gauntlet)", () => {
    const chemistryMarkdown = `
# ⚡ VOLTRIX CHEMISTRY GAUNTLET — SERIOUS ROUND

## 1 · Kinetics — *Arrhenius, both ways*

A first-order reaction has $k = 1.0\\times10^{-3}\\ \\text{s}^{-1}$ at $300\\ \\text{K}$ and $k = 2.0\\times10^{-3}\\ \\text{s}^{-1}$ at $310\\ \\text{K}$.

**(a)** Calculate the activation energy $E_a$.
**(b)** Calculate the pre-exponential factor $A$.
**(c)** State, with one sentence of justification, how the half-life at $300\\ \\text{K}$ changes if $E_a$ were doubled.

## 2 · Buffers — *why they resist, and by how much*

A buffer is made from $0.100\\ \\text{M}$ acetic acid ($K_a = 1.8\\times10^{-5}$) and $0.100\\ \\text{M}$ sodium acetate.

**(a)** Calculate the pH of the buffer as mixed.
**(b)** $0.010\\ \\text{mol}$ of HCl is added to $1.00\\ \\text{L}$ of this buffer. Calculate the new pH.
**(c)** Calculate the pH if the same $0.010\\ \\text{mol}$ HCl were added to $1.00\\ \\text{L}$ of pure water instead, and explain in two lines why the difference is so large.
    `;

    const parsed = parseMarkdownQuiz(chemistryMarkdown);
    // Must be null because (a) / (b) are lower-case free response task prompts with imperative verbs!
    expect(parsed).toBeNull();
  });

  it("strips raw inline multiple choice text so only vertical card is shown", () => {
    const raw = `**Q1 — Kinematics.** A ball is thrown straight up at $20\\ \\text{m/s}$.\n\nA) 5.1 m  B) 10.2 m  C) 20.4 m  D) 40.8 m`;
    const stripped = stripRawOptionsFromMarkdown(raw);
    expect(stripped).not.toContain("A) 5.1 m");
    expect(stripped).not.toContain("B) 10.2 m");
    expect(stripped).toContain("Q1 — Kinematics");
  });
});
