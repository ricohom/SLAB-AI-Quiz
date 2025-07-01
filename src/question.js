/* ===============================================================
   KI-Fragen mit Schwierigkeits­stufe + Duplikate-Vermeidung
   Aufruf:  fetchQuestion("easy" | "normal" | "hard")
   ============================================================== */

const ENDPT = "api/ask_openai.php";        // lokaler PHP-Proxy
const MODEL = "gpt-4o-mini";

/* ---------- Prompt-Bausteine pro Stufe ------------------------ */
const DIFF_DEF = {
  easy: {
    temp : 0.6,
    sys  : `Du bist Quizmaster einer **Einsteiger-Runde**.  • Erstelle sehr bekannte Fragen aus Alltag & Grund­wissen.
      • Themen zufällig mischen aus: Geografie, Sport, Popkultur, einfache Geschichte, Alltagstechnik.  •
       Jede Frage hat **4 Antworten** (A–D).  • 
       Antwortformat NUR JSON {"q":"…","A":"…","B":"…","C":"…","D":"…","r":"B"}.`,
    user : "Gib mir eine EASY-Frage!"
  },
  normal: {
    temp : 0.8,
    sys  : `Du bist Quizmaster einer **Fortgeschrittenen-Runde**.  • Stelle abwechslungs­reiche Fragen, die durchschnittlich gebildete Personen lösen können, aber nicht sofort wissen. 
     • Themen mischen: Weltgeschichte, klassische Musik, Literatur, Politik, Kino/TV, Natur­wissenschaft, aktuelle Technik, Sport, Pokultur. 
     • Vermeide Wiederholungen und Standard-Fragen wie „Was ist die Hauptstadt von Deutschland?“.  •
Antwortformat NUR JSON {"q":"…","A":"…","B":"…","C":"…","D":"…","r":"B"}.`,
    user : "Gib mir eine NORMAL-Frage!"
  },
  hard: {
    temp : 0.9,
    sys  : `Du bist Quizmaster einer **Profi-Runde**.  • Stelle schwierige, aber faire Fragen auf hohem Niveau.  
    • Themen mischen: Astrophysik, Musik-Geschichte, Weltwirtschaft, Molekular­biologie, höherer Sport­statistik, Geschichte, Popkultur, Geographie.  • 
    Keine triviale Google-Antwort.  • 
    Antwortformat NUR JSON {"q":"…","A":"…","B":"…","C":"…","D":"…","r":"B"}.`,
    user : "Gib mir eine HARD-Frage!"
  }
};

/* ---------- Fallback-Fragen ----------------------------------- */
const dummy = [
  { q:"Welche Farbe hat der Himmel an einem klaren Tag?", A:"Blau", B:"Grün", C:"Rot", D:"Gelb", r:"A" },
  { q:"Wie viele Kontinente gibt es?",                    A:"5",   B:"6",   C:"7",  D:"8",   r:"C" },
  { q:"Wer malte die Mona Lisa?",                         A:"Van Gogh", B:"Picasso", C:"Da Vinci", D:"Rembrandt", r:"C" }
];

/* ---------- Verlauf, um Duplikate zu vermeiden --------------- */
const asked = new Set();                 // merkt sich Fragen-Texte einer Spiel-Session
const MAX_RETRIES = 3;                   // wie oft neu anfordern, wenn Duplikat

/* ---------- interne Helferfunktion --------------------------- */
async function requestOne(level){
  const cfg = DIFF_DEF[level] ?? DIFF_DEF.normal;
  const prevList = [...asked].slice(-15).join(" | ");    // letzte 15 Fragen

  const sysPrompt = cfg.sys +
    (prevList ? ` Vermeide Wiederholungen. Bereits gestellt: ${prevList}` : "");

  const res = await fetch(ENDPT, {
    method : "POST",
    headers: { "Content-Type":"application/json" },
    body   : JSON.stringify({
      model       : MODEL,
      temperature : cfg.temp,
      messages    : [
        { role:"system", content: sysPrompt },
        { role:"user",   content: cfg.user }
      ]
    })
  });

  if (!res.ok) throw new Error(`Proxy-Status ${res.status}`);
  const data = await res.json();
  if (!data.choices) throw new Error("Keine choices");

  const raw = data.choices[0].message.content
                 .replace(/```(?:json)?|```/g,"")
                 .trim();
  return JSON.parse(raw);
}

/* ---------- öffentliche Hauptfunktion ------------------------ */
export async function fetchQuestion(level="normal"){
  try{
    for (let i = 0; i < MAX_RETRIES; i++){
      const q = await requestOne(level);
      if (!asked.has(q.q)) {             // noch nie gestellt?
        asked.add(q.q);
        return q;
      }
      console.warn("Duplikat erhalten – neue Frage anfordern");
    }
    throw new Error("Zu viele Duplikate");
  }catch(err){
    console.error("OpenAI-Fehler:", err);
    return dummy[Math.floor(Math.random() * dummy.length)];
  }
}