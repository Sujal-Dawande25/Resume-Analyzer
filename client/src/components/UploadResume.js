import React, { useState, useRef, useEffect } from "react";
import { uploadResume } from "../services/api";

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #f5f3ef;
    --surface:    #ffffff;
    --surface2:   #f9f8f6;
    --surface3:   #f0ede8;
    --border:     #e5e1da;
    --border2:    #d4cfc6;
    --text:       #1a1814;
    --text2:      #4a4740;
    --muted:      #9b958a;
    --accent:     #2a5cff;
    --accent-bg:  #eef1ff;
    --accent2:    #7c3aed;
    --green:      #16a34a;
    --green-bg:   #f0fdf4;
    --green-bd:   #bbf7d0;
    --red:        #dc2626;
    --red-bg:     #fef2f2;
    --red-bd:     #fecaca;
    --yellow:     #d97706;
    --yellow-bg:  #fffbeb;
    --yellow-bd:  #fde68a;
    --font-body:  'DM Sans', system-ui, sans-serif;
    --font-serif: 'DM Serif Display', Georgia, serif;
    --font-mono:  'DM Mono', monospace;
    --radius:     14px;
    --shadow-sm:  0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md:  0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
    --shadow-lg:  0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05);
  }

  body { background: var(--bg); font-family: var(--font-body); color: var(--text); }

  /* ── ROOT ── */
  .root {
    min-height: 100vh;
    background: var(--bg);
    padding: 48px 16px 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Subtle dot grid */
  .root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, #c9c3b8 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.35;
    pointer-events: none; z-index: 0;
  }

  .root > * { position: relative; z-index: 1; }

  /* ── HEADER ── */
  .hd {
    text-align: center;
    margin-bottom: 44px;
    animation: fadeUp 0.55s ease both;
  }

  .hd-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: var(--font-mono);
    font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
    padding: 5px 14px;
    border: 1px solid rgba(42,92,255,0.2);
    border-radius: 100px;
    background: var(--accent-bg);
  }

  .hd-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent);
    animation: blink 2s ease infinite;
  }

  .hd-title {
    font-family: var(--font-serif);
    font-size: clamp(36px, 6vw, 60px);
    font-weight: 400;
    color: var(--text);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin-bottom: 10px;
  }

  .hd-title em {
    font-style: italic;
    color: var(--accent);
  }

  .hd-sub {
    font-size: 15px; font-weight: 300;
    color: var(--muted);
    letter-spacing: 0.01em;
  }

  /* ── LAYOUT ── */
  .layout {
    width: 100%;
    max-width: 1060px;
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 20px;
    align-items: start;
    animation: fadeUp 0.55s ease both 0.1s;
  }

  @media (max-width: 820px) {
    .layout { grid-template-columns: 1fr; }
    .right-col { display: none; }
    .layout.has-result .right-col { display: block; }
    .layout.has-result .left-col { display: none; }
  }

  /* ── CARDS ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }

  .card-header {
    padding: 20px 24px 0;
    display: flex; align-items: center; gap: 10px;
  }

  .card-header-icon {
    width: 34px; height: 34px;
    border-radius: 9px;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }

  .card-header-title {
    font-size: 14px; font-weight: 600; color: var(--text);
  }

  .card-header-sub {
    font-size: 12px; color: var(--muted); font-weight: 400;
  }

  .card-body { padding: 20px 24px 24px; }

  /* ── FORM ELEMENTS ── */
  .field { margin-bottom: 20px; }
  .field:last-child { margin-bottom: 0; }

  .label {
    font-family: var(--font-mono);
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px;
    display: block;
  }

  .textarea {
    width: 100%;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: 11px;
    padding: 14px 16px;
    color: var(--text);
    font-family: var(--font-body);
    font-size: 13.5px; font-weight: 300;
    line-height: 1.7; resize: none; outline: none;
    min-height: 148px;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }

  .textarea::placeholder { color: var(--muted); opacity: 0.7; }

  .textarea:focus {
    border-color: rgba(42,92,255,0.45);
    box-shadow: 0 0 0 3px rgba(42,92,255,0.07);
    background: #fff;
  }

  /* Char row */
  .char-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 7px;
    font-family: var(--font-mono); font-size: 11px; color: var(--muted);
  }

  .char-ok { color: var(--green); font-weight: 500; }

  .char-track {
    height: 2px; border-radius: 2px;
    background: var(--border);
    margin-top: 5px; overflow: hidden;
  }

  .char-fill {
    height: 100%; border-radius: 2px;
    background: var(--accent);
    transition: width 0.25s;
  }

  /* ── DROP ZONE ── */
  .dropzone {
    border: 1.5px dashed var(--border2);
    border-radius: 12px;
    padding: 28px 20px;
    text-align: center; cursor: pointer;
    transition: all 0.2s;
    background: var(--surface2);
    position: relative; overflow: hidden;
  }

  .dropzone:hover, .dropzone.over {
    border-color: rgba(42,92,255,0.4);
    background: var(--accent-bg);
  }

  .dropzone input[type="file"] {
    position: absolute; inset: 0;
    opacity: 0; cursor: pointer; z-index: 2;
  }

  .dz-icon {
    width: 44px; height: 44px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 10px;
    font-size: 20px;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s;
  }

  .dropzone:hover .dz-icon { transform: translateY(-2px); }

  .dz-title {
    font-size: 13.5px; font-weight: 600; color: var(--text);
    margin-bottom: 3px;
  }

  .dz-sub { font-size: 11.5px; color: var(--muted); }

  .dz-chosen {
    display: inline-flex; align-items: center; gap: 7px;
    margin-top: 12px;
    background: var(--green-bg);
    border: 1px solid var(--green-bd);
    border-radius: 8px;
    padding: 7px 12px;
    font-size: 12px; font-weight: 500; color: var(--green);
  }

  /* ── BUTTON ── */
  .btn {
    width: 100%; padding: 15px;
    border: none; border-radius: 11px; cursor: pointer;
    font-family: var(--font-body);
    font-size: 14px; font-weight: 600; letter-spacing: 0.01em;
    background: var(--text);
    color: #fff;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    transition: opacity 0.2s, transform 0.18s, box-shadow 0.2s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.18);
  }

  .btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
  }

  .btn:active:not(:disabled) { transform: translateY(0); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  /* ── RIGHT COLUMN / RESULTS ── */
  .right-col { display: flex; flex-direction: column; gap: 16px; }

  /* ── SCORE CARD ── */
  .score-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: var(--shadow-md);
    padding: 24px;
    animation: fadeUp 0.45s ease both;
  }

  .score-top {
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 20px;
  }

  .score-ring-wrap {
    position: relative; width: 90px; height: 90px; flex-shrink: 0;
  }

  .score-ring-wrap svg { transform: rotate(-90deg); }

  .score-ring-num {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: var(--font-serif);
    font-size: 26px; font-weight: 400;
    color: var(--text); line-height: 1;
  }

  .score-ring-num span {
    font-family: var(--font-mono);
    font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); font-style: normal; margin-top: 2px;
  }

  .score-right { flex: 1; }

  .score-grade {
    font-size: 17px; font-weight: 700; margin-bottom: 3px;
  }

  .score-desc {
    font-size: 12.5px; color: var(--muted); font-weight: 300; line-height: 1.5;
    margin-bottom: 10px;
  }

  .score-bar-track {
    height: 5px; border-radius: 5px;
    background: var(--border);
    overflow: hidden;
  }

  .score-bar-fill {
    height: 100%; border-radius: 5px;
    transition: width 1.6s cubic-bezier(0.4,0,0.2,1);
  }

  /* ── MINI STATS ── */
  .mini-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .mini-stat {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 10px;
    text-align: center;
  }

  .mini-stat-val {
    font-family: var(--font-serif);
    font-size: 26px; color: var(--text);
    line-height: 1; margin-bottom: 3px;
  }

  .mini-stat-lbl {
    font-family: var(--font-mono);
    font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted);
  }

  /* ── TABS ── */
  .tabs-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: var(--shadow-md);
    overflow: hidden;
    animation: fadeUp 0.45s ease both 0.07s;
  }

  .tabs {
    display: flex; gap: 0;
    border-bottom: 1px solid var(--border);
    padding: 0 4px;
  }

  .tab {
    padding: 13px 14px;
    font-size: 13px; font-weight: 500; color: var(--muted);
    border: none; background: none; cursor: pointer;
    position: relative; transition: color 0.18s;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font-body);
  }

  .tab:hover { color: var(--text); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  .tab-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    border-radius: 5px;
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 600;
    background: var(--surface3);
    color: var(--muted);
    transition: all 0.18s;
  }

  .tab.active .tab-badge {
    background: var(--accent-bg);
    color: var(--accent);
  }

  .tab-content { padding: 20px 22px 22px; }

  /* ── KEYWORD FILTER ── */
  .kw-filter {
    display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;
  }

  .kw-filter-btn {
    padding: 5px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 500;
    border: 1.5px solid var(--border);
    background: var(--surface2);
    color: var(--text2); cursor: pointer; transition: all 0.15s;
    font-family: var(--font-body);
  }

  .kw-filter-btn:hover { border-color: var(--border2); }

  .kw-filter-btn.active {
    background: var(--accent-bg);
    border-color: rgba(42,92,255,0.3);
    color: var(--accent);
  }

  /* ── TAGS ── */
  .tags { display: flex; flex-wrap: wrap; gap: 7px; }

  .tag {
    padding: 4px 11px; border-radius: 7px;
    font-size: 12px; font-weight: 500;
    transition: transform 0.12s;
    cursor: default;
  }

  .tag:hover { transform: translateY(-1px); }

  .tag.matched {
    background: var(--green-bg);
    border: 1px solid var(--green-bd);
    color: var(--green);
  }

  .tag.missing {
    background: var(--red-bg);
    border: 1px solid var(--red-bd);
    color: var(--red);
  }

  /* ── CATEGORY BARS ── */
  .cat-list { display: flex; flex-direction: column; gap: 15px; }

  .cat-top {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 7px;
  }

  .cat-name { font-size: 13px; font-weight: 500; color: var(--text); }

  .cat-pct {
    font-family: var(--font-mono); font-size: 12px; color: var(--muted);
  }

  .cat-track {
    height: 5px; border-radius: 5px;
    background: var(--surface3); overflow: hidden;
  }

  .cat-fill {
    height: 100%; border-radius: 5px;
    transition: width 1.4s cubic-bezier(0.4,0,0.2,1) var(--delay, 0s);
  }

  /* ── SUGGESTIONS ── */
  .sug-list { display: flex; flex-direction: column; gap: 0; }

  .sug-item {
    display: grid; grid-template-columns: 28px 1fr auto;
    gap: 12px; align-items: flex-start;
    padding: 13px 0;
    border-bottom: 1px solid var(--border);
    animation: fadeUp 0.35s ease both;
  }

  .sug-item:last-child { border-bottom: none; padding-bottom: 0; }
  .sug-item:first-child { padding-top: 0; }

  .sug-num {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--font-mono); font-size: 10px; font-weight: 500;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }

  .sug-text {
    font-size: 13.5px; font-weight: 400; color: var(--text2);
    line-height: 1.65; padding-top: 3px;
  }

  .priority-badge {
    padding: 3px 9px; border-radius: 6px;
    font-family: var(--font-mono); font-size: 9.5px;
    font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
    flex-shrink: 0; margin-top: 4px;
  }

  .priority-badge.high {
    background: var(--red-bg); border: 1px solid var(--red-bd); color: var(--red);
  }

  .priority-badge.medium {
    background: var(--yellow-bg); border: 1px solid var(--yellow-bd); color: var(--yellow);
  }

  .priority-badge.low {
    background: var(--accent-bg); border: 1px solid rgba(42,92,255,0.2); color: var(--accent);
  }

  /* ── EMPTY STATE ── */
  .empty-results {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: var(--shadow-md);
    padding: 40px 24px;
    text-align: center;
    animation: fadeUp 0.45s ease both;
  }

  .empty-results-icon {
    font-size: 40px; margin-bottom: 14px;
    filter: grayscale(0.3);
  }

  .empty-results-title {
    font-family: var(--font-serif);
    font-size: 20px; color: var(--text);
    margin-bottom: 8px;
  }

  .empty-results-sub {
    font-size: 13.5px; color: var(--muted); font-weight: 300; line-height: 1.6;
  }

  /* Progress steps */
  .steps {
    display: flex; flex-direction: column; gap: 12px;
    margin-top: 24px; text-align: left;
  }

  .step-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
  }

  .step-num {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: var(--surface3);
    border: 1px solid var(--border2);
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    color: var(--muted);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }

  .step-text {
    font-size: 13px; color: var(--text2); line-height: 1.5;
  }

  .step-text strong { color: var(--text); font-weight: 600; }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px;
    padding: 11px 16px; border-radius: 11px;
    font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 9px;
    z-index: 99;
    box-shadow: var(--shadow-lg);
    animation: slideIn 0.28s ease;
    font-family: var(--font-body);
  }

  .toast.success {
    background: #fff; border: 1px solid var(--green-bd); color: var(--green);
  }

  .toast.error {
    background: #fff; border: 1px solid var(--red-bd); color: var(--red);
  }

  /* ── ANIMS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(12px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .empty-muted { color: var(--muted); font-size: 13px; }
`;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 75) return { stroke: "#16a34a", bar: "linear-gradient(90deg,#15803d,#22c55e)", grade: "Strong Match", color: "#16a34a" };
  if (score >= 55) return { stroke: "#d97706", bar: "linear-gradient(90deg,#b45309,#f59e0b)", grade: "Good Match", color: "#d97706" };
  if (score >= 35) return { stroke: "#2a5cff", bar: "linear-gradient(90deg,#1d4ed8,#2a5cff)", grade: "Partial Match", color: "#2a5cff" };
  return { stroke: "#dc2626", bar: "linear-gradient(90deg,#b91c1c,#ef4444)", grade: "Needs Work", color: "#dc2626" };
}

function ScoreRing({ score, color }) {
  const R = 38;
  const circ = 2 * Math.PI * R;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="score-ring-wrap">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={R} fill="none" stroke="#e5e1da" strokeWidth="5.5" />
        <circle
          cx="45" cy="45" r={R} fill="none"
          stroke={color.stroke} strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="score-ring-num">
        {score}<span>ATS</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function UploadResume() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("keywords");
  const [kwFilter, setKwFilter] = useState("all");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3800);
  };

  const handleUpload = async () => {
    if (!file) return showToast("Please select a resume file.", "error");
    if (jobDesc.trim().length < 50)
      return showToast("Paste a more complete job description (50+ chars).", "error");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDesc);

    try {
      setLoading(true);
      setResult(null);
      const res = await uploadResume(formData);
      setResult(res.data);
      setActiveTab("keywords");
      setKwFilter("all");
      showToast("Analysis complete!", "success");
    } catch (err) {
      console.error(err);
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* Derived */
  const score = result?.atsScore ?? 0;
  const sc = scoreColor(score);

  const allKw = [
    ...(result?.matchedKeywords ?? []).map(k => ({ kw: k, type: "matched" })),
    ...(result?.missingKeywords ?? []).map(k => ({ kw: k, type: "missing" })),
  ];

  const visibleKw = kwFilter === "all" ? allKw
    : allKw.filter(k => k.type === kwFilter);

  const suggestions = (result?.suggestions ?? []).map((s, i) => {
    if (typeof s === "object") return s;
    const priority = i === 0 ? "high" : i < 3 ? "medium" : "low";
    return { text: s, priority };
  });

  const categories = result?.categories ?? (result ? [
    { name: "Technical Skills", score: Math.min(100, score + 8) },
    { name: "Experience Keywords", score: Math.max(0, score - 5) },
    { name: "Soft Skills", score: Math.min(100, score + 15) },
    { name: "Industry Terms", score: Math.max(0, score - 10) },
  ] : []);

  const catColors = ["#2a5cff", "#16a34a", "#7c3aed", "#d97706"];
  const jdWords = jobDesc.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <style>{styles}</style>
      <div className="root">

        {/* HEADER */}
        <header className="hd">
          <div className="hd-eyebrow">
            <span className="hd-eyebrow-dot" />
            AI-Powered ATS Analyzer
          </div>
          <h1 className="hd-title">
            Resume <em>Analyzer</em>
          </h1>
          <p className="hd-sub">Match your resume to any job description — instantly.</p>
        </header>

        {/* LAYOUT */}
        <div className={`layout${result ? " has-result" : ""}`}>

          {/* LEFT: Input */}
          <div className="left-col">
            <div className="card">
              <div className="card-header">
                <div className="card-header-icon">📋</div>
                <div>
                  <div className="card-header-title">Job Description</div>
                  <div className="card-header-sub">Paste the full listing</div>
                </div>
              </div>
              <div className="card-body">
                <div className="field">
                  <span className="label">Job Description</span>
                  <textarea
                    className="textarea"
                    placeholder="Paste the full job description here — include responsibilities, requirements, and skills…"
                    value={jobDesc}
                    onChange={e => setJobDesc(e.target.value)}
                    rows={6}
                  />
                  <div className="char-row">
                    <span>{jdWords} words · {jobDesc.length} chars</span>
                    <span className={jdWords >= 50 ? "char-ok" : ""}>
                      {jdWords >= 50 ? "✓ Good length" : `${50 - jdWords} more words needed`}
                    </span>
                  </div>
                  <div className="char-track">
                    <div className="char-fill" style={{ width: `${Math.min(100, (jdWords / 200) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="card">
              <div className="card-header">
                <div className="card-header-icon">📄</div>
                <div>
                  <div className="card-header-title">Resume File</div>
                  <div className="card-header-sub">PDF, DOC, or DOCX</div>
                </div>
              </div>
              <div className="card-body">
                <div className="field" style={{ marginBottom: 18 }}>
                  <span className="label">Upload Resume</span>
                  <div
                    className={`dropzone${dragOver ? " over" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  >
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
                    <div className="dz-icon">📁</div>
                    <p className="dz-title">Drop your resume here</p>
                    <p className="dz-sub">or click to browse — PDF, DOC, DOCX</p>
                    {file && (
                      <div className="dz-chosen">
                        <span>✓</span>
                        <span>{file.name}</span>
                        <span style={{ color: "#9b958a" }}>·</span>
                        <span style={{ color: "#9b958a" }}>{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    )}
                  </div>
                </div>

                <button className="btn" onClick={handleUpload} disabled={loading}>
                  {loading
                    ? <><span className="spinner" /> Analyzing your resume…</>
                    : <><span>⚡</span> Analyze Resume</>}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Results or Empty State */}
          <div className="right-col">
            {!result ? (
              <div className="empty-results">
                <div className="empty-results-icon">🎯</div>
                <div className="empty-results-title">Your analysis will appear here</div>
                <p className="empty-results-sub">
                  Fill in the job description and upload your resume to get an instant ATS compatibility report.
                </p>
                <div className="steps">
                  <div className="step-item">
                    <div className="step-num">1</div>
                    <div className="step-text"><strong>Paste the job description</strong> — the full listing works best (50+ words)</div>
                  </div>
                  <div className="step-item">
                    <div className="step-num">2</div>
                    <div className="step-text"><strong>Upload your resume</strong> — PDF, DOC, or DOCX format</div>
                  </div>
                  <div className="step-item">
                    <div className="step-num">3</div>
                    <div className="step-text"><strong>Get your ATS score</strong> — keyword gaps, category coverage & action items</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Score Card */}
                <div className="score-card">
                  <div className="score-top">
                    <ScoreRing score={score} color={sc} />
                    <div className="score-right">
                      <p className="score-grade" style={{ color: sc.color }}>{sc.grade}</p>
                      <p className="score-desc">
                        {score < 55
                          ? "Significant improvements can boost your chances."
                          : score < 75
                          ? "A few tweaks could push you into the top tier."
                          : "Your resume is well-optimized for this role."}
                      </p>
                      <div className="score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${score}%`, background: sc.bar }} />
                      </div>
                    </div>
                  </div>

                  <div className="mini-stats">
                    <div className="mini-stat">
                      <div className="mini-stat-val" style={{ color: "#16a34a" }}>
                        {result.matchedKeywords?.length ?? 0}
                      </div>
                      <div className="mini-stat-lbl">Matched</div>
                    </div>
                    <div className="mini-stat">
                      <div className="mini-stat-val" style={{ color: "#dc2626" }}>
                        {result.missingKeywords?.length ?? 0}
                      </div>
                      <div className="mini-stat-lbl">Missing</div>
                    </div>
                    <div className="mini-stat">
                      <div className="mini-stat-val" style={{ color: "#2a5cff" }}>
                        {suggestions.length}
                      </div>
                      <div className="mini-stat-lbl">Actions</div>
                    </div>
                  </div>
                </div>

                {/* Tabs Card */}
                <div className="tabs-card">
                  <div className="tabs">
                    {[
                      { id: "keywords", label: "Keywords", count: allKw.length },
                      { id: "categories", label: "Coverage", count: categories.length },
                      { id: "suggestions", label: "Actions", count: suggestions.length },
                    ].map(t => (
                      <button
                        key={t.id}
                        className={`tab${activeTab === t.id ? " active" : ""}`}
                        onClick={() => setActiveTab(t.id)}
                      >
                        {t.label}
                        <span className="tab-badge">{t.count}</span>
                      </button>
                    ))}
                  </div>

                  <div className="tab-content">

                    {/* Keywords */}
                    {activeTab === "keywords" && (
                      <div>
                        <div className="kw-filter">
                          {[
                            { id: "all", label: "All" },
                            { id: "matched", label: `✓ Matched (${result.matchedKeywords?.length ?? 0})` },
                            { id: "missing", label: `✗ Missing (${result.missingKeywords?.length ?? 0})` },
                          ].map(f => (
                            <button
                              key={f.id}
                              className={`kw-filter-btn${kwFilter === f.id ? " active" : ""}`}
                              onClick={() => setKwFilter(f.id)}
                            >{f.label}</button>
                          ))}
                        </div>
                        <div className="tags">
                          {visibleKw.map(({ kw, type }, i) => (
                            <span key={i} className={`tag ${type}`}>{kw}</span>
                          ))}
                          {visibleKw.length === 0 && (
                            <p className="empty-muted">No keywords in this category.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Categories */}
                    {activeTab === "categories" && (
                      <div className="cat-list">
                        {categories.map((cat, i) => (
                          <div key={i}>
                            <div className="cat-top">
                              <span className="cat-name">{cat.name}</span>
                              <span className="cat-pct">{cat.score}%</span>
                            </div>
                            <div className="cat-track">
                              <div
                                className="cat-fill"
                                style={{
                                  width: `${cat.score}%`,
                                  background: catColors[i % catColors.length],
                                  "--delay": `${i * 0.15}s`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        {categories.length === 0 && (
                          <p className="empty-muted">Category data not available.</p>
                        )}
                      </div>
                    )}

                    {/* Suggestions */}
                    {activeTab === "suggestions" && (
                      <div className="sug-list">
                        {suggestions.map((s, i) => (
                          <div
                            className="sug-item"
                            key={i}
                            style={{ animationDelay: `${i * 0.06}s` }}
                          >
                            <span className="sug-num">{String(i + 1).padStart(2, "0")}</span>
                            <span className="sug-text">{s.text ?? s}</span>
                            <span className={`priority-badge ${s.priority ?? "low"}`}>{s.priority ?? "low"}</span>
                          </div>
                        ))}
                        {suggestions.length === 0 && (
                          <p className="empty-muted">No suggestions available.</p>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          {toast.msg}
        </div>
      )}
    </>
  );
}
