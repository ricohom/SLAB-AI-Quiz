// ---------- main.js ----------
import { SpeechService } from "./speech.js";
import { fetchQuestion, evaluate } from "./quiz.js";

const speech = new SpeechService("de-DE");

/* ---------- DOM ---------- */
const qText     = document.getElementById("question-text");
const aWrap     = document.getElementById("answer-buttons");
const feed      = document.getElementById("feedback-text");
const btnStart  = document.getElementById("btn-start");
const btnSTT    = document.getElementById("btn-stt");

let currentQuestion = null;          // { question, options[] }

/* ---------- Event‑Listener ---------- */
btnStart.addEventListener("click", playRound);
btnSTT  .addEventListener("click", askForAnswer);
/* Delegation für alle Antwort‑Buttons */
aWrap.addEventListener("click", e => {
  const btn = e.target.closest("button[data-label]");
  if (btn) handleButtonAnswer(btn.dataset.label);
});

/* ---------- Spiel‑Ablauf ---------- */
async function playRound() {
  btnStart.disabled = true;
  feed.textContent  = "";
  btnSTT.classList.add("hidden");
  btnSTT.disabled   = true;

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
  await speech.speak(buildSpeech(currentQuestion));   // Moderator liest Frage vor

  btnSTT.classList.remove("hidden");                  // STT für diese Runde aktivieren
  btnSTT.disabled = false;
}

function renderQuestion(q) {
  qText.textContent = q.question;
  aWrap.innerHTML   = q.options
    .map(
      o =>
        `<button class="secondary-btn"
                 data-label="${o.label}"
                 data-correct="${o.isCorrect}">
           ${o.label}) ${o.text}
         </button>`
    )
    .join("");
}

function buildSpeech(q) {
  return `${q.question}. Ist es Antwort A: ${q.options[0].text}; ` +
         `Antwort B: ${q.options[1].text}; Antwort C: ${q.options[2].text}; ` +
         `oder Antwort D: ${q.options[3].text}?`;
}

/* ---------- Variante A – Sprache ---------- */
async function askForAnswer() {
  btnSTT.disabled   = true;
  feed.textContent  = "Ich höre …";

  try {
    const userSpeech = await speech.listen();
    feed.textContent = `Du hast gesagt: „${userSpeech}”`;
    const correct    = evaluate(userSpeech, currentQuestion.options);

    await speech.speak(correct ? "Richtig! Gut gemacht 🎉"
                               : "Leider falsch.");
    feed.textContent += correct ? " ✅" : " ❌";
  } catch (err) {
    feed.textContent = `Spracherkennung fehlgeschlagen: ${err}`;
  }
  unlockForNextRound();
}

/* ---------- Variante B – Klick ---------- */
async function handleButtonAnswer(label) {
  [...aWrap.children].forEach(b => (b.disabled = true));     // Doppelklick blocken

  const picked   = currentQuestion.options.find(o => o.label === label);
  const correct  = picked?.isCorrect;

  feed.textContent = correct
    ? `Richtig! ${picked.text}`
    : `Leider falsch! Die richtige Antwort war ${
        currentQuestion.options.find(o => o.isCorrect).text
      }.`;

  await speech.speak(correct ? "Richtig! Gut gemacht 🎉"
                             : "Das war leider falsch.");
  unlockForNextRound();
}

/* ---------- Helper ---------- */
function unlockForNextRound() {
  btnStart.disabled = false;
  btnStart.textContent = "Neue Frage";
  btnSTT.classList.add("hidden");
  btnSTT.disabled = true;
}

export {};          // kennzeichnet die Datei als ES‑Modul