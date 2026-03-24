/**
 * utils/atsScorer.js
 *
 * Analyzes a parsed resume against a job description and returns
 * an ATS compatibility score, keyword breakdown, category coverage,
 * and prioritized suggestions.
 */

/* ─────────────────────────────────────────
   STOP WORDS — excluded from keyword matching
───────────────────────────────────────── */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "will", "would", "can", "could", "should", "may",
  "might", "do", "does", "did", "not", "we", "you", "our", "your", "they",
  "their", "this", "that", "it", "its", "as", "if", "so", "up", "out",
  "about", "into", "than", "then", "also", "both", "each", "more", "most",
  "other", "some", "such", "no", "nor", "only", "own", "same", "too",
  "very", "just", "any", "all", "how", "when", "who", "which", "what",
  "use", "used", "using", "well", "new", "get", "make", "work", "works",
]);

/* ─────────────────────────────────────────
   SCORING WEIGHTS  (must sum to 100)
───────────────────────────────────────── */
const WEIGHTS = {
  keywordMatch:   40,   // how well resume keywords match JD keywords
  sectionQuality: 30,   // presence + content quality of key sections
  experienceDepth: 15,  // richness of experience section
  educationMatch:  10,  // education section present and relevant
  formattingBonus:  5,  // structural signals (quantified achievements, etc.)
};

