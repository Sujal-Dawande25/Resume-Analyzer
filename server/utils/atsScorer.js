// /**
//  * utils/atsScorer.js
//  *
//  * Analyzes a parsed resume against a job description and returns
//  * an ATS compatibility score, keyword breakdown, category coverage,
//  * and prioritized suggestions.
//  */

// /* ─────────────────────────────────────────
//    STOP WORDS — excluded from keyword matching
// ───────────────────────────────────────── */
// const STOP_WORDS = new Set([
//   "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
//   "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
//   "has", "have", "had", "will", "would", "can", "could", "should", "may",
//   "might", "do", "does", "did", "not", "we", "you", "our", "your", "they",
//   "their", "this", "that", "it", "its", "as", "if", "so", "up", "out",
//   "about", "into", "than", "then", "also", "both", "each", "more", "most",
//   "other", "some", "such", "no", "nor", "only", "own", "same", "too",
//   "very", "just", "any", "all", "how", "when", "who", "which", "what",
//   "use", "used", "using", "well", "new", "get", "make", "work", "works",
// ]);

// /* ─────────────────────────────────────────
//    SCORING WEIGHTS  (must sum to 100)
// ───────────────────────────────────────── */
// const WEIGHTS = {
//   keywordMatch:   40,   // how well resume keywords match JD keywords
//   sectionQuality: 30,   // presence + content quality of key sections
//   experienceDepth: 15,  // richness of experience section
//   educationMatch:  10,  // education section present and relevant
//   formattingBonus:  5,  // structural signals (quantified achievements, etc.)
// };

// /* ─────────────────────────────────────────
//    SECTION WEIGHTS inside sectionQuality
// ───────────────────────────────────────── */
// const SECTION_SCORES = {
//   skills:     { weight: 40, label: "Skills" },
//   experience: { weight: 35, label: "Experience" },
//   projects:   { weight: 15, label: "Projects" },
//   education:  { weight: 10, label: "Education" },
// };

// /* ─────────────────────────────────────────
//    HELPERS
// ───────────────────────────────────────── */

// /** Naive stemmer — strips common English suffixes for fuzzy matching */
// function stem(word) {
//   return word
//     .replace(/ing$/, "")
//     .replace(/tion$/, "")
//     .replace(/tions$/, "")
//     .replace(/ities$/, "ity")
//     .replace(/ies$/, "y")
//     .replace(/ers?$/, "")
//     .replace(/ment$/, "")
//     .replace(/s$/, "");
// }

// /** Tokenize text into meaningful words — removes punctuation, stop words, short tokens */
// function tokenize(text) {
//   return text
//     .toLowerCase()
//     .replace(/[^a-z0-9\s+#]/g, " ")   // keep + and # (C++, C#)
//     .split(/\s+/)
//     .filter(w => w.length > 2 && !STOP_WORDS.has(w));
// }

// /** Extract meaningful multi-word phrases (bigrams) from a token list */
// function bigrams(tokens) {
//   const pairs = [];
//   for (let i = 0; i < tokens.length - 1; i++) {
//     pairs.push(`${tokens[i]} ${tokens[i + 1]}`);
//   }
//   return pairs;
// }

// /** Check if a keyword exists in resume text — exact token or stemmed match */
// function keywordFound(keyword, resumeTokens, resumeStems) {
//   const kwTokens = tokenize(keyword);
//   if (kwTokens.length === 0) return false;

//   if (kwTokens.length === 1) {
//     // Single word: exact token match OR stemmed match
//     return resumeTokens.includes(kwTokens[0]) || resumeStems.includes(stem(kwTokens[0]));
//   }

//   // Multi-word phrase: look for the phrase as a substring in the original text
//   return false; // handled separately via phrase matching
// }

// /** Deduplicate and sort an array of strings */
// function dedupe(arr) {
//   return [...new Set(arr)].sort();
// }

