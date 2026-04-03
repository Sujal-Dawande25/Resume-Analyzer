/**
 * utils/downloadReport.js
 *
 * Generates and downloads a plain-text ATS report from the analysis result.
 * No libraries needed — pure browser API.
 */

export function downloadReport(result) {
  if (!result) return;

  const {
    atsScore,
    matchedKeywords = [],
    missingKeywords = [],
    suggestions = [],
    categories = [],
  } = result;

  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const line  = (char = "─", len = 60) => char.repeat(len);
  const grade = atsScore >= 75 ? "Strong Match" : atsScore >= 55 ? "Good Match" : atsScore >= 35 ? "Partial Match" : "Needs Work";

  const lines = [
    line("═"),
    "  ATS RESUME ANALYSIS REPORT",
    `  Generated on ${date}`,
    line("═"),
    "",
    `  ATS Score   : ${atsScore}/100`,
    `  Grade       : ${grade}`,
    "",
    line(),
    "  KEYWORD SUMMARY",
    line(),
    `  Matched  (${matchedKeywords.length})  : ${matchedKeywords.join(", ") || "None"}`,
    "",
    `  Missing  (${missingKeywords.length})  : ${missingKeywords.join(", ") || "None"}`,
    "",
    line(),
    "  SECTION COVERAGE",
    line(),
    ...categories.map(c => `  ${c.name.padEnd(24)} ${c.score}%`),
    "",
    line(),
    "  IMPROVEMENT SUGGESTIONS",
    line(),
    ...suggestions.map((s, i) => {
      const priority = (typeof s === "object" ? s.priority : "—").toUpperCase();
      const category = (typeof s === "object" ? s.category : "");
      const text     = typeof s === "object" ? s.text : s;
      return [
        `  ${String(i + 1).padStart(2, "0")}. [${priority}] ${category ? `(${category}) ` : ""}`,
        `      ${text}`,
        "",
      ].join("\n");
    }),
    line("═"),
    "  End of Report — AI Resume Analyzer",
    line("═"),
  ];

  const content = lines.join("\n");
  const blob    = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url     = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href     = url;
  a.download = `ATS_Report_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}