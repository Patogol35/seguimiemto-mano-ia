// src/utils/handGestures.js

export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

export const detectGesture = (l) => {
  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  const thumbOpen =
    dist(l[4], l[5]) > dist(l[3], l[5]) * 1.2 &&
    l[4].y < l[2].y;

  // 👊 PUÑO PRIMERO
  if (!thumbOpen && !index && !middle && !ring && !pinky) {
    return "PUÑO ✊";
  }

  const count = [thumbOpen, index, middle, ring, pinky].filter(Boolean).length;

  if (thumbOpen && count === 1) return "PULGAR ARRIBA 👍";
  if (index && middle && count === 2) return "PAZ ✌️";
  if (index && count === 1) return "APUNTAR ☝️";
  if (index && pinky && count === 2) return "ROCK 🤟";
  if (count === 5) return "MANO ABIERTA 🖐️";
  if (dist(l[4], l[8]) < 0.035) return "CLICK 👌";

  return `DEDOS: ${count}`;
};