// /* ─────────────────────────────────────────
//    SCORE COMPONENTS
// ───────────────────────────────────────── */

// /**
//  * Keyword match score (0–100 internally, scaled to WEIGHTS.keywordMatch)
//  * Returns matched/missing arrays and the raw ratio.
//  */
// function scoreKeywords(jdTokens, jdBigrams, resumeText, resumeTokens, resumeStems) {
//   const matched = [];
//   const missing = [];

//   // Score single keywords
//   const uniqueJdTokens = dedupe(jdTokens);
//   uniqueJdTokens.forEach(kw => {
//     if (resumeTokens.includes(kw) || resumeStems.includes(stem(kw))) {
//       matched.push(kw);
//     } else {
//       missing.push(kw);
//     }
//   });

//   // Score bigrams (phrases like "machine learning", "project management")
//   const uniqueBigrams = dedupe(jdBigrams);
//   uniqueBigrams.forEach(phrase => {
//     if (resumeText.includes(phrase)) {
//       // Phrase match is a strong signal — add if not already covered
//       if (!matched.includes(phrase)) matched.push(phrase);
//     }
//   });

//   const total = uniqueJdTokens.length;
//   const ratio = total > 0 ? matched.length / total : 0;

//   return { matched: dedupe(matched), missing: dedupe(missing), ratio };
// }

// /**
//  * Section quality score (0–100 internally, scaled to WEIGHTS.sectionQuality)
//  * Rewards presence AND non-trivial content length.
//  */
// function scoreSections(sections) {
//   let earned = 0;
//   const breakdown = {};

//   for (const [key, { weight, label }] of Object.entries(SECTION_SCORES)) {
//     const content = (sections[key] || "").trim();
//     const present = content.length > 0;
//     const substantial = content.length > 100; // has real content, not just a heading

//     const sectionScore = present ? (substantial ? weight : weight * 0.5) : 0;
//     earned += sectionScore;
//     breakdown[label] = { present, score: Math.round(sectionScore), max: weight };
//   }

//   return { ratio: earned / 100, breakdown };
// }

// /**
//  * Experience depth score (0–100 internally, scaled to WEIGHTS.experienceDepth)
//  * Looks for quantified achievements (numbers, %, $) and action verbs.
//  */
// function scoreExperienceDepth(sections) {
//   const text = (sections.experience || "").toLowerCase();
//   if (!text) return 0;

//   const hasNumbers    = /\d+/.test(text);
//   const hasPercents   = /%/.test(text);
//   const hasDollar     = /\$/.test(text);
//   const actionVerbs   = ["led", "built", "designed", "improved", "increased", "reduced",
//                          "managed", "developed", "delivered", "launched", "architected",
//                          "optimized", "mentored", "automated", "integrated", "scaled"];
//   const verbCount     = actionVerbs.filter(v => text.includes(v)).length;

//   let score = 0;
//   if (hasNumbers)  score += 30;
//   if (hasPercents) score += 25;
//   if (hasDollar)   score += 15;
//   score += Math.min(30, verbCount * 6); // up to 30 pts from action verbs

//   return Math.min(100, score);
// }

// /**
//  * Education match score (0–100 internally, scaled to WEIGHTS.educationMatch)
//  */
// function scoreEducation(sections) {
//   const text = (sections.education || "").toLowerCase();
//   if (!text) return 0;

//   const degrees = ["bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e",
//                    "b.sc", "m.sc", "mba", "associate", "diploma"];
//   const hasDegree = degrees.some(d => text.includes(d));
//   return hasDegree ? 100 : 50; // has education section but degree not detected
// }

// /**
//  * Formatting bonus score (0–100 internally, scaled to WEIGHTS.formattingBonus)
//  */
// function scoreFormatting(sections) {
//   const fullText = Object.values(sections).join(" ").toLowerCase();
//   let score = 0;

