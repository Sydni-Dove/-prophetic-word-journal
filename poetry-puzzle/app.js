'use strict';

// ─── Level Definitions ────────────────────────────────────────────────────────
//
// Each level specifies:
//   letter    – the required starting letter for every line
//   lines     – how many lines the poem must have
//   syllables – the exact syllable count required for each line

const LEVELS = [
  { letter: 'Z', lines: 1, syllables: 1 },
  { letter: 'Y', lines: 2, syllables: 2 },
  { letter: 'X', lines: 3, syllables: 3 },
  { letter: 'W', lines: 4, syllables: 4 },
];

// ─── Game State ───────────────────────────────────────────────────────────────

const state = {
  levelIndex: 0,
  attempts:   0,
  lines:      [],   // string[] — current value of each poem-line input
  feedback:   [],   // { valid: boolean, message: string }[] — per-line results
  phase:      'writing', // 'writing' | 'success' | 'complete'
};

// ─── Syllable Validation (Placeholder) ───────────────────────────────────────
//
// NOTE: This is a placeholder. It uses a naive vowel-group heuristic and will
// be inaccurate for many words (e.g. "every", "fire", "poem").
// Replace with a proper syllable dictionary or NLP service before production.

function countWordSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;

  const groups = w.match(/[aeiouy]+/g) || [];
  let n = groups.length;

  // Subtract silent trailing 'e' (e.g. "mine", "hope", "strange")
  if (w.length > 2 && w.endsWith('e') && !/[aeiouy]/.test(w[w.length - 2])) {
    n = Math.max(1, n - 1);
  }

  return Math.max(1, n);
}

function countLineSyllables(line) {
  return line
    .trim()
    .split(/\s+/)
    .reduce((sum, word) => sum + (word ? countWordSyllables(word) : 0), 0);
}

// ─── Structural Validation ────────────────────────────────────────────────────
//
// Checks (in order):
//   1. Line is not empty
//   2. Line begins with the required letter (case-insensitive)
//   3. Line contains the required syllable count (via placeholder counter)

function validateLines(lines, level) {
  return lines.map((line) => {
    const text = line.trim();

    if (!text) {
      return { valid: false, message: 'This line cannot be empty.' };
    }

    if (text[0].toUpperCase() !== level.letter) {
      return { valid: false, message: `Must begin with the letter "${level.letter}".` };
    }

    const count = countLineSyllables(text);
    if (count !== level.syllables) {
      return {
        valid: false,
        message: `~${count} syllable${count !== 1 ? 's' : ''} counted — needs exactly ${level.syllables}.`,
      };
    }

    return { valid: true, message: '' };
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  switch (state.phase) {
    case 'success':  app.innerHTML = renderSuccess();  break;
    case 'complete': app.innerHTML = renderComplete(); break;
    default:         app.innerHTML = renderWriting();  break;
  }
  attachEvents();
}

function renderWriting() {
  const level = LEVELS[state.levelIndex];

  const lineWord      = `${level.lines} line${level.lines !== 1 ? 's' : ''}`;
  const syllableWord  = `${level.syllables} syllable${level.syllables !== 1 ? 's' : ''} per line`;

  const inputsHTML = Array.from({ length: level.lines }, (_, i) => {
    const value    = state.lines[i] || '';
    const fb       = state.feedback[i];
    const hasError = fb && !fb.valid;

    return `
      <div class="line-group${hasError ? ' line-group--error' : ''}" data-line="${i}">
        <input
          type="text"
          class="poem-input"
          data-index="${i}"
          value="${escapeAttr(value)}"
          placeholder="Line ${i + 1}\u2026"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
        >
        ${hasError ? `<p class="line-feedback">${escapeHtml(fb.message)}</p>` : ''}
      </div>
    `;
  }).join('');

  const attemptsHTML = state.attempts > 0
    ? `<p class="attempts">${state.attempts} attempt${state.attempts !== 1 ? 's' : ''}</p>`
    : '';

  return `
    <header class="game-header">
      <p class="level-label">Level ${level.letter}</p>
      <div class="letter-display" aria-hidden="true">${level.letter}</div>
      <p class="rule-summary">${lineWord} &middot; ${syllableWord}</p>
    </header>

    <section class="poem-area" aria-label="Poem input">
      ${inputsHTML}
    </section>

    ${attemptsHTML}

    <button class="submit-btn" id="submit-btn">Submit poem</button>
  `;
}

function renderSuccess() {
  const level  = LEVELS[state.levelIndex];
  const isLast = state.levelIndex === LEVELS.length - 1;

  const poemHTML = state.lines
    .map(line => `<p class="poem-line">${escapeHtml(line.trim())}</p>`)
    .join('');

  return `
    <div class="success-view" role="main">
      <p class="success-label">Level ${level.letter} complete</p>

      <div class="poem-display" aria-label="Your poem">
        ${poemHTML}
      </div>

      <button class="next-btn" id="next-btn">
        ${isLast ? 'Finish' : 'Next level &rarr;'}
      </button>
    </div>
  `;
}

function renderComplete() {
  return `
    <div class="complete-view" role="main">
      <p class="complete-heading">All done.</p>
      <p class="complete-sub">You wrote from Z to W.</p>
      <button class="restart-btn" id="restart-btn">Start over</button>
    </div>
  `;
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

function attachEvents() {
  document.querySelectorAll('.poem-input').forEach(input => {
    input.addEventListener('input', onLineInput);
    input.addEventListener('paste', e => e.preventDefault());
  });

  const submitBtn  = document.getElementById('submit-btn');
  const nextBtn    = document.getElementById('next-btn');
  const restartBtn = document.getElementById('restart-btn');

  if (submitBtn)  submitBtn.addEventListener('click', onSubmit);
  if (nextBtn)    nextBtn.addEventListener('click', onNextLevel);
  if (restartBtn) restartBtn.addEventListener('click', onRestart);
}

function onLineInput(e) {
  const i = parseInt(e.target.dataset.index, 10);
  state.lines[i] = e.target.value;

  // Clear this line's error feedback immediately on edit — no full re-render
  // needed, which preserves cursor position and avoids input flicker.
  if (state.feedback[i] && !state.feedback[i].valid) {
    state.feedback[i] = null;
    const group = e.target.closest('.line-group');
    group.classList.remove('line-group--error');
    const msg = group.querySelector('.line-feedback');
    if (msg) msg.remove();
  }
}

function onSubmit() {
  const level = LEVELS[state.levelIndex];

  // Normalise state.lines to the exact expected length, padding with empty
  // strings for any inputs the user left untouched.
  const lines = Array.from({ length: level.lines }, (_, i) => state.lines[i] || '');
  state.lines = lines;

  state.attempts++;
  state.feedback = validateLines(lines, level);

  if (state.feedback.every(f => f.valid)) {
    state.phase = 'success';
    render();
    return;
  }

  render();

  // Move focus to the first invalid line to guide the user.
  const firstBad = state.feedback.findIndex(f => !f.valid);
  const inputs   = document.querySelectorAll('.poem-input');
  if (inputs[firstBad]) inputs[firstBad].focus();
}

function onNextLevel() {
  if (state.levelIndex < LEVELS.length - 1) {
    state.levelIndex++;
    state.attempts  = 0;
    state.lines     = [];
    state.feedback  = [];
    state.phase     = 'writing';
    render();
  } else {
    state.phase = 'complete';
    render();
  }
}

function onRestart() {
  state.levelIndex = 0;
  state.attempts   = 0;
  state.lines      = [];
  state.feedback   = [];
  state.phase      = 'writing';
  render();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

render();
