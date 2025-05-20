/* GPT-4o-mini oder Dummy ----------------------------------------- */
const API_KEY = "KEY";
const ENDPT   = "https://api.openai.com/v1/chat/completions";
const MODEL   = "gpt-4o-mini";

const dummy = [
  {q:"Welche Farbe hat der Himmel an einem klaren Tag?",A:"Blau",B:"Grün",C:"Rot",D:"Gelb",r:"A"},
  {q:"Wie viele Kontinente gibt es?",A:"5",B:"6",C:"7",D:"8",r:"C"},
  {q:"Wer malte die Mona Lisa?",A:"Van Gogh",B:"Picasso",C:"Da Vinci",D:"Rembrandt",r:"C"}
];

export async function fetchQuestion() {
  if (!API_KEY) return randomDummy();
  try {
    const sys =
      'Du bist Quizmaster. Antworte nur JSON {"q":"…","A":"…","B":"…","C":"…","D":"…","r":"B"}';
    const res = await fetch(ENDPT,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${API_KEY}`
      },
      body:JSON.stringify({model:MODEL,temperature:1,messages:[
        {role:"system",content:sys},
        {role:"user",content:"Frag mich etwas Allgemeinwissen! Versuche auch Fragen zu stellen die nicht in jeder Quizshow vorkommen."}
      ]})
    });
    const data = await res.json();
    if (!data.choices) throw 0;
    let raw=data.choices[0].message.content.replace(/```(?:json)?|```/g,"").trim();
    return JSON.parse(raw);
  } catch { return randomDummy(); }
}
function randomDummy(){return dummy[Math.floor(Math.random()*dummy.length)];}