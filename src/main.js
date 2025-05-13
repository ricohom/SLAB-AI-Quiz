import { fetchQuestion } from "./question.js";

/* ----- Config ------------------------------ */
const DIFF = {
  easy  : {plus:10, minus:5 },
  normal: {plus:20, minus:10},
  hard  : {plus:40, minus:20}
};
const RANKS=[
  {n:"Bronze", min:0,    svg:"bronze"},
  {n:"Silver", min:200,  svg:"silver"},
  {n:"Gold",   min:400,  svg:"gold"},
  {n:"Platin", min:700,  svg:"platin"},
  {n:"Diamond",min:1000, svg:"diamond"},
  {n:"Master", min:1300, svg:"master"}
];

/* ----- DOM Refs ---------------------------- */
const app       = document.getElementById("app");
const btnLogout = document.getElementById("btnLogout");
const dlg       = document.getElementById("authDialog");
const userF     = document.getElementById("authUser");
const passF     = document.getElementById("authPass");
const errF      = document.getElementById("authError");
const swapBtn   = document.getElementById("authSwap");

/* ----- Auth State -------------------------- */
let isSignup=false;
let uid=null, username="", pointsDB=0;

/* ----- Game State -------------------------- */
let difficulty="normal";
let qCount=0, runPoints=0;

/* ----- Auth Dialog ------------------------- */
swapBtn.onclick=()=>{
  isSignup=!isSignup;
  document.getElementById("authTitle").textContent=isSignup?"Registrieren":"Login";
  document.getElementById("swapText").textContent =isSignup?"Einloggen":"Registrieren";
  errF.textContent="";
};

/* Enter = OK */
[userF,passF].forEach(i=>i.addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();document.getElementById("authOK").click();}
}));

document.getElementById("authOK").onclick=async()=>{
  errF.textContent="";
  const u=userF.value.trim(), p=passF.value.trim();
  if(!u||!p){errF.textContent="Bitte ausfüllen";return;}

  const url=isSignup?"api/signup.php":"api/login.php";
  const res=await fetch(url,{method:"POST",body:JSON.stringify({username:u,password:p})});
  const data=await res.json();
  if(!res.ok){errF.textContent=data.error||"Fehler";return;}

  if(isSignup){
    const r=await fetch("api/login.php",{method:"POST",body:JSON.stringify({username:u,password:p})});
    const d=await r.json(); uid=d.id; pointsDB=d.points;
  }else{ uid=data.id; pointsDB=data.points; }

  username=u; dlg.close(); btnLogout.classList.remove("hidden"); tplMenu();
};

btnLogout.onclick=logout;
function logout(){
  uid=null;username="";pointsDB=0;
  btnLogout.classList.add("hidden");
  userF.value=passF.value="";isSignup=false;errF.textContent="";
  dlg.showModal();
}

/* ----- Templates --------------------------- */
function tplMenu(){
  app.innerHTML=`
    <h2>🎓 Quiz-Master</h2>
    <p>Willkommen, <strong>${username}</strong>!</p>

    <button class="btn primary" data-diff="easy">Einfach</button>
    <button class="btn primary" data-diff="normal">Mittel</button>
    <button class="btn primary" data-diff="hard">Schwer</button>

    <p>Aktueller Score: <strong>${pointsDB} P</strong><br>
       Rang: ${rankBadge(pointsDB)}</p>

    <button class="btn" id="btnBoard">Leaderboard</button>`;

  [...app.querySelectorAll("[data-diff]")].forEach(b=>b.onclick=()=>startGame(b.dataset.diff));
  document.getElementById("btnBoard").onclick = tplLeaderboard;
}

function tplGame(q){
  const {q:Q,A,B,C,D}=q;
  app.innerHTML=`
    <div class="scoreboard">
  <span id="rank">${rankBadge(pointsDB)}</span>
  <span id="pts">${pointsDB} P</span>
    </div>
    <p>${qCount}/10 · Schwierigkeit: ${difficulty}</p>
    <h3>${Q}</h3>
    <div id="answers">
      <button class="btn" data-label="A">A) ${A}</button>
      <button class="btn" data-label="B">B) ${B}</button>
      <button class="btn" data-label="C">C) ${C}</button>
      <button class="btn" data-label="D">D) ${D}</button>
    </div>
    <p id="feedback"></p>`;

  [...app.querySelectorAll("#answers button")]
    .forEach(b=>b.onclick=()=>evaluate(b,q));
}

