// ---------- speech.js ----------
// Ein schlanker Wrapper für STT & TTS im Browser

export class SpeechService {
    constructor(lang = "de-DE") {
      // ---- TTS ----
      this.synth = window.speechSynthesis;
      this.voice = null;
      this.lang = lang;
      this._loadVoices();
  
      // ---- STT ----
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
  
    // Wählt bevorzugt eine deutsche männliche Stimme, falls verfügbar
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
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = this.voice;
        utter.lang = this.lang;
        utter.onend = () => res();
        this.synth.speak(utter);
      });
    }
  
    listen() {
      return new Promise((resolve, reject) => {
        if (!this.recognition) return reject(new Error("STT nicht unterstützt"));
        this.recognition.onresult = e => resolve(e.results[0][0].transcript.trim());
        this.recognition.onerror = e => reject(e.error);
        this.recognition.start();
      });
    }
  }