//   if (/\d+/.test(fullText))           score += 40; // numbers present
//   if (/github|linkedin|portfolio/i.test(fullText)) score += 30; // links
//   if (/\bcertif/i.test(fullText))      score += 30; // certifications

//   return Math.min(100, score);
// }

// /* ─────────────────────────────────────────
//    SUGGESTIONS ENGINE
// ───────────────────────────────────────── */
// function buildSuggestions(sections, missing, sectionBreakdown, experienceRatio) {
//   const suggestions = [];

//   // High priority — structural gaps
//   if (!sections.skills || sections.skills.trim().length < 50) {
//     suggestions.push({
//       priority: "high",
//       text: "Add or expand your Skills section — ATS systems heavily weight this section.",
//     });
//   }

//   if (!sections.experience || sections.experience.trim().length < 100) {
//     suggestions.push({
//       priority: "high",
//       text: "Your Experience section is missing or too brief. Add roles with responsibilities and achievements.",
//     });
//   }

//   // High priority — missing keywords
//   if (missing.length > 0) {
//     const top = missing.slice(0, 6).join(", ");
//     suggestions.push({
//       priority: "high",
//       text: `Add these missing keywords from the job description: ${top}.`,
//     });
//   }

//   // Medium priority — experience quality
//   if (experienceRatio < 0.5 && sections.experience) {
//     suggestions.push({
//       priority: "medium",
//       text: "Strengthen your experience with quantified achievements — use numbers, percentages, or dollar amounts (e.g. 'Reduced load time by 40%').",
//     });
//   }

//   if (!sections.projects) {
//     suggestions.push({
//       priority: "medium",
//       text: "Add a Projects section to showcase hands-on work, especially if you have limited experience.",
//     });
//   }

//   if (!sections.education || sections.education.trim().length < 30) {
//     suggestions.push({
//       priority: "medium",
//       text: "Add an Education section with your degree, institution, and graduation year.",
//     });
//   }

//   // Low priority — polish
//   const fullText = Object.values(sections).join(" ");
//   if (!/github|linkedin/i.test(fullText)) {
//     suggestions.push({
//       priority: "low",
//       text: "Include links to your GitHub and LinkedIn profile — many ATS systems and recruiters look for these.",
//     });
//   }

//   if (!/certif/i.test(fullText)) {
//     suggestions.push({
//       priority: "low",
//       text: "Consider adding certifications relevant to the role to strengthen your profile.",
//     });
//   }

//   return suggestions;
// }

// /* ─────────────────────────────────────────
//    CATEGORY COVERAGE (for frontend chart)
// ───────────────────────────────────────── */
// function buildCategories(jdTokens, resumeTokens, resumeStems, sections) {
//   // Split JD tokens into rough categories by checking against section content
//   const skillsText   = tokenize(sections.skills || "");
//   const expText      = tokenize(sections.experience || "");
//   const projText     = tokenize(sections.projects || "");

//   function coverageScore(sectionTokens) {
//     if (jdTokens.length === 0) return 0;
//     const hits = jdTokens.filter(kw =>
//       sectionTokens.includes(kw) || sectionTokens.includes(stem(kw))
//     ).length;
//     return Math.round((hits / jdTokens.length) * 100);
//   }

//   return [
//     { name: "Technical Skills",    score: coverageScore(skillsText) },
//     { name: "Experience Keywords", score: coverageScore(expText) },
//     { name: "Project Relevance",   score: coverageScore(projText) },
//     { name: "Overall Vocabulary",  score: Math.round((resumeTokens.filter(t => jdTokens.includes(t)).length / Math.max(jdTokens.length, 1)) * 100) },
//   ];
// }

// /* ─────────────────────────────────────────
//    MAIN EXPORT
// ───────────────────────────────────────── */
// const analyzeResume = (sections, jobDescription) => {
//   if (!sections || typeof sections !== "object") {
//     throw new Error("analyzeResume: sections must be an object.");
//   }
//   if (!jobDescription || typeof jobDescription !== "string") {
//     throw new Error("analyzeResume: jobDescription must be a non-empty string.");
//   }

