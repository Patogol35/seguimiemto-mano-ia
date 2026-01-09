import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
GESTOS
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
CONTEO CORRECTO
====================== */
function countFingers(l, hand) {
  let count = 0;

  // Pulgar (izq / der)
  if (hand === "Right") {
    if (l[4].x > l[3].x) count++;
  } else {
    if (l[4].x < l[3].x) count++;
  }

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
  const [landscape, setLandscape] = useState(
    window.matchMedia("(orientation: landscape)").matches
  );

  /* Detectar orientación */
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = (e) => setLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* MediaPipe */
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
    const i = fingerUp(l, 8, 6);
    const m = fingerUp(l, 12, 10);
    const r = fingerUp(l, 16, 14);
    const p = fingerUp(l, 20, 18);

    if (isOK(l)) return "OK 👌";
    if (isThumbUp(l)) return "PULGAR ARRIBA 👍";
    if (isThumbDown(l)) return "PULGAR ABAJO 👎";
    if (!i && !m && !r && !p) return "PUÑO ✊";
    if (i && m && r && p) return "MANO ABIERTA 🖐️";
    if (i && m && !r && !p) return "PAZ ✌️";

    return "—";
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let gesture = "Sin mano";
    let fingers = 0;

    if (results.multiHandLandmarks) {
      const l = results.multiHandLandmarks[0];
      const hand =
        results.multiHandedness?.[0]?.label || "Right";

      gesture = detectGesture(l);
      fingers = countFingers(l, hand);
    }

    /* HUD */
    ctx.fillStyle = "rgba(2,6,23,0.75)";
    ctx.fillRect(0, 0, canvas.width, landscape ? 70 : 90);

    ctx.textAlign = "center";
    ctx.font = landscape ? "bold 26px Segoe UI" : "bold 30px Segoe UI";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(gesture, canvas.width / 2, 32);

    ctx.font = "bold 20px Segoe UI";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`Dedos: ${fingers}`, canvas.width / 2, 58);
  }

  return (
    <div
      style={{
        height: "100dvh",
        background: "#020617",
        display: "flex",
        flexDirection: landscape ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: landscape ? 24 : 8,
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      {/* PANEL INFO (solo landscape) */}
      {landscape && (
        <div
          style={{
            color: "#94a3b8",
            fontSize: 14,
            maxWidth: 220,
            lineHeight: 1.4,
          }}
        >
          <b>Hand Tracker</b>
          <br />
          Gestos en tiempo real
          <br />
          MediaPipe Hands
        </div>
      )}

      {/* CAMARA */}
      <div
        style={{
          width: landscape ? "70%" : "100%",
          maxWidth: 720,
          aspectRatio: "4 / 3",
          maxHeight: landscape ? "85dvh" : "75dvh",
          borderRadius: 22,
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.5)",
          boxShadow: "0 0 40px rgba(34,197,94,0.15)",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          style={{ display: "none" }}
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {!landscape && (
        <div style={{ fontSize: 11, color: "#64748b" }}>
          © Jorge Patricio Santamaría Cherrez
        </div>
      )}
    </div>
  );
    }
