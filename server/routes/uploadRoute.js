const express = require("express");
const router = express.Router();
const fs = require("fs");

const upload = require("../middleware/upload");
const { parsePDF } = require("../utils/parser");
const { cleanText } = require("../utils/textCleaner");
const { extractSections } = require("../utils/sectionExtractor");
const { analyzeResume } = require("../utils/atsScorer");

const MIN_JD_LENGTH = 30;
const MIN_TEXT_LENGTH = 50;

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.warn(`[cleanup] Could not delete ${filePath}:`, err.message);
  });
}

router.post("/", upload.single("resume"), async (req, res) => {
  const filePath = req.file?.path;

  try {
    // 1. File validation
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    if (req.file.mimetype !== "application/pdf") {
      deleteFile(filePath);
      return res.status(415).json({ error: "Only PDF files are supported." });
    }

    // 2. Job description validation
    const jobDescription = (req.body.jobDescription || "").trim();

    if (jobDescription.length < MIN_JD_LENGTH) {
      deleteFile(filePath);
      return res.status(400).json({
        error: `Job description is too short. Please provide at least ${MIN_JD_LENGTH} characters.`,
      });
    }

    // 3. Parse PDF
    let rawText;
    try {
      rawText = await parsePDF(filePath);
    } catch (parseErr) {
      deleteFile(filePath);
      return res.status(422).json({
        error: "Could not extract text from this PDF. Make sure it is not scanned or image-based.",
      });
    }

    // 4. Guard against empty/image-only PDFs
    if (!rawText || rawText.trim().length < MIN_TEXT_LENGTH) {
      deleteFile(filePath);
      return res.status(422).json({
        error: "The resume appears to be empty or image-based. Please upload a text-selectable PDF.",
      });
    }

    // 5. Clean text + extract sections
    const cleanedText = cleanText(rawText);
    const sections = extractSections(cleanedText);

    // 6. Analyze
    const result = analyzeResume(sections, jobDescription);

    // 7. Cleanup + respond
    deleteFile(filePath);

    return res.status(200).json({
      message: "Analysis complete.",
      ...result,
    });

  } catch (error) {
    if (filePath) deleteFile(filePath);
    console.error("[/api/resume] Unexpected error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;