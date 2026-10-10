export type PiiScreenResult = { hasPII: boolean; triggeredRules: string[]; };

const SCAN_CHARS = 4000;

const PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "national-id", pattern: /(?<!\d)\d{7,8}(?!\d)/g },
  { name: "phone", pattern: /(?:\+254|0[17]\d{1,2})[- ]?\d{3}[- ]?\d{4}|\+\d{1,3}[- ]?\(?\d{2,4}\)?[- ]?\d{3,4}[- ]?\d{4}/g },
  { name: "email", pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  { name: "plot-land", pattern: /\b(?:plot|l\.r\.|lr|title deed|land ref(?:erence)?|parcel)\s*(?:no\.?|number|#)?\s*[\w\/\-]+/gi },
  { name: "bank-account", pattern: /\b(?:account|a\/c|acct)\.?\s*(?:no\.?|number|#)?\s*:?\s*\d[\d\s\-]{6,}/gi },
  { name: "attribution", pattern: /^(?:name|applicant|student|candidate|reg(?:istration)?\s*(?:no\.?|number)?|adm(?:ission)?\s*(?:no\.?|number)?|id\s*(?:no\.?|number)?)\s*:/gim },
  { name: "address", pattern: /\b\d+[,\s]+(?:[A-Z][a-z]+\s+){1,3}(?:road|street|avenue|close|lane|drive|estate|place|court|crescent)\b/gi },
];

const PERSONAL_PHRASES = /\bmy\s+(?:id|national id|passport|results|grades|marks|plot|land|account|salary|payslip|bank|registration|admission|student number|certificate|transcript)\b/gi;

export function screenForPII(text: string): PiiScreenResult {
  const half = Math.floor(SCAN_CHARS / 2);
  const head = text.slice(0, half);
  const tail = text.length > half ? text.slice(-half) : "";
  const sample = `${head}\n${tail}`;
  const triggered: string[] = [];
  for (const { name, pattern } of PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(sample)) triggered.push(name);
  }
  PERSONAL_PHRASES.lastIndex = 0;
  if (PERSONAL_PHRASES.test(sample)) triggered.push("personal-phrase");
  return { hasPII: triggered.length > 0, triggeredRules: triggered };
}