function tplEnd(){
  /* best-run lokal als Komfort (optional) */
  const bestRun = Number(localStorage.getItem("bestRun")||0);
  if(runPoints>bestRun) localStorage.setItem("bestRun",runPoints);

  app.innerHTML=`
    <h2>Run beendet</h2>
    <p>Run-Punkte: <strong>${runPoints} P</strong></p>
    <p>Gesamt-Score: ${pointsDB} P</p>
    <p>Rank: ${rankBadge(pointsDB)}</p>
    <button class="btn primary" id="again">Nochmal spielen</button>
    <button class="btn" id="menu">Menü</button>`;

  document.getElementById("again").onclick=()=>startGame(difficulty);
  document.getElementById("menu").onclick =tplMenu;
}

/* ----- Game Flow --------------------------- */
function startGame(diff){
  difficulty=diff; qCount=0; runPoints=0; nextQuestion();
}
async function nextQuestion(){
  if(qCount>=10){tplEnd();return;}
  qCount++;
  tplGame(await fetchQuestion());
}
async function evaluate(btn,q){
  [...btn.parentNode.children].forEach(b=>b.disabled=true);
  const {plus,minus}=DIFF[difficulty];
  const correct = btn.dataset.label===q.r;
  const delta   = correct ? plus : -minus;
  runPoints += delta;
  pointsDB  += delta; if(pointsDB<0) pointsDB=0;

  /* visuelles Feedback */
  if(correct){btn.classList.add("correct");}
  else{
    btn.classList.add("wrong");
    app.querySelector(`[data-label="${q.r}"]`)?.classList.add("correct");
  }
  document.getElementById("pts").textContent = pointsDB;
  document.getElementById("rank").innerHTML  = rankBadge(pointsDB);
  document.getElementById("feedback").textContent =
    correct?`✅ +${plus} P`:`❌ -${minus} P (richtig: ${q.r})`;

  /* Score sofort an DB senden */
  await fetch("api/post_score.php",{method:"POST",body:JSON.stringify({id:uid,delta})});
  setTimeout(nextQuestion,1200);
}

/* ----- Helper ------------------------------ */
function rankBadge(pts){
    const r=RANKS.slice().reverse().find(r=>pts>=r.min)||RANKS[0];
    return `<span class="rank rank-${r.n}">
              <img src="assets/${r.svg}.png" alt="">
              <span>${r.n}</span>
            </span>`;
  }

/* ----- Start App --------------------------- */
dlg.showModal();

/* ----- Particles --------------------------- */
particlesJS("particles-js",{
  particles:{number:{value:20,density:{value_area:800}},
    shape:{type:"polygon",polygon:{nb_sides:6}},color:{value:"#ffffff"},
    opacity:{value:.5,random:true},size:{value:5,random:true},
    move:{enable:true,speed:3,random:true}},
  interactivity:{detect_on:"window",
    events:{onhover:{enable:true,mode:"repulse"}},modes:{repulse:{distance:150}}},
  retina_detect:true
});

async function tplLeaderboard(){
    /* Daten holen */
    const resp = await fetch("api/leaderboard.php");
    const rows = await resp.json();
  
    /* HTML erzeugen */
    app.innerHTML = `
      <h2>🏆 Leaderboard</h2>
      <button class="btn" id="backBtn">Zurück</button>
  
      <table class="board">
        <thead>
          <tr><th>#</th><th>Spieler</th><th class="rank-col">Rang</th><th>Punkte</th></tr>
        </thead>
        <tbody>
          ${rows.map((r,i)=>`
            <tr>
              <td>${i+1}</td>
              <td>${r.username}</td>
              <td class="rank-col">${rankBadge(r.points)}</td>
              <td>${r.points}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
    document.getElementById("backBtn").onclick = tplMenu;
  }