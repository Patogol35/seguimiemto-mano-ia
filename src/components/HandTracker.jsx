import { useEffect, useRef } from "react";
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
    dist(l[4], l[8]) < 0.045 &&
    fingerUp(l, 12, 10) &&
    fingerUp(l, 16, 14) &&
    fingerUp(l, 20, 18)
  );
}

/* ======================
CONTEO DE DEDOS (0–5) – CORREGIDO PARA AMBAS MANOS
====================== */
function countFingers(l, handedness) {
  let count = 0;

  // Pulgar: dirección depende de si es mano izquierda o derecha
  if (handedness === "Left") {
    if (l[4].x < l[3].x) count++; // Mano izquierda: pulgar extendido → x disminuye
  } else {
    if (l[4].x > l[3].x) count++; // Mano derecha: pulgar extendido → x aumenta
  }

  // Índice, medio, anular, meñique (misma lógica para ambas manos)
  if (fingerUp(l, 8, 6)) count++;
  if (fingerUp(l, 12, 10)) count++;
  if (fingerUp(l, 16, 14)) count++;
  if (fingerUp(l, 20, 18)) count++;

  return count;
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
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`, // ✅ sin espacio extra
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

    return () => {
      camera.stop();
    };
  }, []);

  function detectGesture(l) {
    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    if (isOK(l)) return "OK 👌";
    if (isThumbUp(l)) return "PULGAR ARRIBA 👍";
    if (isThumbDown(l)) return "PULGAR ABAJO 👎";
    if (!index && !middle && !ring && !pinky) return "PUÑO ✊";
    if (index && middle && ring && pinky) return "MANO ABIERTA 🖐️";
    if (index && middle && !ring && !pinky) return "PAZ ✌️";

    return "—";
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar video invertido horizontalmente (espejo)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let gesture = "Sin mano";
    let fingers = 0;

    if (results.multiHandLandmarks && results.multiHandedness) {
      // Soportamos una sola mano (maxNumHands: 1)
      const landmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness[0].label; // "Left" o "Right"

      gesture = detectGesture(landmarks);
      fingers = countFingers(landmarks, handedness);
    }

    /* HUD: Mostrar gesto y conteo */
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, 96);

    ctx.textAlign = "center";

    ctx.font = "bold 30px Segoe UI";
    ctx.fillStyle = gesture === "OK 👌" ? "#facc15" : "#22c55e";
    ctx.fillText(gesture, canvas.width / 2, 38);

    ctx.font = "bold 22px Segoe UI";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`Dedos: ${fingers}`, canvas.width / 2, 72);
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 20,
        gap: 12,
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 13 }}>
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
