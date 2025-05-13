/* src/storage.js
 * Mini-Wrapper für Highscore in localStorage
 * ----------------------------------------- */

const KEY = "quiz-highscore";

export function loadHighscore() {
  return Number(localStorage.getItem(KEY) || 0);
}

export function saveHighscore(points) {
  const best = loadHighscore();
  if (points > best) {
    localStorage.setItem(KEY, points);
  }
}