import { fetchQuestion } from "./question.js";

/* ===== Konfiguration ===== */
const DIFF = {
  easy  : { plus:10, minus: 5 },
  normal: { plus:20, minus:10 },
  hard  : { plus:40, minus:20 }
};
const quitPenalty = diff => -DIFF[diff].plus * 2;   // –20 / –40 / –80

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

/* ===== State ===== */
let uid=null, username="", pointsDB=0, correctDB=0, wrongDB=0, isSignup=false;
let difficulty="normal", qCount=0, runPoints=0;

/* ===== Helper: Rang-Berechnungen ===== */
function rankInfo(pts){
  let cur=RANKS[0], prev=null, next=null;
  for(let i=0;i<RANKS.length;i++){
    if(pts>=RANKS[i].min){
      cur = RANKS[i];
      prev= i>0              ? RANKS[i-1] : null;
      next= i+1<RANKS.length ? RANKS[i+1] : null;
    }
  }
  return {cur,prev,next};
}
const rankBadge = pts=>{
  const {cur}=rankInfo(pts);
  return `<span class="rank rank-${cur.n}">
            <img src="assets/${cur.svg}.png" alt="">
            <span>${cur.n}</span>
          </span>`;
};
const accuracy = ()=> {
  const total = correctDB + wrongDB;
  return total ? Math.round(correctDB/total*100) : 0;
};

/* ===== Auth ===== */
swapBtn.onclick = ()=>{
  isSignup = !isSignup;
  authTitle.textContent = isSignup ? "Registrieren" : "Login";
  swapText.textContent  = isSignup ? "Einloggen"    : "Registrieren";
  errF.textContent = "";
};
[userF, passF].forEach(i=>
  i.addEventListener("keydown", e=>{
    if(e.key === "Enter"){ e.preventDefault(); authOK.click(); }
  })
);
authOK.onclick = async ()=>{
  errF.textContent = "";
  const u = userF.value.trim(), p = passF.value.trim();
  if(!u||!p){ errF.textContent="Bitte ausfüllen"; return; }
  const url = isSignup ? "api/signup.php" : "api/login.php";
  const data = await fetch(url, {
    method:"POST",
    body: JSON.stringify({username:u,password:p})
  }).then(r=>r.json());
  if(data.error){ errF.textContent = data.error; return; }
  if(isSignup){
    const d = await fetch("api/login.php", {
      method:"POST",
      body: JSON.stringify({username:u,password:p})
    }).then(r=>r.json());
    ({id:uid,points:pointsDB,correct:correctDB,wrong:wrongDB} = d);
  } else {
    ({id:uid,points:pointsDB,correct:correctDB,wrong:wrongDB} = data);
  }
  username = u;
  dlg.close();
  btnLogout.classList.remove("hidden");
  showHome();
};
btnLogout.onclick = ()=>{
  uid = null;
  username = "";
  pointsDB = 0;
  btnLogout.classList.add("hidden");
  dlg.showModal();
};

/* ===== Home ===== */
function showHome(){
  app.innerHTML = `
    <h2>🎓 Quiz-Master</h2>
    <p>Willkommen, <strong>${username}</strong>!</p>
    <div class="home-buttons">
      <button class="btn primary" id="playBtn">Spielen</button>
      <button class="btn"          id="boardBtn">Leaderboard</button>
      <button class="btn"          id="profileBtn">Mein Profil</button>
    </div>
    <p>Score: <strong>${pointsDB} P</strong><br>Rang: ${rankBadge(pointsDB)}</p>`;
  playBtn.onclick    = showDifficulty;
  boardBtn.onclick   = showLeaderboard;
  profileBtn.onclick = showProfile;
}

/* ===== Schwierigkeits-Menü ===== */
function showDifficulty(){
  app.innerHTML=`
    <h2>Schwierigkeits-Wahl</h2>
    <button class="btn primary" data-diff="easy">Einfach</button>
    <button class="btn primary" data-diff="normal">Mittel</button>
    <button class="btn primary" data-diff="hard">Schwer</button>
    <button class="btn" id="backHome">← Zurück</button>`;
  [...app.querySelectorAll("[data-diff]")]
    .forEach(b=>b.onclick=()=>startGame(b.dataset.diff));
  backHome.onclick = showHome;
}

