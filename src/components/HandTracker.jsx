import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
GESTOS ROBUSTOS
====================== */
function thumbExtended(l) {
  return dist(l[4], l[2]) > dist(l[5], l[0]) * 0.6;
}

function fingersClosed(l) {
  const w = l[0];
  return (
    dist(l[8], w) < dist(l[5], w) * 0.9 &&
    dist(l[12], w) < dist(l[9], w) * 0.9 &&
    dist(l[16], w) < dist(l[13], w) * 0.9 &&
    dist(l[20], w) < dist(l[17], w) * 0.9
  );
}

function isThumbUp(l) {
  return thumbExtended(l) && l[4].y < l[2].y && fingersClosed(l);
}

function isThumbDown(l) {
  return thumbExtended(l) && l[4].y > l[2].y && fingersClosed(l);
}

function isOK(l) {
  return (
    dist(l[4], l[8]) < 0.04 &&
    fingerUp(l, 12, 10) &&
    fingerUp(l, 16, 14) &&
    fingerUp(l, 20, 18)
  );
}

/* ======================
COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Cargando modelo...");

  useEffect(() => {
    let hands;
    let camera;

    try {
      hands = new Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`, // ✅ Corregido
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults(onResults);

      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      camera.start();
      setStatus("Listo");
    } catch (err) {
      console.error("Error al iniciar MediaPipe:", err);
      setStatus("⚠️ Error: no se pudo iniciar la cámara o el modelo");
    }

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  function detectGesture(l) {
    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    if (isThumbUp(l)) return "PULGAR ARRIBA 👍";
    if (isThumbDown(l)) return "PULGAR ABAJO 👎";
    if (isOK(l)) return "OK 👌";
    if (!index && !middle && !ring && !pinky) return "PUÑO ✊";
    if (index && middle && ring && pinky) return "MANO ABIERTA 🖐️";
    if (index && middle && !ring && !pinky) return "PAZ ✌️";
    if (index && !middle && !ring && !pinky) return "APUNTAR ☝️";
    if (index && pinky && !middle && !ring) return "ROCK 🤟";
    return "—";
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let gesture = "✋ Coloca tu mano frente a la cámara";
    let textColor = "#eab308"; // amarillo suave

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      gesture = detectGesture(results.multiHandLandmarks[0]);
      textColor = "#22c55e"; // verde
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, 56);
    ctx.font = "bold 28px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = textColor;
    ctx.fillText(gesture, canvas.width / 2, 38);
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "linear-gradient(180deg,#020617,#020617)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 20,
        gap: 12,
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: 13,
          letterSpacing: 0.4,
        }}
      >
        Autor: Jorge Patricio Santamaría Cherrez
      </div>

      {/* Mensaje de estado global (fuera del canvas) */}
      <div
        style={{
          color: status.includes("Error") ? "#ef4444" : "#64748b",
          fontSize: 14,
          textAlign: "center",
          maxWidth: 640,
          marginBottom: -8,
        }}
      >
        {status}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 640,
          aspectRatio: "4 / 3",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.4)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
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
