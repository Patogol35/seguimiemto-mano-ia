// src/utils/handGestures.js

/* ======================
UTILIDADES
====================== */
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Dedo levantado (excepto pulgar)
export const fingerUp = (l, tip, pip) => {
  return l[tip].y < l[pip].y;
};

/* ======================
PULGAR (LÓGICA ESTABLE)
====================== */
export const isThumbOpen = (l) => {
  const tip = l[4];
  const ip = l[3];
  const mcp = l[2];
  const indexMCP = l[5];

  // 1️⃣ Separación lateral (clave)
  const lateral = Math.abs(tip.x - indexMCP.x);

  // 2️⃣ Pulgar extendido (tip lejos del MCP)
  const extended = dist(tip, mcp);

  // 3️⃣ Pulgar NO plegado (tip lejos del IP)
  const notFolded = dist(tip, ip);

  // 4️⃣ Evita puño: tip no debe estar cerca del centro de la mano
  const palmCenterY =
    (l[0].y + l[5].y + l[17].y) / 3;

  const notInsidePalm = tip.y < palmCenterY + 0.03;

  return (
    lateral > 0.035 &&
    extended > 0.055 &&
    notFolded > 0.03 &&
    notInsidePalm
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

  const fingers = [thumb, index, middle, ring, pinky];
  const count = fingers.filter(Boolean).length;

  // 👊 PUÑO: ningún dedo extendido
  if (!thumb && !index && !middle && !ring && !pinky) {
    return "PUÑO ✊";
  }

  if (thumb && count === 1) return "PULGAR ARRIBA 👍";
  if (index && middle && count === 2) return "PAZ ✌️";
  if (index && count === 1) return "APUNTAR ☝️";
  if (index && pinky && count === 2) return "ROCK 🤟";
  if (count === 5) return "MANO ABIERTA 🖐️";

  // 👌 CLICK
  if (dist(l[4], l[8]) < 0.035) return "CLICK 👌";

  return `DEDOS: ${count}`;
};
