import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
DRAW
====================== */
const drawLandmarks = (ctx, l) => {
  ctx.fillStyle = "#22c55e";
  for (const p of l) {
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

const drawConnectors = (ctx, l, c) => {
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  for (const [a, b] of c) {
    ctx.beginPath();
    ctx.moveTo(l[a].x * ctx.canvas.width, l[a].y * ctx.canvas.height);
    ctx.lineTo(l[b].x * ctx.canvas.width, l[b].y * ctx.canvas.height);
    ctx.stroke();
  }
};

const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
GESTOS PRO
====================== */
const thumbUp = (l) => {
  let vx = l[4].x - l[2].x;
  let vy = l[4].y - l[2].y;

  const mag = Math.hypot(vx, vy);
  vx /= mag;
  vy /= mag;

  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  const pointingUp = vy < -0.75;
  const notSideways = Math.abs(vx) < 0.45;

  return (
    pointingUp &&
    notSideways &&
    !index &&
    !middle &&
    !ring &&
    !pinky
  );
};

/* ======================
COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    const cam = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    cam.start();
    return () => cam.stop();
  }, []);

  const detectGesture = (l) => {
    if (thumbUp(l)) return "PULGAR ARRIBA 👍";

    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    const count = [index, middle, ring, pinky].filter(Boolean).length;

    if (count === 0) return "PUÑO ✊";
    if (index && middle && count === 2) return "PAZ ✌️";
    if (index && count === 1) return "APUNTAR ☝️";
    if (count === 4) return "MANO ABIERTA 🖐️";

    return `DEDOS: ${count}`;
  };

  const onResults = (r) => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(r.image, 0, 0, c.width, c.height);

    let g = "Sin mano";

    if (r.multiHandLandmarks) {
      for (const l of r.multiHandLandmarks) {
        drawConnectors(ctx, l, HAND_CONNECTIONS);
        drawLandmarks(ctx, l);
        g = detectGesture(l);
      }
    }

    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.strokeText(g, c.width / 2, 48);
    ctx.fillStyle = "#fff";
    ctx.fillText(g, c.width / 2, 48);
  };

  return (
    <div style={{ background: "#020617", minHeight: "100vh", padding: 16 }}>
      <canvas ref={canvasRef} width={640} height={480} />
      <video ref={videoRef} style={{ display: "none" }} />
    </div>
  );
}