/* ===== Leaderboard ===== */
async function showLeaderboard(){
  const rows = await fetch("api/leaderboard.php").then(r=>r.json());
<<<<<<< HEAD

=======
>>>>>>> da53701 (vdvd)
  app.innerHTML = `
    <h2>🏆 Leaderboard</h2>
    <button class="btn" id="backBtn">← Zurück</button>
    <table class="board">
      <thead>
        <tr>
          <th>#</th><th>Spieler</th><th class="rank-col">Rang</th>
          <th>Punkte</th><th>Trefferquote</th><th>Spiele</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${r.username}</td>
            <td class="rank-col">${rankBadge(r.points)}</td>
            <td>${r.points}</td>
            <td>${r.accuracy} %</td>
            <td>${r.games_played}</td>
          </tr>`).join("")}
      </tbody>
    </table>`;
<<<<<<< HEAD

=======
>>>>>>> da53701 (vdvd)
  document.getElementById("backBtn").onclick = showHome;
}

/* ===== Profil ===== */
function showProfile(){
  const {cur,prev,next} = rankInfo(pointsDB);
  const progress = next
    ? Math.round((pointsDB - cur.min) / (next.min - cur.min) * 100)
    : 100;
  const downTxt = prev
    ? `${prev.n} (−${pointsDB - cur.min} P)`
    : cur.n;
  const upTxt   = next
    ? `${next.n} (+${next.min - pointsDB} P)`
    : "MAX";

  app.innerHTML = `
    <h2>👤 Mein Profil</h2>
    <div class="profile-box">
      <p>Name: <strong>${username}</strong></p>
      <p style="margin:12px 0;">${rankBadge(pointsDB)}</p>
      <p>Score: <strong>${pointsDB} P</strong></p>
      <div class="xp-bar"><div class="fill" style="width:${progress}%"></div></div>
      <div class="xp-labels"><span>${downTxt}</span><span>${upTxt}</span></div>
      <p style="margin-top:14px;">
        Trefferquote: <strong>${accuracy()} %</strong>
      </p>
      <button class="btn" id="rankListBtn" style="margin-top:18px;">Rang-Übersicht</button>
    </div>
    <button class="btn" id="backHome3" style="margin-top:20px;">← Zurück</button>`;
  backHome3.onclick   = showHome;
  rankListBtn.onclick = showRankList;
}

/* ===== Rang-Übersicht ===== */
function showRankList(){
  const rows = RANKS.map((r, idx) => {
    const nextMin = RANKS[idx+1]?.min;
    const range = nextMin
      ? `${r.min} – ${nextMin-1} P`
      : `≥ ${r.min} P`;
    const cls = (pointsDB >= r.min && (!nextMin||pointsDB < nextMin))
      ? "current" : "";
    return `<tr class="${cls}">
              <td>${rankBadge(r.min)}</td>
              <td>${range}</td>
            </tr>`;
  }).join("");
  app.innerHTML = `
    <h2>📊 Rang-Übersicht</h2>
    <button class="btn" id="backToProfile">← Zurück</button>
    <table class="rank-table">
      <thead><tr><th>Rang</th><th>Punkte­bereich</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  backToProfile.onclick = showProfile;
}

/* ===== Spielablauf ===== */
function startGame(diff){ difficulty=diff; qCount=0; runPoints=0; nextQuestion(); }
async function nextQuestion(){ 
  qCount>=10 ? showEnd() : showQuestion(await fetchQuestion(difficulty));
}

