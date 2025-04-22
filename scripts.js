// === Particles.js Konfiguration ===
particlesJS("particles-js", {
    particles: {
      number: {
        value: 20,
        density: { enable: true, value_area: 800 }
      },
      shape: {
        type: "polygon",
        polygon: { nb_sides: 6 }
      },
      color: { value: "#ffffff" },
      opacity: { value: 0.5, random: true },
      size: { value: 5, random: true },
      move: {
        enable: true,
        speed: 3,
        direction: "none",
        random: true,
        attract: { enable: false }
      }
    },
    interactivity: {
      detect_on: "window",
      events: {
        onhover: { enable: true, mode: "repulse" },
        onclick: { enable: false }
      },
      modes: {
        repulse: { distance: 150, duration: 0.4 }
      }
    },
    retina_detect: true
  });
  
  // === AOS ===
  AOS.init({ duration: 1200 });
  
  // === Anime.js ===
  anime({
    targets: '.gradient-text',
    translateY: [-50, 0],
    opacity: [0, 1],
    easing: 'easeOutExpo',
    duration: 1500,
    delay: 500
  });
  
  // === Rellax.js ===
  const rellax = new Rellax('.moderator-img');
  
  // === Cursor-Trail Kreise ===
  const numCircles = 20;
  const coords = { x: 0, y: 0 };
  for (let i = 0; i < numCircles; i++) {
    const div = document.createElement("div");
    div.className = "circle";
    document.body.appendChild(div);
  }
  const circles = document.querySelectorAll(".circle");
  const colors = ["#1abc9c","#1eb7a5","#22b2ae","#26adb7","#2aa8c0","#2ea3c9","#329ed2","#3498db"];
  circles.forEach((circle, index) => {
    circle.x = 0;
    circle.y = 0;
    circle.style.backgroundColor = colors[index % colors.length];
  });
  window.addEventListener("mousemove", (e) => {
    coords.x = e.clientX;
    coords.y = e.clientY;
  });
  function animateCircles() {
    let x = coords.x;
    let y = coords.y;
    circles.forEach((circle, index) => {
      circle.style.left = `${x - 12}px`;
      circle.style.top = `${y - 12}px`;
      circle.style.transform = `translate(-50%, -50%) scale(${(circles.length - index) / circles.length})`;
      circle.x = x;
      circle.y = y;
      const next = circles[index + 1] || circles[0];
      x += (next.x - x) * 0.3;
      y += (next.y - y) * 0.3;
    });
    requestAnimationFrame(animateCircles);
  }
  animateCircles();
  
  // === Splash bei Klick ===
  window.addEventListener("mousedown", (e) => {
    const splash = document.createElement("div");
    splash.className = "splash";
    splash.style.left = `${e.clientX}px`;
    splash.style.top = `${e.clientY}px`;
    document.body.appendChild(splash);
    setTimeout(() => splash.remove(), 600);
  });
  
  // === Spracheingabe (STT) ===
  const startBtn = document.getElementById("start-stt");
  const output = document.getElementById("stt-output");
  
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = true;
    recognition.continuous = false;
  
    recognition.onstart = () => {
      startBtn.innerText = "🎙️ Sprich jetzt …";
      startBtn.disabled = true;
    };
    recognition.onend = () => {
      startBtn.innerText = "🎙️ Spracheingabe starten";
      startBtn.disabled = false;
    };
    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalText += event.results[i][0].transcript;
      }
      output.value = finalText;
    };
    startBtn.onclick = () => {
      output.value = "";
      recognition.start();
    };
  } else {
    startBtn.disabled = true;
    output.placeholder = "STT wird in diesem Browser nicht unterstützt.";
  }