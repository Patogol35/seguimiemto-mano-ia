import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
DRAW
====================== */
const drawLandmarks = (ctx, l) => {
  ctx.fillStyle = "#22c55e";
  l.forEach(p => {
    ctx.beginPath();
    ctx.arc(
      p.x * ctx.canvas.width,
      p.y * ctx.canvas.height,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
};

const drawConnectors = (ctx, l, c) => {
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  c.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(l[a].x * ctx.canvas.width, l[a].y * ctx.canvas.height);
    ctx.lineTo(l[b].x * ctx.canvas.width, l[b].y * ctx.canvas.height);
    ctx.stroke();
  });
};

/* ======================
GESTOS BÁSICOS
====================== */
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* 👍 PULGAR ARRIBA SIMPLE Y ESTABLE */
const thumbUp = (l) => {
  const thumbTip = l[4];
  const indexTip = l[8];
  const wrist = l[0];

  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  return (
    thumbTip.y < wrist.y &&      // pulgar arriba
    thumbTip.y < indexTip.y &&   // más alto que el índice
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
      locateFile: f =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    return () => camera.stop();
  }, []);

  const detectGesture = (l) => {
    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    if (thumbUp(l)) return "PULGAR ARRIBA 👍";
    if (!index && !middle && !ring && !pinky) return "PUÑO ✊";
    if (index && middle && !ring && !pinky) return "PAZ ✌️";
    if (index && !middle && !ring && !pinky) return "APUNTAR ☝️";
    if (index && pinky && !middle && !ring) return "ROCK 🤟";
    if (index && middle && ring && pinky) return "MANO ABIERTA 🖐️";

    return "GESTO";
  };

  const onResults = (r) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(r.image, 0, 0, canvas.width, canvas.height);

    let gesture = "Sin mano";

    if (r.multiHandLandmarks) {
      r.multiHandLandmarks.forEach(l => {
        drawConnectors(ctx, l, HAND_CONNECTIONS);
        drawLandmarks(ctx, l);
        gesture = detectGesture(l);
      });
    }

    ctx.font = "bold 32px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.strokeText(gesture, canvas.width / 2, 40);
    ctx.fillStyle = "#fff";
    ctx.fillText(gesture, canvas.width / 2, 40);
  };

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
      }}
    >
      <h3 style={{ color: "#94a3b8", fontSize: 14 }}>
        Autor: Jorge Patricio Santamaría Cherrez
      </h3>

      <div
        style={{
          maxWidth: 640,
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,.4)",
        }}
      >
        <video ref={videoRef} style={{ display: "none" }} />
        <canvas ref={canvasRef} width={640} height={480} />
      </div>
    </div>
  );
}
