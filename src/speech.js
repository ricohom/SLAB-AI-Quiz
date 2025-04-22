// ---------- speech.js ----------
export class SpeechService {
  constructor(lang = "de-DE") {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.lang  = lang;
    this._loadVoices();

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SR();
      this.recognition.lang = lang;
      this.recognition.interimResults = false;
      this.recognition.continuous = false;
    } else {
      this.recognition = null;
    }
  }

  _loadVoices() {
    const pick = () => {
      const voices = this.synth.getVoices();
      this.voice =
        voices.find(v => v.lang.startsWith("de") && /male|deep|standard/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith("de")) ||
        voices[0];
    };
    pick();
    if (!this.voice) window.speechSynthesis.onvoiceschanged = pick;
  }

  speak(text) {
    return new Promise(res => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang  = this.lang;
      u.voice = this.voice;
      u.onend = () => res();
      this.synth.speak(u);
    });
  }

  listen() {
    return new Promise((resolve, reject) => {
      if (!this.recognition) return reject("STT nicht unterstützt");
      this.recognition.onresult = e => resolve(e.results[0][0].transcript.trim());
      this.recognition.onerror  = e => reject(e.error);
      this.recognition.start();
    });
  }
}