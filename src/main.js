import { fetchQuestion } from "./question.js";

/* ===== Konfiguration ===== */
const DIFF = {
  easy  : { plus:10, minus: 5 },
  normal: { plus:20, minus:10 },
  hard  : { plus:40, minus:20 }
};
/* Abbruch-Malus: 2× Plus-Wert der aktuellen Schwierigkeit */
const quitPenalty = diff => -DIFF[diff].plus * 2;   // easy −20, normal −40, hard −80

const RANKS = [
  { n:"Bronze",  min:0,    svg:"bronze"  },
  { n:"Silver",  min:200,  svg:"silver"  },
  { n:"Gold",    min:400,  svg:"gold"    },
  { n:"Platin",  min:700,  svg:"platin"  },
  { n:"Diamond", min:1000, svg:"diamond" },
  { n:"Master",  min:1300, svg:"master"  }
];

/* ===== DOM ===== */
const app       = document.getElementById("app");
const btnLogout = document.getElementById("btnLogout");
const dlg       = document.getElementById("authDialog");
const userF     = document.getElementById("authUser");
const passF     = document.getElementById("authPass");
const errF      = document.getElementById("authError");
const swapBtn   = document.getElementById("authSwap");

/* ===== States ===== */
let uid=null, username="", pointsDB=0, isSignup=false;
let difficulty="normal", qCount=0, runPoints=0;

/* ===== Rang-Badge ===== */
const rankBadge = pts =>{
  const r=RANKS.slice().reverse().find(r=>pts>=r.min)||RANKS[0];
  return `<span class="rank rank-${r.n}">
            <img src="assets/${r.svg}.png" alt="">
            <span>${r.n}</span>
          </span>`;
};

/* ===== Auth ===== */
swapBtn.onclick=()=>{isSignup=!isSignup;authTitle.textContent=isSignup?"Registrieren":"Login";swapText.textContent=isSignup?"Einloggen":"Registrieren";errF.textContent="";};
[userF,passF].forEach(i=>i.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();authOK.click();}}));

authOK.onclick = async ()=>{
  errF.textContent="";
  const u=userF.value.trim(), p=passF.value.trim();
  if(!u||!p){errF.textContent="Bitte ausfüllen";return;}

  const url=isSignup?"api/signup.php":"api/login.php";
  const res=await fetch(url,{method:"POST",body:JSON.stringify({username:u,password:p})});
  const data=await res.json();
  if(!res.ok){errF.textContent=data.error||"Fehler";return;}

  if(isSignup){
    const d=await fetch("api/login.php",{method:"POST",body:JSON.stringify({username:u,password:p})}).then(r=>r.json());
    uid=d.id; pointsDB=d.points;
  }else{ uid=data.id; pointsDB=data.points; }

  username=u; dlg.close(); btnLogout.classList.remove("hidden"); showHome();
};
btnLogout.onclick=()=>{uid=null;username="";pointsDB=0;btnLogout.classList.add("hidden");dlg.showModal();};

/* ===== Home-Menü ===== */
function showHome(){
  app.innerHTML=`
    <h2>🎓 Quiz-Master</h2>
    <p>Willkommen, <strong>${username}</strong>!</p>
    <div class="home-buttons">
      <button class="btn primary" id="playBtn">Spielen</button>
      <button class="btn"          id="boardBtn">Leaderboard</button>
      <button class="btn"          id="profileBtn">Mein Profil</button>
    </div>
    <p>Aktueller Score: <strong>${pointsDB} P</strong><br>
       Rang: ${rankBadge(pointsDB)}</p>`;
  playBtn.onclick   = showDifficulty;
  boardBtn.onclick  = showLeaderboard;
  profileBtn.onclick= showProfile;
}

/* ===== Schwierigkeits-Auswahl ===== */
function showDifficulty(){
  app.innerHTML=`
    <h2>Schwierigkeits-Wahl</h2>
    <button class="btn primary" data-diff="easy">Einfach</button>
    <button class="btn primary" data-diff="normal">Mittel</button>
    <button class="btn primary" data-diff="hard">Schwer</button>
    <button class="btn" id="backHome">← Zurück</button>`;
  [...app.querySelectorAll("[data-diff]")].forEach(b=>b.onclick=()=>startGame(b.dataset.diff));
  backHome.onclick=showHome;
}

