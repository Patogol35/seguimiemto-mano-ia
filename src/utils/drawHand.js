// src/utils/drawHand.js
import { HAND_CONNECTIONS } from "@mediapipe/hands";

export const drawLandmarks = (ctx, landmarks) => {
  ctx.fillStyle = "#22c55e";
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(
      p.x * ctx.canvas.width,
      p.y * ctx.canvas.height,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
};

export const drawConnectors = (ctx, landmarks) => {
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;

  for (const [a, b] of HAND_CONNECTIONS) {
    const p1 = landmarks[a];
    const p2 = landmarks[b];
    ctx.beginPath();
    ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
    ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
    ctx.stroke();
  }
};