//   // ── Tokenize ──────────────────────────────
//   const jdTokens     = tokenize(jobDescription);
//   const jdBigrams    = bigrams(jdTokens);
//   const resumeText   = Object.values(sections).join(" ").toLowerCase();
//   const resumeTokens = tokenize(resumeText);
//   const resumeStems  = resumeTokens.map(stem);

//   // ── Score each dimension ──────────────────
//   const { matched, missing, ratio: kwRatio }   = scoreKeywords(jdTokens, jdBigrams, resumeText, resumeTokens, resumeStems);
//   const { ratio: secRatio, breakdown }          = scoreSections(sections);
//   const expDepthRatio                           = scoreExperienceDepth(sections) / 100;
//   const eduRatio                                = scoreEducation(sections) / 100;
//   const fmtRatio                                = scoreFormatting(sections) / 100;

//   // ── Weighted final score ──────────────────
//   const rawScore =
//     kwRatio      * WEIGHTS.keywordMatch    +
//     secRatio     * WEIGHTS.sectionQuality  +
//     expDepthRatio* WEIGHTS.experienceDepth +
//     eduRatio     * WEIGHTS.educationMatch  +
//     fmtRatio     * WEIGHTS.formattingBonus;

//   const atsScore = Math.min(100, Math.round(rawScore));

//   // ── Suggestions + categories ──────────────
//   const suggestions = buildSuggestions(sections, missing, breakdown, expDepthRatio);
//   const categories  = buildCategories(jdTokens, resumeTokens, resumeStems, sections);

//   return {
//     atsScore,
//     matchedKeywords: matched,
//     missingKeywords: missing,
//     suggestions,
//     categories,
//     breakdown,   // per-section scores, useful for debugging
//   };
// };

// module.exports = { analyzeResume };





/**
 * utils/atsScorer.js
 */

/* ─────────────────────────────────────────
   STOP WORDS
   Covers: articles, prepositions, conjunctions, pronouns,
   auxiliaries, AND common JD filler words that are not skills.
───────────────────────────────────────── */
const STOP_WORDS = new Set([
  // Grammar basics
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "will", "would", "can", "could", "should", "may",
  "might", "do", "does", "did", "not", "we", "you", "our", "your", "they",
  "their", "this", "that", "it", "its", "as", "if", "so", "up", "out",
  "about", "into", "than", "then", "also", "both", "each", "more", "most",
  "other", "some", "such", "no", "nor", "only", "own", "same", "too",
  "very", "just", "any", "all", "how", "when", "who", "which", "what",
  "use", "used", "using", "well", "new", "get", "make", "work", "works",
  "they", "them", "these", "those", "him", "her", "his", "she", "his",
  "between", "through", "during", "before", "after", "above", "below",
  "while", "where", "there", "here", "being", "having", "since", "until",
  "within", "without", "across", "along", "around", "including",

  // JD filler — adjectives and adverbs that carry no skill signal
  "able", "basic", "good", "great", "excellent", "strong", "solid",
  "smooth", "friendly", "clean", "clear", "fast", "quick", "simple",
  "effective", "efficient", "reliable", "scalable", "robust", "modern",
  "high", "low", "large", "small", "multiple", "various", "different",
  "specific", "general", "overall", "proper", "key", "core", "main",
  "best", "ideal", "must", "plus", "bonus", "preferred", "desired",

  // JD filler — nouns that describe a candidate, not a skill
  "candidate", "applicant", "hire", "employee", "member", "person",
  "individual", "professional", "developer", "engineer", "designer",
  "manager", "lead", "senior", "junior", "mid", "level", "role",
  "position", "team", "company", "organization", "startup", "firm",
  "client", "customer", "user", "users", "product", "service", "project",
  "projects", "task", "tasks", "issue", "issues", "feature", "features",
  "requirement", "requirements", "solution", "solutions",

  // JD filler — verbs that describe responsibilities, not skills
  "responsible", "required", "looking", "seeking", "hiring", "join",
  "help", "assist", "support", "ensure", "maintain", "maintaining",
  "handle", "manage", "provide", "create", "write", "read", "review",
  "follow", "learn", "understand", "communicate", "collaborate", "work",
  "deliver", "contribute", "participate", "engage", "interact",
  "interface", "integrate", "integration", "maintain", "update",
  "implement", "build", "develop", "design", "test", "deploy",

  // Misc
  "knowledge", "experience", "understanding", "familiarity", "exposure",
  "background", "skill", "skills", "ability", "proficiency", "expertise",
  "years", "year", "months", "month", "time", "day", "days",
  "including", "related", "relevant", "similar", "etc", "eg", "ie",
  "version", "control", "ensure", "smooth", "user", "friendly",
]);

