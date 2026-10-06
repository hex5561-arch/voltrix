import { describe, expect, it } from "vitest";
import { extractTextFromPdf } from "../src/pdf-extract.js";
import * as fs from "node:fs";

describe("extractTextFromPdf", () => {
  it("returns empty string for empty input", async () => {
    expect(await extractTextFromPdf(new Uint8Array(0))).toBe("");
  });

  it("extracts text from an uncompressed PDF content stream", async () => {
    const pdf = `%PDF-1.4
1 0 obj
<< /Length 50 >>
stream
BT
/F1 12 Tf
(Hello World) Tj
ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
    const bytes = new TextEncoder().encode(pdf);
    const result = await extractTextFromPdf(bytes);
    expect(result).toContain("Hello World");
  });

  it("extracts text from TJ array blocks with escapes", async () => {
    const pdf = `%PDF-1.4
1 0 obj
<< /Length 80 >>
stream
BT
/F1 12 Tf
[(Distributed) 10 (Systems) 20 (Course)] TJ
ET
endstream
endobj`;
    const bytes = new TextEncoder().encode(pdf);
    const result = await extractTextFromPdf(bytes);
    expect(result).toContain("Distributed Systems Course");
  });

  it("extracts text from a real FlateDecode PDF file", async () => {
    const samplePath = "/home/voltrix/coursehero/test_clean_spec.pdf";
    if (fs.existsSync(samplePath)) {
      const buffer = fs.readFileSync(samplePath);
      const result = await extractTextFromPdf(new Uint8Array(buffer));
      expect(result.length).toBeGreaterThan(100);
      expect(result).toContain("MAKERERE UNIVERSITY");
    }
  });
});
