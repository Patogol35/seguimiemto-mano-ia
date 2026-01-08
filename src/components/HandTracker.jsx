import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Versión mejorada: verifica que la punta esté arriba de PIP y PIP arriba de MCP
const fingerUp = (l, tip, pip, mcp) => l[tip].y < l[pip].y && l[pip].y < l[mcp].y;

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
  const thumbToIndex = dist(l[4], l[8]);
  const wristToMiddleMCP = dist(l[0], l[9]);
  // Asegura que los otros dedos estén cerrados
  const middleClosed = !fingerUp(l, 12, 10, 9);
  const ringClosed = !fingerUp(l, 16, 14, 13);
  const pinkyClosed = !fingerUp(l, 20, 18, 17);
  return thumbToIndex < wristToMiddleMCP * 0.3 && middleClosed && ringClosed && pinkyClosed;
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
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`, // ⚠️ quitado espacio extra
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
    const indexUp = fingerUp(l, 8, 6, 5);
    const middleUp = fingerUp(l, 12, 10, 9);
    const ringUp = fingerUp(l, 16, 14, 13);
    const pinkyUp = fingerUp(l, 20, 18, 17);

    if (isThumbUp(l)) return "PULGAR ARRIBA 👍";
    if (isThumbDown(l)) return "PULGAR ABAJO 👎";
    if (isOK(l)) return "OK 👌";
    if (!indexUp && !middleUp && !ringUp && !pinkyUp && dist(l[4], l[0]) < 0.15)
      return "PUÑO ✊";
    if (indexUp && middleUp && ringUp && pinkyUp) return "MANO ABIERTA 🖐️";
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "PAZ ✌️";
    if (indexUp && !middleUp && !ringUp && !pinkyUp) return "APUNTAR ☝️";
    if (indexUp && !middleUp && !ringUp && pinkyUp) return "ROCK 🤟";

    return "—";
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Espejo horizontal
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let gesture = "Sin mano";

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Solo usamos la primera mano (máx 1 por configuración)
      gesture = detectGesture(results.multiHandLandmarks[0]);
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, 56);

    ctx.font = "bold 28px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#22c55e";
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