/* ─────────────────────────────────────────
   TECHNICAL SKILL SIGNALS
   Only these token patterns are shown as "meaningful keywords"
   in the matched/missing lists and suggestions.
───────────────────────────────────────── */
const KNOWN_TECH_TERMS = new Set([
  // Languages
  "javascript", "typescript", "python", "java", "golang", "go", "rust",
  "kotlin", "swift", "php", "ruby", "scala", "elixir", "dart", "c",
  "cpp", "csharp", "html", "css", "sql", "bash", "shell", "r",

  // Frontend
  "react", "angular", "vue", "nextjs", "nuxtjs", "svelte", "redux",
  "webpack", "vite", "tailwind", "bootstrap", "sass", "scss", "jquery",
  "graphql", "apollo", "storybook", "jest", "cypress", "playwright",

  // Backend
  "node", "nodejs", "express", "fastapi", "django", "flask", "spring",
  "rails", "laravel", "nestjs", "hapi", "koa", "fiber", "gin",
  "grpc", "rest", "restful", "websocket", "oauth", "jwt",

  // Databases
  "mongodb", "mysql", "postgresql", "postgres", "sqlite", "redis",
  "elasticsearch", "cassandra", "dynamodb", "firebase", "supabase",
  "prisma", "sequelize", "mongoose", "typeorm",

  // Cloud / DevOps
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
  "jenkins", "github", "gitlab", "bitbucket", "ci", "cd", "cicd",
  "nginx", "apache", "linux", "unix", "vercel", "netlify", "heroku",
  "cloudflare", "s3", "ec2", "lambda", "serverless",

  // Tools / Practices
  "git", "npm", "yarn", "pnpm", "figma", "postman", "swagger",
  "jira", "confluence", "trello", "slack", "notion",
  "agile", "scrum", "kanban", "tdd", "bdd", "mvc", "solid",
  "microservices", "monolith", "api", "apis", "sdk", "cli",

  // Data / ML
  "pandas", "numpy", "tensorflow", "pytorch", "sklearn", "opencv",
  "tableau", "powerbi", "hadoop", "spark", "kafka", "airflow",

  // Mobile
  "reactnative", "flutter", "android", "ios", "expo",

  // Stacks / acronyms
  "mern", "mean", "lamp", "jamstack", "pwa", "spa", "ssr", "ssg",
]);

/* ─────────────────────────────────────────
   SCORING WEIGHTS  (sum = 100)
───────────────────────────────────────── */
const WEIGHTS = {
  keywordMatch:    40,
  sectionQuality:  30,
  experienceDepth: 15,
  educationMatch:  10,
  formattingBonus:  5,
};

