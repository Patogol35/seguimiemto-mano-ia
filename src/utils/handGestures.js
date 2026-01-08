// src/utils/handGestures.js

/* ======================
UTILIDADES
====================== */
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
PULGAR (FIX REAL)
====================== */
export const isThumbOpen = (l) => {
  const thumbTip = l[4];
  const thumbIP = l[3];
  const thumbMCP = l[2];
  const indexMCP = l[5];

  // Separación lateral real
  const horizontalDist = Math.abs(thumbTip.x - indexMCP.x);

  // Pulgar extendido
  const extendedDist = dist(thumbTip, thumbMCP);

  // Evita puño (pulgar doblado)
  const foldedDist = dist(thumbTip, thumbIP);

  // Pulgar NO debe apuntar hacia la palma
  const notFoldedDown = thumbTip.y < thumbMCP.y + 0.02;

  return (
    horizontalDist > 0.045 &&
    extendedDist > 0.065 &&
    foldedDist > 0.035 &&
    notFoldedDown
  );
};

/* ======================
GESTOS
====================== */
export const detectGesture = (l) => {
  const thumb = isThumbOpen(l);
  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  const count = [thumb, index, middle, ring, pinky].filter(Boolean).length;

  if (count === 0) return "PUÑO ✊";
  if (thumb && count === 1) return "PULGAR ARRIBA 👍";
  if (index && middle && count === 2) return "PAZ ✌️";
  if (index && count === 1) return "APUNTAR ☝️";
  if (index && pinky && count === 2) return "ROCK 🤟";
  if (count === 5) return "MANO ABIERTA 🖐️";
  if (dist(l[4], l[8]) < 0.035) return "CLICK 👌";

  return `DEDOS: ${count}`;
};
