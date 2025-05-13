import { fetchQuestion } from "./question.js";
import { loadHighscore, saveHighscore } from "./storage.js";

/* ------- Config ------- */
const DIFF = {
  easy:   { plus:10, minus:5 },
  normal: { plus:20, minus:10 },
  hard:   { plus:40, minus:20 }
};
const RANKS = [
  { n:"Bronze",  min:0,   svg:"bronze"  },
  { n:"Silver",  min:200, svg:"silver"  },
  { n:"Gold",    min:400, svg:"gold"    },
  { n:"Platin",  min:700, svg:"platin"  },
  { n:"Diamond", min:1000,svg:"diamond" },
  { n:"Master",  min:1300,svg:"master"  }
];

/* ------- State ------- */
const app       = document.getElementById("app");
const btnLogout = document.getElementById("btnLogout");
const dlg       = document.getElementById("authDialog");
const userF     = document.getElementById("authUser");
const passF     = document.getElementById("authPass");
const errF      = document.getElementById("authError");
const swapBtn   = document.getElementById("authSwap");
let isSignup=false;

/* --- Enter-Taste triggert „OK“ --- */
[userF, passF].forEach(inp => {
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("authOK").click();
      }
    });
  });

let difficulty = "normal";
let qCount=0, points=0;
let uid=null, username="";

/* ------- Auth -------- */
swapBtn.onclick = () => {
  isSignup=!isSignup;
  document.getElementById("authTitle").textContent = isSignup?"Registrieren":"Login";
  document.getElementById("swapText").textContent  = isSignup?"Einloggen":"Registrieren";
  errF.textContent="";
};

document.getElementById("authOK").onclick = async () => {
  errF.textContent="";
  const u=userF.value.trim(), p=passF.value.trim();
  if(!u||!p){errF.textContent="Bitte ausfüllen";return;}

  const url=isSignup?"api/signup.php":"api/login.php";
  const res=await fetch(url,{method:"POST",body:JSON.stringify({username:u,password:p})});
  const data=await res.json();
  if(!res.ok){errF.textContent=data.error||"Fehler";return;}

  if(isSignup){
    uid = await quickLogin(u,p).then(d=>d.id);
  }else{
    uid=data.id; points=data.points;
  }
  username=u;
  dlg.close();
  btnLogout.classList.remove("hidden");
  tplMenu();
};

async function quickLogin(u,p){
  const r=await fetch("api/login.php",{method:"POST",body:JSON.stringify({username:u,password:p})});
  return r.json();
}

btnLogout.onclick = logout;
function logout(){
  uid=null; username=""; points=0;
  sessionStorage.clear();
  btnLogout.classList.add("hidden");
  userF.value=passF.value="";
  isSignup=false;
  document.getElementById("authTitle").textContent="Login";
  document.getElementById("swapText").textContent="Registrieren";
  errF.textContent="";
  dlg.showModal();
}

/* ------- Templates ------- */
function tplMenu(){
  app.innerHTML=`
    <h2>🎓 Quiz-Master</h2>
    <p>Willkommen, <strong>${username}</strong>!</p>

    <button class="btn primary" data-diff="easy">Einfach</button>
    <button class="btn primary" data-diff="normal">Mittel</button>
    <button class="btn primary" data-diff="hard">Schwer</button>

    <p>🏆 Highscore: ${loadHighscore()} P</p>
    <button class="btn" id="btnBoard">Leaderboard</button>`;

  [...app.querySelectorAll("[data-diff]")]
    .forEach(b => b.onclick = () => startGame(b.dataset.diff));

  document.getElementById("btnBoard").onclick = showBoard;
}

function tplGame(qObj){
  const {q,A,B,C,D}=qObj;
  app.innerHTML=`
    <div class="scoreboard">
      <span id="pts">${points}</span> P · <span id="rank">${rankBadge(points)}</span>
    </div>
    <p>${qCount}/10 · Schwierigkeit: ${difficulty}</p>
    <h3>${q}</h3>
    <div id="answers">
      <button class="btn" data-label="A">A) ${A}</button>
      <button class="btn" data-label="B">B) ${B}</button>
      <button class="btn" data-label="C">C) ${C}</button>
      <button class="btn" data-label="D">D) ${D}</button>
    </div>
    <p id="feedback"></p>`;

  [...app.querySelectorAll("#answers button")]
    .forEach(b => b.onclick = () => evaluate(b,qObj));
}

function tplEnd(){
  saveHighscore(points);
  fetch("api/post_score.php",{method:"POST",body:JSON.stringify({id:uid,points})});

  app.innerHTML=`
    <h2>Ergebnis</h2>
    <p>Du hast <strong>${points} P</strong> erreicht.</p>
    <p>Rank: ${rankBadge(points)}</p>
    <p>Highscore: ${loadHighscore()} P</p>
    <button class="btn primary" id="again">Nochmal spielen</button>
    <button class="btn" id="menu">Zurück zum Menü</button>`;

  document.getElementById("again").onclick = () => startGame(difficulty);
  document.getElementById("menu").onclick  = tplMenu;
}

/* ------- Game Flow ------- */
function startGame(diff){
  difficulty=diff; qCount=0; points=0; nextQuestion();
}
async function nextQuestion(){
  if(qCount>=10){tplEnd();return;}
  qCount++;
  const q=await fetchQuestion();
  tplGame(q);
}
function evaluate(btn,q){
  [...btn.parentNode.children].forEach(b=>b.disabled=true);
  const {plus,minus}=DIFF[difficulty];
  const correct = btn.dataset.label===q.r;
  points += correct ? plus : -minus;
  if(points<0) points=0;

  if(correct){btn.classList.add("correct");}
  else{
    btn.classList.add("wrong");
    app.querySelector(`[data-label="${q.r}"]`)?.classList.add("correct");
  }
  document.getElementById("pts").textContent = points;
  document.getElementById("rank").innerHTML  = rankBadge(points);
  document.getElementById("feedback").textContent = correct
     ? `✅ +${plus} P`
     : `❌ -${minus} P (richtig: ${q.r})`;

  setTimeout(nextQuestion,1200);
}

/* ------- Leaderboard ------- */
async function showBoard(){
  const res=await fetch("api/leaderboard.php");
  const data=await res.json();
  alert("Leaderboard:\n\n"+data.map((r,i)=>`${i+1}. ${r.username} – ${r.points} P`).join("\n"));
}

/* ------- Helper ------- */
function rankBadge(pts){
  const r=RANKS.slice().reverse().find(r=>pts>=r.min)||RANKS[0];
  return `<span class="rank rank-${r.n}"><img src="assets/${r.svg}.svg" alt="">${r.n}</span>`;
}

/* ------- Init ------- */
dlg.showModal();

/* ------- Particles Hintergrund ------- */
particlesJS("particles-js",{
  particles:{number:{value:20,density:{enable:true,value_area:800}},
    shape:{type:"polygon",polygon:{nb_sides:6}},color:{value:"#ffffff"},
    opacity:{value:0.5,random:true},size:{value:5,random:true},
    move:{enable:true,speed:3,direction:"none",random:true}},
  interactivity:{detect_on:"window",
    events:{onhover:{enable:true,mode:"repulse"},onclick:{enable:false}},
    modes:{repulse:{distance:150,duration:0.4}}},
  retina_detect:true
});