/* ===== Frage anzeigen (mit Shuffle) ===== */
function showQuestion(q){
  const penalty = Math.abs(quitPenalty(difficulty));

  // Optionen vorbereiten
  const opts = ["A","B","C","D"].map(label=>({
    label,
    text: q[label],
    correct: q.r===label
  }));
  // Fisher-Yates mischen
  for(let i=opts.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [opts[i],opts[j]] = [opts[j],opts[i]];
  }

  // Rendern
  app.innerHTML = `
    <button id="abortBtn" class="btn-abort-fixed">
      ✖ Abbrechen (−${penalty} P)
    </button>
    <div class="scoreboard">
      <span id="rank">${rankBadge(pointsDB)}</span>
      <span id="pts">${pointsDB} P</span>
    </div>
    <p>${qCount+1}/10 · Schwierigkeit: ${difficulty}</p>
    <h3>${q.q}</h3>
    <div id="answers">
      ${opts.map((o,idx)=>
        `<button class="btn" 
                 data-correct="${o.correct}">
           ${String.fromCharCode(65+idx)}) ${o.text}
         </button>`
      ).join("")}
    </div>
    <p id="feedback"></p>`;

  [...app.querySelectorAll("#answers button")]
    .forEach(b=>b.onclick=()=>evaluate(b));
  abortBtn.onclick = quitRun;
}

/* ===== Run abbrechen ===== */
async function quitRun(){
  const delta = quitPenalty(difficulty);
  pointsDB = Math.max(pointsDB+delta,0);
  await fetch("api/post_score.php",{
    method:"POST",
    body:JSON.stringify({id:uid,delta,correct:0,wrong:0})
  });
  showHome();
}

/* ===== Auswertung ===== */
async function evaluate(btn){
  // alle Buttons sperren
  [...btn.parentNode.children].forEach(b=>b.disabled=true);

  const correct = (btn.dataset.correct === 'true');
  const delta   = correct
    ? DIFF[difficulty].plus
    : -DIFF[difficulty].minus;

  runPoints += delta;
  pointsDB  = Math.max(pointsDB + delta, 0);
  correct ? correctDB++ : wrongDB++;

  // markiere geklickten Button
  btn.classList.add(correct ? "correct" : "wrong");

  // ► NEU: falls falsch, auch den richtigen Button grün markieren
  if(!correct){
    const rightBtn = [...btn.parentNode.children]
                     .find(b => b.dataset.correct === 'true');
    rightBtn?.classList.add("correct");
  }

  // Anzeige aktualisieren
  document.getElementById("pts").textContent  = `${pointsDB} P`;
  document.getElementById("rank").innerHTML   = rankBadge(pointsDB);
  document.getElementById("feedback").textContent = correct
    ? `✅ +${delta} P`
    : `❌ ${delta} P`;

  // Score an Backend
  await fetch("api/post_score.php", {
    method:"POST",
    body: JSON.stringify({
      id: uid,
      delta,
      correct: correct ? 1 : 0,
      wrong:   correct ? 0 : 1
    })
  });

  qCount++;
  setTimeout(nextQuestion, 1200);
}

/* ===== Run-Ende ===== */
function showEnd(){
  app.innerHTML = `
    <h2>Run beendet</h2>
    <p>Run-Punkte: <strong>${runPoints} P</strong></p>
    <button class="btn primary" id="againBtn">Noch mal</button>
    <button class="btn"          id="homeBtn">Menü</button>`;

<<<<<<< HEAD
  // Run-Zählung melden
  fetch("api/record_run.php", {
    method: "POST",
    body: JSON.stringify({ id: uid })
  });

  againBtn.onclick=()=>startGame(difficulty);
  homeBtn.onclick =showHome;
=======
  fetch("api/record_run.php",{
    method:"POST",
    body:JSON.stringify({id:uid})
  });

  againBtn.onclick = ()=>startGame(difficulty);
  homeBtn.onclick  = showHome;
>>>>>>> da53701 (vdvd)
}

/* ===== Init & Particles ===== */
dlg.showModal();
particlesJS("particles-js",{
  particles:{
    number:{value:20,density:{value_area:800}},
    shape:{type:"polygon",polygon:{nb_sides:6}},
    color:{value:"#ffffff"},
    opacity:{value:.5,random:true},
    size:{value:5,random:true},
    move:{enable:true,speed:3,random:true}
  },
  interactivity:{
    detect_on:"window",
    events:{
      onhover:{enable:true,mode:"repulse"},
      onclick:{enable:false}
    },
    modes:{repulse:{distance:150}}
  },
  retina_detect:true
});