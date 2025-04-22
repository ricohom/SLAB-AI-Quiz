// ---------- main.js ----------
import { SpeechService } from "./speech.js";
import { fetchQuestion, evaluateSpeech } from "./quiz.js";

const speech = new SpeechService("de-DE");

/* ---------- DOM ---------- */
const qText    = document.getElementById("question-text");
const aWrap    = document.getElementById("answer-buttons");
const feed     = document.getElementById("feedback-text");
const btnStart = document.getElementById("btn-start");
const btnSTT   = document.getElementById("btn-stt");

let currentQuestion = null;

/* ---------- Listener ---------- */
btnStart.addEventListener("click", startRound);
btnSTT  .addEventListener("click", handleSpeech);
aWrap.addEventListener("click", e => {
  const b = e.target.closest("button[data-label]");
  if (b && !b.disabled) handleClick(b);
});

/* ---------- Runde ---------- */
async function startRound() {
  btnStart.disabled = true;
  feed.textContent  = "";
  hideSTT();

  qText.textContent = "Lade Frage …";
  try {
    currentQuestion = await fetchQuestion();
  } catch (err) {
    qText.textContent = "Fehler beim Laden der Frage.";
    feed.textContent  = err.message || err;
    btnStart.disabled = false;
    return;
  }

  renderQuestion(currentQuestion);
  speech.speak(buildSpeech(currentQuestion));   // nicht blockierend
  showSTT();
}

function renderQuestion(q) {
  qText.textContent = q.q;
  aWrap.innerHTML = ["A", "B", "C", "D"]
    .map(l => `<button class="secondary-btn" data-label="${l}">${l}) ${q[l]}</button>`)
    .join("");
}

function buildSpeech(q) {
  return `${q.q}. Ist es Antwort A: ${q.A}; Antwort B: ${q.B}; Antwort C: ${q.C}; oder Antwort D: ${q.D}?`;
}

/* ---------- Sprache ---------- */
async function handleSpeech() {
  hideSTT();
  feed.textContent = "Ich höre …";

  try {
    const spoken  = await speech.listen();
    const correct = evaluateSpeech(spoken, currentQuestion);

    markButtons(correct ? null : currentQuestion.r);
    speech.speak(correct ? "Richtig! Gut gemacht 🎉" : "Leider falsch.");   // non‑blocking
    feed.textContent = correct ? "✅ Richtig!" : "❌ Falsch!";
  } catch (err) {
    feed.textContent = `Spracherkennung fehlgeschlagen: ${err}`;
  }
  unlock();
}

/* ---------- Klick ---------- */
async function handleClick(btn) {
  [...aWrap.children].forEach(b => (b.disabled = true));

  const correct = btn.dataset.label === currentQuestion.r;

  if (correct) {
    markButtons(null);                    // richtiger Button wird in markButtons grün
  } else {
    markButtons(currentQuestion.r, btn);  // grün + rot
  }

  feed.textContent = correct
    ? "✅ Richtig!"
    : `❌ Falsch! Richtige Antwort: ${currentQuestion.r}`;

  speech.speak(correct ? "Richtig! Gut gemacht 🎉" : "Das war leider falsch."); // non‑blocking
  unlock();
}

/* ---------- UI‑Hilfen ---------- */
function markButtons(correctLabel = null, wrongBtn = null) {
  if (wrongBtn) wrongBtn.classList.add("wrong");
  if (correctLabel) {
    const rightBtn = aWrap.querySelector(`button[data-label="${correctLabel}"]`);
    if (rightBtn) rightBtn.classList.add("correct");
  } else {
    // falls correctLabel null, wurde bereits der richtige Button geklickt
    const clicked = aWrap.querySelector(`button[data-label]:not(.wrong)`);
    if (clicked) clicked.classList.add("correct");
  }
}

function hideSTT() {
  btnSTT.classList.add("hidden");
  btnSTT.setAttribute("disabled", "");
}
function showSTT() {
  btnSTT.classList.remove("hidden");
  btnSTT.removeAttribute("disabled");
}

function unlock() {
  btnStart.disabled = false;
  btnStart.textContent = "Neue Frage";
  hideSTT();
}

export {};