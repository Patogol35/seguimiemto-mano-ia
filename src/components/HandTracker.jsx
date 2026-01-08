import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS DRAW
====================== */
function drawLandmarks(ctx, l) {
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
}

function drawConnectors(ctx, l, connections) {
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  for (const [a, b] of connections) {
    ctx.beginPath();
    ctx.moveTo(l[a].x * ctx.canvas.width, l[a].y * ctx.canvas.height);
    ctx.lineTo(l[b].x * ctx.canvas.width, l[b].y * ctx.canvas.height);
    ctx.stroke();
  }
}

/* ======================
GESTOS BÁSICOS
====================== */
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* 👍 PULGAR ARRIBA ROBUSTO */
function isThumbUp(l) {
  const thumbTip = l[4];
  const thumbIP = l[3];
  const wrist = l[0];

  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  return (
    thumbTip.y < thumbIP.y &&     // pulgar estirado
    thumbTip.y < wrist.y &&       // pulgar arriba
    !index &&
    !middle &&
    !ring &&
    !pinky
  );
}

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

  function detectGesture(l) {
    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    if (isThumbUp(l)) return "PULGAR ARRIBA 👍";
    if (!index && !middle && !ring && !pinky) return "PUÑO ✊";
    if (index && middle && !ring && !pinky) return "PAZ ✌️";
    if (index && !middle && !ring && !pinky) return "APUNTAR ☝️";
    if (index && pinky && !middle && !ring) return "ROCK 🤟";
    if (index && middle && ring && pinky) return "MANO ABIERTA 🖐️";

    return "GESTO";
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* 📸 EFECTO ESPEJO (CÁMARA BIEN) */
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let gesture = "Sin mano";

    if (results.multiHandLandmarks) {
      for (const l of results.multiHandLandmarks) {
        drawConnectors(ctx, l, HAND_CONNECTIONS);
        drawLandmarks(ctx, l);
        gesture = detectGesture(l);
      }
    }

    ctx.font = "bold 32px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.strokeText(gesture, canvas.width / 2, 40);
    ctx.fillStyle = "#fff";
    ctx.fillText(gesture, canvas.width / 2, 40);
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
        gap: 12,
      }}
    >
      <h3 style={{ color: "#94a3b8", fontSize: 14 }}>
        Autor: Jorge Patricio Santamaría Cherrez
      </h3>

      <div
        style={{
          width: "100%",
          maxWidth: 640,
          aspectRatio: "4 / 3",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.4)",
          background: "#000",
        }}
      >
        <video ref={videoRef} style={{ display: "none" }} />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