/* ─────────────────────────────────────────
   SECTION WEIGHTS inside sectionQuality
───────────────────────────────────────── */
const SECTION_SCORES = {
  skills:     { weight: 40, label: "Skills" },
  experience: { weight: 35, label: "Experience" },
  projects:   { weight: 15, label: "Projects" },
  education:  { weight: 10, label: "Education" },
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/** Naive stemmer — strips common English suffixes for fuzzy matching */
function stem(word) {
  return word
    .replace(/ing$/, "")
    .replace(/tion$/, "")
    .replace(/tions$/, "")
    .replace(/ities$/, "ity")
    .replace(/ies$/, "y")
    .replace(/ers?$/, "")
    .replace(/ment$/, "")
    .replace(/s$/, "");
}

/** Tokenize text into meaningful words — removes punctuation, stop words, short tokens */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#]/g, " ")   // keep + and # (C++, C#)
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/** Extract meaningful multi-word phrases (bigrams) from a token list */
function bigrams(tokens) {
  const pairs = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    pairs.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return pairs;
}

/** Check if a keyword exists in resume text — exact token or stemmed match */
function keywordFound(keyword, resumeTokens, resumeStems) {
  const kwTokens = tokenize(keyword);
  if (kwTokens.length === 0) return false;

  if (kwTokens.length === 1) {
    // Single word: exact token match OR stemmed match
    return resumeTokens.includes(kwTokens[0]) || resumeStems.includes(stem(kwTokens[0]));
  }

  // Multi-word phrase: look for the phrase as a substring in the original text
  return false; // handled separately via phrase matching
}

/** Deduplicate and sort an array of strings */
function dedupe(arr) {
  return [...new Set(arr)].sort();
}

/* ─────────────────────────────────────────
   SCORE COMPONENTS
───────────────────────────────────────── */

/**
 * Keyword match score (0–100 internally, scaled to WEIGHTS.keywordMatch)
 * Returns matched/missing arrays and the raw ratio.
 */
function scoreKeywords(jdTokens, jdBigrams, resumeText, resumeTokens, resumeStems) {
  const matched = [];
  const missing = [];

  // Score single keywords
  const uniqueJdTokens = dedupe(jdTokens);
  uniqueJdTokens.forEach(kw => {
    if (resumeTokens.includes(kw) || resumeStems.includes(stem(kw))) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  // Score bigrams (phrases like "machine learning", "project management")
  const uniqueBigrams = dedupe(jdBigrams);
  uniqueBigrams.forEach(phrase => {
    if (resumeText.includes(phrase)) {
      // Phrase match is a strong signal — add if not already covered
      if (!matched.includes(phrase)) matched.push(phrase);
    }
  });

  const total = uniqueJdTokens.length;
  const ratio = total > 0 ? matched.length / total : 0;

  return { matched: dedupe(matched), missing: dedupe(missing), ratio };
}

/**
 * Section quality score (0–100 internally, scaled to WEIGHTS.sectionQuality)
 * Rewards presence AND non-trivial content length.
 */
function scoreSections(sections) {
  let earned = 0;
  const breakdown = {};

  for (const [key, { weight, label }] of Object.entries(SECTION_SCORES)) {
    const content = (sections[key] || "").trim();
    const present = content.length > 0;
    const substantial = content.length > 100; // has real content, not just a heading

    const sectionScore = present ? (substantial ? weight : weight * 0.5) : 0;
    earned += sectionScore;
    breakdown[label] = { present, score: Math.round(sectionScore), max: weight };
  }

  return { ratio: earned / 100, breakdown };
}

/**
 * Experience depth score (0–100 internally, scaled to WEIGHTS.experienceDepth)
 * Looks for quantified achievements (numbers, %, $) and action verbs.
 */
function scoreExperienceDepth(sections) {
  const text = (sections.experience || "").toLowerCase();
  if (!text) return 0;

  const hasNumbers    = /\d+/.test(text);
  const hasPercents   = /%/.test(text);
  const hasDollar     = /\$/.test(text);
  const actionVerbs   = ["led", "built", "designed", "improved", "increased", "reduced",
                         "managed", "developed", "delivered", "launched", "architected",
                         "optimized", "mentored", "automated", "integrated", "scaled"];
  const verbCount     = actionVerbs.filter(v => text.includes(v)).length;

  let score = 0;
  if (hasNumbers)  score += 30;
  if (hasPercents) score += 25;
  if (hasDollar)   score += 15;
  score += Math.min(30, verbCount * 6); // up to 30 pts from action verbs

  return Math.min(100, score);
}

/**
 * Education match score (0–100 internally, scaled to WEIGHTS.educationMatch)
 */
function scoreEducation(sections) {
  const text = (sections.education || "").toLowerCase();
  if (!text) return 0;

  const degrees = ["bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e",
                   "b.sc", "m.sc", "mba", "associate", "diploma"];
  const hasDegree = degrees.some(d => text.includes(d));
  return hasDegree ? 100 : 50; // has education section but degree not detected
}

/**
 * Formatting bonus score (0–100 internally, scaled to WEIGHTS.formattingBonus)
 */
function scoreFormatting(sections) {
  const fullText = Object.values(sections).join(" ").toLowerCase();
  let score = 0;

  if (/\d+/.test(fullText))           score += 40; // numbers present
  if (/github|linkedin|portfolio/i.test(fullText)) score += 30; // links
  if (/\bcertif/i.test(fullText))      score += 30; // certifications

  return Math.min(100, score);
}

/* ─────────────────────────────────────────
   SUGGESTIONS ENGINE
───────────────────────────────────────── */
function buildSuggestions(sections, missing, sectionBreakdown, experienceRatio) {
  const suggestions = [];

  // High priority — structural gaps
  if (!sections.skills || sections.skills.trim().length < 50) {
    suggestions.push({
      priority: "high",
      text: "Add or expand your Skills section — ATS systems heavily weight this section.",
    });
  }

  if (!sections.experience || sections.experience.trim().length < 100) {
    suggestions.push({
      priority: "high",
      text: "Your Experience section is missing or too brief. Add roles with responsibilities and achievements.",
    });
  }

  // High priority — missing keywords
  if (missing.length > 0) {
    const top = missing.slice(0, 6).join(", ");
    suggestions.push({
      priority: "high",
      text: `Add these missing keywords from the job description: ${top}.`,
    });
  }

  // Medium priority — experience quality
  if (experienceRatio < 0.5 && sections.experience) {
    suggestions.push({
      priority: "medium",
      text: "Strengthen your experience with quantified achievements — use numbers, percentages, or dollar amounts (e.g. 'Reduced load time by 40%').",
    });
  }

  if (!sections.projects) {
    suggestions.push({
      priority: "medium",
      text: "Add a Projects section to showcase hands-on work, especially if you have limited experience.",
    });
  }

  if (!sections.education || sections.education.trim().length < 30) {
    suggestions.push({
      priority: "medium",
      text: "Add an Education section with your degree, institution, and graduation year.",
    });
  }

  // Low priority — polish
  const fullText = Object.values(sections).join(" ");
  if (!/github|linkedin/i.test(fullText)) {
    suggestions.push({
      priority: "low",
      text: "Include links to your GitHub and LinkedIn profile — many ATS systems and recruiters look for these.",
    });
  }

  if (!/certif/i.test(fullText)) {
    suggestions.push({
      priority: "low",
      text: "Consider adding certifications relevant to the role to strengthen your profile.",
    });
  }

  return suggestions;
}

/* ─────────────────────────────────────────
   CATEGORY COVERAGE (for frontend chart)
───────────────────────────────────────── */
function buildCategories(jdTokens, resumeTokens, resumeStems, sections) {
  // Split JD tokens into rough categories by checking against section content
  const skillsText   = tokenize(sections.skills || "");
  const expText      = tokenize(sections.experience || "");
  const projText     = tokenize(sections.projects || "");

  function coverageScore(sectionTokens) {
    if (jdTokens.length === 0) return 0;
    const hits = jdTokens.filter(kw =>
      sectionTokens.includes(kw) || sectionTokens.includes(stem(kw))
    ).length;
    return Math.round((hits / jdTokens.length) * 100);
  }

  return [
    { name: "Technical Skills",    score: coverageScore(skillsText) },
    { name: "Experience Keywords", score: coverageScore(expText) },
    { name: "Project Relevance",   score: coverageScore(projText) },
    { name: "Overall Vocabulary",  score: Math.round((resumeTokens.filter(t => jdTokens.includes(t)).length / Math.max(jdTokens.length, 1)) * 100) },
  ];
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
const analyzeResume = (sections, jobDescription) => {
  if (!sections || typeof sections !== "object") {
    throw new Error("analyzeResume: sections must be an object.");
  }
  if (!jobDescription || typeof jobDescription !== "string") {
    throw new Error("analyzeResume: jobDescription must be a non-empty string.");
  }

  // ── Tokenize ──────────────────────────────
  const jdTokens     = tokenize(jobDescription);
  const jdBigrams    = bigrams(jdTokens);
  const resumeText   = Object.values(sections).join(" ").toLowerCase();
  const resumeTokens = tokenize(resumeText);
  const resumeStems  = resumeTokens.map(stem);

  // ── Score each dimension ──────────────────
  const { matched, missing, ratio: kwRatio }   = scoreKeywords(jdTokens, jdBigrams, resumeText, resumeTokens, resumeStems);
  const { ratio: secRatio, breakdown }          = scoreSections(sections);
  const expDepthRatio                           = scoreExperienceDepth(sections) / 100;
  const eduRatio                                = scoreEducation(sections) / 100;
  const fmtRatio                                = scoreFormatting(sections) / 100;

  // ── Weighted final score ──────────────────
  const rawScore =
    kwRatio      * WEIGHTS.keywordMatch    +
    secRatio     * WEIGHTS.sectionQuality  +
    expDepthRatio* WEIGHTS.experienceDepth +
    eduRatio     * WEIGHTS.educationMatch  +
    fmtRatio     * WEIGHTS.formattingBonus;

  const atsScore = Math.min(100, Math.round(rawScore));

  // ── Suggestions + categories ──────────────
  const suggestions = buildSuggestions(sections, missing, breakdown, expDepthRatio);
  const categories  = buildCategories(jdTokens, resumeTokens, resumeStems, sections);

  return {
    atsScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    suggestions,
    categories,
    breakdown,   // per-section scores, useful for debugging
  };
};

module.exports = { analyzeResume };