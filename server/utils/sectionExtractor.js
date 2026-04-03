// const extractSections = (text) => {
//     const lowerText = text.toLowerCase();

//     const getSection = (startKeyword, endKeywords) => {
//         const startIndex = lowerText.indexOf(startKeyword);
//         if (startIndex === -1) return "";

//         let endIndex = text.length;

//         for (let keyword of endKeywords) {
//             const idx = lowerText.indexOf(keyword, startIndex + 1);
//             if (idx !== -1 && idx < endIndex) {
//                 endIndex = idx;
//             }
//         }

//         return text.substring(startIndex, endIndex).trim();
//     };

//     return {
//         skills: getSection("skills", ["education", "projects", "experience"]),
//         education: getSection("education", ["skills", "projects", "experience"]),
//         projects: getSection("projects", ["skills", "education", "experience"]),
//         experience: getSection("experience", ["skills", "education", "projects"]),
//     };
// };

// module.exports = { extractSections };
/**
 * utils/sectionExtractor.js
 *
 * Extracts resume sections by detecting common heading variants,
 * not just exact keyword matches.
 */

/* ─────────────────────────────────────────
   HEADING PATTERNS PER SECTION
   Each section has a list of regex patterns that match
   real-world resume heading variations.
───────────────────────────────────────── */
const SECTION_PATTERNS = {
  skills: [
    /\b(technical\s+)?skills?\b/i,
    /\bcore\s+competencies\b/i,
    /\btechnologies\b/i,
    /\btech\s+stack\b/i,
    /\btools\s+&\s+technologies\b/i,
    /\bprogramming\s+languages?\b/i,
    /\bexpertise\b/i,
  ],
  experience: [
    /\b(work\s+)?experience\b/i,
    /\bemployment(\s+history)?\b/i,
    /\bwork\s+history\b/i,
    /\bprofessional\s+experience\b/i,
    /\bcareer\s+history\b/i,
    /\bjob\s+history\b/i,
    /\binternship(s)?\b/i,
  ],
  projects: [
    /\bprojects?\b/i,
    /\bpersonal\s+projects?\b/i,
    /\bacademic\s+projects?\b/i,
    /\bside\s+projects?\b/i,
    /\bportfolio\b/i,
    /\bopen\s+source\b/i,
  ],
  education: [
    /\beducation(\s+background)?\b/i,
    /\bacademic(\s+background)?\b/i,
    /\bqualifications?\b/i,
    /\bdegree(s)?\b/i,
    /\buniversity\b/i,
    /\bcollege\b/i,
  ],
  summary: [
    /\b(professional\s+)?summary\b/i,
    /\bobjective\b/i,
    /\bprofile\b/i,
    /\babout\s+me\b/i,
    /\bcareer\s+objective\b/i,
    /\bprofessional\s+profile\b/i,
  ],
};

/* ─────────────────────────────────────────
   FIND ALL SECTION HEADING POSITIONS
   Scans line by line for headings and records their position.
───────────────────────────────────────── */
function findHeadings(text) {
  const lines   = text.split("\n");
  const headings = []; // [{ sectionKey, lineIndex, charIndex }]

  let charIndex = 0;

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // A heading line is typically short (< 60 chars) and not a sentence
    const looksLikeHeading = trimmed.length > 0 && trimmed.length < 60;

    if (looksLikeHeading) {
      for (const [sectionKey, patterns] of Object.entries(SECTION_PATTERNS)) {
        if (patterns.some(p => p.test(trimmed))) {
          headings.push({ sectionKey, lineIndex, charIndex });
          break; // one section per line
        }
      }
    }

    charIndex += line.length + 1; // +1 for the \n
  });

  return headings;
}

/* ─────────────────────────────────────────
   EXTRACT SECTIONS
───────────────────────────────────────── */
const extractSections = (text) => {
  const sections = {
    skills:     "",
    experience: "",
    projects:   "",
    education:  "",
    summary:    "",
  };

  const headings = findHeadings(text);

  if (headings.length === 0) {
    // Fallback: no headings detected — return full text under "skills"
    // so keyword matching still works even on flat resumes
    sections.skills = text;
    return sections;
  }

  // For each detected heading, extract text from its position
  // to the start of the next heading
  headings.forEach((heading, i) => {
    const start = heading.charIndex;
    const end   = i + 1 < headings.length ? headings[i + 1].charIndex : text.length;
    const content = text.substring(start, end).trim();

    // If multiple headings map to the same section, append content
    if (sections[heading.sectionKey]) {
      sections[heading.sectionKey] += "\n" + content;
    } else {
      sections[heading.sectionKey] = content;
    }
  });

  return sections;
};

module.exports = { extractSections };