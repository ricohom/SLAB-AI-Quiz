
/* ===== Konfiguration ===== */
const OPENAI_API_KEY = "KEY";          // null ⇒ Dummy
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL    = "gpt-4o-mini";                            // schnelles 4‑o‑Modell

/* ===== Lokaler Fallback‑Fragenpool ===== */
const dummy = [
  { q: "Welcher Planet ist der Sonne am nächsten?",
    A: "Merkur", B: "Venus", C: "Erde", D: "Mars", r: "A" },
  { q: "Wie heißt die Hauptstadt von Japan?",
    A: "Peking", B: "Seoul", C: "Tokio", D: "Bangkok", r: "C" },
  { q: "In welchem Jahr fiel die Berliner Mauer?",
    A: "1979", B: "1989", C: "1999", D: "2009", r: "B" },
  { q: "Wie viele Bytes hat ein Kilobyte nach IEC‑Standard?",
    A: "1000", B: "1024", C: "1280", D: "2048", r: "B" }
];

/* ===== Hauptfunktion ===== */
export async function fetchQuestion(category = "Allgemeinwissen") {
  /* Ohne Key → direkter Dummy‑Return */
  if (!OPENAI_API_KEY) {
    console.warn("Kein API‑Key – Dummy‑Frage wird verwendet.");
    return randomDummy();
  }

  try {
    /* ---------- GPT‑Aufruf ---------- */
    const systemPrompt =
      "Du bist ein deutscher Quizmaster in einer TV‑Show. " +
      "Gib genau eine Frage im Multiple‑Choice‑Format zurück, " +
      "und liefere ausschließlich gültiges JSON im Format " +
      '{"q":"Frage","A":"...","B":"...","C":"...","D":"...","r":"B"}.' +
      "Keine weiteren Worte oder Codeblöcke.";

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user",   content: `Kategorie: ${category}` }
    ];

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: MODEL, temperature: 0.7, messages })
    });

    const data = await res.json();

    /* Fehler oder leere choices → Fallback */
    if (!res.ok || !data.choices) {
      throw new Error(
        data?.error?.message ||
          `${res.status} ${res.statusText} – API‑Limit / Key‑Problem`
      );
    }

    let raw = data.choices[0].message.content.trim();
    raw = raw.replace(/```(?:json)?|```/g, "");    // evtl. ```json‑Tags entfernen
    return JSON.parse(raw);
  } catch (err) {
    console.warn("OpenAI‑Call fehlgeschlagen – Dummy‑Frage:", err);
    return randomDummy();
  }
}

/* ===== Hilfsfunktionen ===== */
function randomDummy() {
  return dummy[Math.floor(Math.random() * dummy.length)];
}

/**
 * Bewertet gesprochene Antwort.
 *  • akzeptiert Buchstaben (A–D) oder Antworttext
 *  • gibt true bei richtiger Antwort zurück
 */
export function evaluateSpeech(text, q) {
  const t = text.toLowerCase();

  /* 1) Buchstabe? */
  const letter = ["a", "b", "c", "d"].find(l => t.includes(l));
  if (letter) return letter.toUpperCase() === q.r;

  /* 2) Text‑Match */
  const found = ["A", "B", "C", "D"].find(label =>
    t.includes(q[label].toLowerCase())
  );
  return found ? found === q.r : false;
}