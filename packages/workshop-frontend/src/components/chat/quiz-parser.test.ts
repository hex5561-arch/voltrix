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

  it("correctly parses bulleted markdown lists with bold letters (as seen in Screenshot 15-46-32)", () => {
    const screenshotMarkdown = `
⚡ Introductory Physics — Quick Quiz (4 Questions)

Answer with just the letters, e.g. 1B 2C 3A 4D — I'll mark you and explain any you miss.

---

Q1. A car travels 150 m in 10 seconds at a steady speed. What is its speed?
* **A)** 1.5 m/s
* **B)** 15 m/s
* **C)** 150 m/s
* **D)** 1500 m/s

Q2. A 5 kg box sits on a frictionless floor. A horizontal force of 20 N pushes it. What is its acceleration?
* **A)** 0.25 m/s²
* **B)** 2 m/s²
* **C)** 4 m/s²
* **D)** 100 m/s²

Q3. A 2 kg ball moves at 3 m/s. What is its kinetic energy?
- **A)** 3 J
- **B)** 6 J
- **C)** 9 J
- **D)** 18 J

Q4. Which of the following is a scalar quantity?
- A) Velocity
- B) Acceleration
- C) Force
- D) Speed
    `;

    const parsed = parseMarkdownQuiz(screenshotMarkdown);
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe("Introductory Physics — Quick Quiz (4 Questions)");
    expect(parsed?.questions.length).toBe(4);
    expect(parsed?.questions[0].question).toContain("A car travels 150 m in 10 seconds");
    expect(parsed?.questions[0].options).toEqual(["1.5 m/s", "15 m/s", "150 m/s", "1500 m/s"]);
    expect(parsed?.questions[1].options).toEqual(["0.25 m/s²", "2 m/s²", "4 m/s²", "100 m/s²"]);
    expect(parsed?.questions[2].options).toEqual(["3 J", "6 J", "9 J", "18 J"]);
    expect(parsed?.questions[3].options).toEqual(["Velocity", "Acceleration", "Force", "Speed"]);
  });

  it("correctly parses standard numbered lists (as in ChatGPT screencast)", () => {
    const chatGptMarkdown = `
1. A car travels 120 metres in 6 seconds at constant speed. What is its speed?
A. 15 m/s
B. 20 m/s
C. 24 m/s
D. 720 m/s

2. A 4 kg object accelerates at 3 m/s². What net force acts on it?
A. 1.33 N
B. 7 N
C. 12 N
D. 24 N
    `;

    const parsed = parseMarkdownQuiz(chatGptMarkdown);
    expect(parsed).not.toBeNull();
    expect(parsed?.questions.length).toBe(2);
    expect(parsed?.questions[0].options).toEqual(["15 m/s", "20 m/s", "24 m/s", "720 m/s"]);
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
    expect(parsed).toBeNull();
  });

  it("strips raw questions so only the intro stays above the interactive card", () => {
    const raw = `⚡ Quick Test\n\nTake this test to check your knowledge.\n\nQ1. A car travels 150 m in 10 s.\nA) 15 m/s\nB) 20 m/s\nC) 30 m/s\nD) 40 m/s`;
    const stripped = stripRawOptionsFromMarkdown(raw);
    expect(stripped).toContain("⚡ Quick Test");
    expect(stripped).toContain("Take this test to check your knowledge.");
    expect(stripped).not.toContain("Q1. A car travels");
    expect(stripped).not.toContain("A) 15 m/s");
  });
});