/* ===== Leaderboard ===== */
async function showLeaderboard(){
  const rows=await fetch("api/leaderboard.php").then(r=>r.json());
  app.innerHTML=`
    <h2>🏆 Leaderboard</h2>
    <button class="btn" id="backBtn">← Zurück</button>
    <table class="board">
      <thead><tr><th>#</th><th>Spieler</th><th class="rank-col">Rang</th><th>Punkte</th></tr></thead>
      <tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.username}</td><td class="rank-col">${rankBadge(r.points)}</td><td>${r.points}</td></tr>`).join("")}</tbody>
    </table>`;
  backBtn.onclick=showHome;
}

/* ===== Profil (Platzhalter) ===== */
function showProfile(){
  app.innerHTML=`
    <h2>👤 Mein Profil</h2>
    <div class="profile-box">
      <p>Name: <strong>${username}</strong></p>
      <p>Rang: ${rankBadge(pointsDB)}</p>
      <p>Score: <strong>${pointsDB} P</strong></p>
    </div>
    <button class="btn" id="backHome2">← Zurück</button>`;
  backHome2.onclick=showHome;
}

/* ===== Spiel-Flow ===== */
function startGame(diff){difficulty=diff;qCount=0;runPoints=0;nextQuestion();}

async function nextQuestion(){
  if(qCount>=10){showEnd();return;}
  const q=await fetchQuestion();
  showQuestion(q);
}

function showQuestion(q){
  const {q:Q,A,B,C,D}=q;
  const penalty=Math.abs(quitPenalty(difficulty));        // positive Zahl fürs Label

  app.innerHTML=`
    <button id="abortBtn" class="btn-abort-fixed">✖ Abbrechen (-${penalty} P)</button>

    <div class="scoreboard">
      <span id="rank">${rankBadge(pointsDB)}</span>
      <span id="pts">${pointsDB} P</span>
    </div>

    <p>${qCount+1}/10 · Schwierigkeit: ${difficulty}</p>
    <h3>${Q}</h3>

    <div id="answers">
      <button class="btn" data-label="A">A) ${A}</button>
      <button class="btn" data-label="B">B) ${B}</button>
      <button class="btn" data-label="C">C) ${C}</button>
      <button class="btn" data-label="D">D) ${D}</button>
    </div>

    <p id="feedback"></p>`;

  /* Antwort-Klicks */
  [...app.querySelectorAll("#answers button")].forEach(b=>b.onclick=()=>evaluate(b,q));

  /* Abbrechen-Button */
  abortBtn.onclick = async ()=>{
    const delta = quitPenalty(difficulty);           // negativer Wert
    pointsDB = Math.max(pointsDB + delta,0);
    await fetch("api/post_score.php",{method:"POST",body:JSON.stringify({id:uid,delta})});
    showHome();
  };
}

async function evaluate(btn,q){
  [...btn.parentNode.children].forEach(b=>b.disabled=true);
  const delta = (btn.dataset.label===q.r) ? DIFF[difficulty].plus : -DIFF[difficulty].minus;
  runPoints += delta; pointsDB = Math.max(pointsDB + delta,0);

  if(delta>0) btn.classList.add("correct");
  else{ btn.classList.add("wrong"); app.querySelector(`[data-label="${q.r}"]`)?.classList.add("correct"); }

  pts.textContent = `${pointsDB} P`;
  rank.innerHTML  = rankBadge(pointsDB);
  feedback.textContent = delta>0 ? `✅ +${delta} P` : `❌ ${delta} P (richtig: ${q.r})`;

  await fetch("api/post_score.php",{method:"POST",body:JSON.stringify({id:uid,delta})});
  qCount++; setTimeout(nextQuestion,1200);
}

function showEnd(){
  app.innerHTML=`
    <h2>Run beendet</h2>
    <p>Run-Punkte: <strong>${runPoints} P</strong></p>
    <button class="btn primary" id="againBtn">Noch mal</button>
    <button class="btn"          id="homeBtn">Menü</button>`;
  againBtn.onclick =()=>startGame(difficulty);
  homeBtn.onclick  =showHome;
}

/* ===== Init ===== */
dlg.showModal();

/* ===== Particles ===== */
particlesJS("particles-js",{particles:{number:{value:20,density:{value_area:800}},shape:{type:"polygon",polygon:{nb_sides:6}},color:{value:"#ffffff"},opacity:{value:.5,random:true},size:{value:5,random:true},move:{enable:true,speed:3,random:true}},interactivity:{detect_on:"window",events:{onhover:{enable:true,mode:"repulse"}},modes:{repulse:{distance:150}}},retina_detect:true});