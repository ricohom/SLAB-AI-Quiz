// ---------- quiz.js ----------
// OpenAI‑Kommunikation & Parsing

const OPENAI_API_KEY = "API KEY";  // 🔑 QUICK&DIRTY
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export async function fetchQuestion(category = "Allgemeinwissen") {
  const messages = [
    {
      role: "system",
      content:
        "Du bist ein deutscher Quizmaster in einer TV‑Show. " +
        "Gib genau eine Multiple‑Choice‑Frage mit vier Optionen (A–D) aus. " +
        "Kennzeichne die korrekte Option mit ** hinter dem Text, z. B. 'Berlin**'. " +
        "Formatiere exakt so:\nFrage: …\nA) …\nB) …\nC) …\nD) …",
    },
    { role: "user", content: `Kategorie: ${category}` },
  ];

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, temperature: 0.7, messages, max_tokens: 200 }),
  });

  const data = await res.json();
  const text = data.choices[0].message.content.trim();
  return parseQuestion(text);
}

// Zerlegt die GPT‑Antwort in Struktur { question, options:[{text,isCorrect}] }
function parseQuestion(raw) {
  const lines = raw.split("\n").filter(Boolean);
  const question = lines[0].replace(/^Frage:\s*/i, "");
  const options = lines.slice(1).map(l => {
    const [, label, text] = l.match(/^([ABCD])\)[\s ]*(.*)$/i) || [];
    const isCorrect = /\*\*$/.test(text);
    return { label, text: text.replace(/\*\*$/, ""), isCorrect };
  });
  return { question, options };
}

// Prüft, ob gesprochene Antwort eine korrekte Option enthält
export function evaluate(userSpeech, options) {
  const cleaned = userSpeech.toLowerCase();
  const chosen =
    options.find(o => cleaned.includes(o.label.toLowerCase())) ||
    options.find(o => cleaned.includes(o.text.toLowerCase()));
  return chosen ? chosen.isCorrect : false;
}