const SECTION_SCORES = {
  skills:     { weight: 40, label: "Skills" },
  experience: { weight: 35, label: "Experience" },
  projects:   { weight: 15, label: "Projects" },
  education:  { weight: 10, label: "Education" },
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
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

/** Tokenize — removes punctuation, stop words, short tokens */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/** Extract bigrams (two-word phrases) */
function bigrams(tokens) {
  const pairs = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    pairs.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return pairs;
}

function dedupe(arr) {
  return [...new Set(arr)].sort();
}

/**
 * Decide if a token is a meaningful technical/skill keyword.
 * Accepts: known tech terms OR tokens that look like tech (contain digits,
 * dots, plus signs — e.g. "es6", "node18", "c++", "react18").
 */
function isMeaningfulKeyword(token) {
  if (KNOWN_TECH_TERMS.has(token)) return true;
  // Looks like a tech term: has digits, dots, #, +
  if (/[0-9.#+]/.test(token)) return true;
  // Longer compound words are more likely to be real skills
  if (token.length >= 6 && !STOP_WORDS.has(token)) return true;
  return false;
}

/* ─────────────────────────────────────────
   SCORE COMPONENTS
───────────────────────────────────────── */
function scoreKeywords(jdTokens, jdBigrams, resumeText, resumeTokens, resumeStems) {
  const matched = [];
  const missing = [];

  // Only score tokens that are meaningful skill/tech keywords
  const meaningfulJdTokens = dedupe(jdTokens).filter(isMeaningfulKeyword);
  // console.log("Missing after filter:", missing);
  // console.log("All JD tokens:", dedupe(jdTokens));
  // console.log("Meaningful JD tokens only:", meaningfulJdTokens);

  meaningfulJdTokens.forEach(kw => {
    if (resumeTokens.includes(kw) || resumeStems.includes(stem(kw))) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  // Bigrams: only include if both words are meaningful
  dedupe(jdBigrams).forEach(phrase => {
    const words = phrase.split(" ");
    if (!words.every(isMeaningfulKeyword)) return;
    if (resumeText.includes(phrase) && !matched.includes(phrase)) {
      matched.push(phrase);
    }
  });

  const total = meaningfulJdTokens.length;
  const ratio = total > 0 ? matched.length / total : 0;
  // console.log("Final matched:", matched);
  // console.log("Final missing:", missing);

  return {
    matched: dedupe(matched),
    missing: dedupe(missing),
    ratio,
  };
}

function scoreSections(sections) {
  let earned = 0;
  const breakdown = {};

  for (const [key, { weight, label }] of Object.entries(SECTION_SCORES)) {
    const content     = (sections[key] || "").trim();
    const present     = content.length > 0;
    const substantial = content.length > 100;
    const sectionScore = present ? (substantial ? weight : weight * 0.5) : 0;
    earned += sectionScore;
    breakdown[label] = { present, score: Math.round(sectionScore), max: weight };
  }

  return { ratio: earned / 100, breakdown };
}

function scoreExperienceDepth(sections) {
  const text = (sections.experience || "").toLowerCase();
  if (!text) return 0;

  const hasNumbers  = /\d+/.test(text);
  const hasPercents = /%/.test(text);
  const hasDollar   = /\$/.test(text);
  const actionVerbs = [
    "led", "built", "designed", "improved", "increased", "reduced",
    "managed", "developed", "delivered", "launched", "architected",
    "optimized", "mentored", "automated", "integrated", "scaled",
    "created", "implemented", "deployed", "maintained", "collaborated",
  ];
  const verbCount = actionVerbs.filter(v => text.includes(v)).length;

  let score = 0;
  if (hasNumbers)  score += 30;
  if (hasPercents) score += 25;
  if (hasDollar)   score += 15;
  score += Math.min(30, verbCount * 6);

  return Math.min(100, score);
}

function scoreEducation(sections) {
  const text = (sections.education || "").toLowerCase();
  if (!text) return 0;
  const degrees = [
    "bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e",
    "b.sc", "m.sc", "mba", "associate", "diploma", "degree",
  ];
  return degrees.some(d => text.includes(d)) ? 100 : 50;
}

function scoreFormatting(sections) {
  const fullText = Object.values(sections).join(" ").toLowerCase();
  let score = 0;
  if (/\d+/.test(fullText))                        score += 40;
  if (/github|linkedin|portfolio/i.test(fullText)) score += 30;
  if (/\bcertif/i.test(fullText))                  score += 30;
  return Math.min(100, score);
}

/* ─────────────────────────────────────────
   SUGGESTIONS ENGINE
───────────────────────────────────────── */
function buildSuggestions(sections, missing, breakdown, experienceRatio, jdTokens, atsScore) {
  const suggestions = [];
  const fullText    = Object.values(sections).join(" ").toLowerCase();

  // ── HIGH ───────────────────────────────

  const skillsLen = (sections.skills || "").trim().length;
  if (skillsLen === 0) {
    suggestions.push({
      priority: "high", category: "Structure",
      text: "Add a dedicated Skills section. ATS systems heavily weight this — list tools, languages, and frameworks relevant to the job.",
    });
  } else if (skillsLen < 50) {
    suggestions.push({
      priority: "high", category: "Structure",
      text: "Your Skills section is too brief. Expand it with specific technologies — aim for at least 8–12 relevant skills.",
    });
  }

  const expLen = (sections.experience || "").trim().length;
  if (expLen === 0) {
    suggestions.push({
      priority: "high", category: "Structure",
      text: "Add an Experience section. Even internships or freelance work counts — describe your responsibilities and impact.",
    });
  } else if (expLen < 100) {
    suggestions.push({
      priority: "high", category: "Structure",
      text: "Your Experience section is too short. Add more detail to each role — what you built, managed, or improved.",
    });
  }

  // Only show real technical keywords as missing — filter again for safety
  const realMissing = missing.filter(isMeaningfulKeyword);
  if (realMissing.length > 0) {
    const top = realMissing.slice(0, 6).join(", ");
    suggestions.push({
      priority: "high", category: "Keywords",
      text: `Add these missing technical keywords to your resume: ${top}. Include them naturally in your Skills or Experience sections.`,
    });
  }

  if (atsScore < 35) {
    suggestions.push({
      priority: "high", category: "Overall",
      text: "Your ATS score is low. Tailor this resume specifically for the role — rewrite your summary and skills to mirror the job description's exact language and tech stack.",
    });
  }

  // ── MEDIUM ─────────────────────────────

  if (expLen > 100 && experienceRatio < 0.5) {
    suggestions.push({
      priority: "medium", category: "Impact",
      text: "Add measurable results — e.g. 'Reduced load time by 40%', 'Managed a team of 5'. Numbers make both ATS and recruiters take notice.",
    });
  }

  const expText    = (sections.experience || "").toLowerCase();
  const actionVerbs = ["led", "built", "designed", "improved", "increased", "reduced",
    "managed", "developed", "delivered", "launched", "optimized", "automated"];
  const verbCount  = actionVerbs.filter(v => expText.includes(v)).length;
  if (expLen > 50 && verbCount < 2) {
    suggestions.push({
      priority: "medium", category: "Impact",
      text: "Start bullet points with strong action verbs: 'Built', 'Led', 'Optimized', 'Automated'. Weak openers like 'Responsible for' reduce ATS scoring.",
    });
  }

  if (!sections.projects || sections.projects.trim().length < 30) {
    suggestions.push({
      priority: "medium", category: "Structure",
      text: "Add a Projects section. Include the tech stack used and what problem each project solved — this is heavily weighted for developer roles.",
    });
  }

  if (!sections.education || sections.education.trim().length < 30) {
    suggestions.push({
      priority: "medium", category: "Structure",
      text: "Add an Education section with your degree name, institution, and graduation year.",
    });
  }

  if (realMissing.length > 8) {
    suggestions.push({
      priority: "medium", category: "Keywords",
      text: `${realMissing.length} technical keywords from the job description are missing. Consider tailoring this resume specifically for this role rather than using a generic version.`,
    });
  }

  // ── LOW ────────────────────────────────

  if (!/github/i.test(fullText)) {
    suggestions.push({
      priority: "low", category: "Polish",
      text: "Add your GitHub profile link. For technical roles, recruiters and ATS systems look for this as a signal of active development.",
    });
  }

  if (!/linkedin/i.test(fullText)) {
    suggestions.push({
      priority: "low", category: "Polish",
      text: "Add your LinkedIn profile URL. Many ATS platforms cross-reference LinkedIn profiles.",
    });
  }

  if (!/certif/i.test(fullText)) {
    suggestions.push({
      priority: "low", category: "Polish",
      text: "Consider adding certifications (AWS, Google, Microsoft, or relevant course completions). They strengthen keyword matching.",
    });
  }

  if (!sections.summary && !sections.objective) {
    suggestions.push({
      priority: "low", category: "Polish",
      text: "Add a 2–3 line professional summary at the top. Use keywords from the job description — ATS systems scan this section first.",
    });
  }

  if (atsScore >= 55 && atsScore < 75) {
    suggestions.push({
      priority: "low", category: "Overall",
      text: "You're close to a strong match. Incorporate 3–5 more missing technical keywords into your existing bullet points to push your score higher.",
    });
  }

  return suggestions;
}

/* ─────────────────────────────────────────
   CATEGORY COVERAGE
───────────────────────────────────────── */
function buildCategories(jdTokens, resumeTokens, resumeStems, sections) {
  // Only measure coverage against meaningful keywords
  const meaningfulJdTokens = jdTokens.filter(isMeaningfulKeyword);

  const skillsText = tokenize(sections.skills || "");
  const expText    = tokenize(sections.experience || "");
  const projText   = tokenize(sections.projects || "");

  function coverageScore(sectionTokens) {
    if (meaningfulJdTokens.length === 0) return 0;
    const hits = meaningfulJdTokens.filter(kw =>
      sectionTokens.includes(kw) || sectionTokens.includes(stem(kw))
    ).length;
    return Math.round((hits / meaningfulJdTokens.length) * 100);
  }

  return [
    { name: "Technical Skills",    score: coverageScore(skillsText) },
    { name: "Experience Keywords", score: coverageScore(expText) },
    { name: "Project Relevance",   score: coverageScore(projText) },
    {
      name: "Overall Vocabulary",
      score: Math.round(
        (resumeTokens.filter(t => meaningfulJdTokens.includes(t)).length /
          Math.max(meaningfulJdTokens.length, 1)) * 100
      ),
    },
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

  const jdTokens     = tokenize(jobDescription);
  const jdBigramList = bigrams(jdTokens);
  const resumeText   = Object.values(sections).join(" ").toLowerCase();
  const resumeTokens = tokenize(resumeText);
  const resumeStems  = resumeTokens.map(stem);

  const { matched, missing, ratio: kwRatio } = scoreKeywords(jdTokens, jdBigramList, resumeText, resumeTokens, resumeStems);
  const { ratio: secRatio, breakdown }        = scoreSections(sections);
  const expDepthRatio                         = scoreExperienceDepth(sections) / 100;
  const eduRatio                              = scoreEducation(sections) / 100;
  const fmtRatio                              = scoreFormatting(sections) / 100;

  const rawScore =
    kwRatio       * WEIGHTS.keywordMatch    +
    secRatio      * WEIGHTS.sectionQuality  +
    expDepthRatio * WEIGHTS.experienceDepth +
    eduRatio      * WEIGHTS.educationMatch  +
    fmtRatio      * WEIGHTS.formattingBonus;

  const atsScore = Math.min(100, Math.round(rawScore));

  const suggestions = buildSuggestions(sections, missing, breakdown, expDepthRatio, jdTokens, atsScore);
  const categories  = buildCategories(jdTokens, resumeTokens, resumeStems, sections);

  return {
    atsScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    suggestions,
    categories,
    breakdown,
  };
};

module.exports = { analyzeResume };