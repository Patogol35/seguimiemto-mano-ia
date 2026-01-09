import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
PULGAR ROBUSTO
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
  const upY = l[4].y < l[2].y - 0.02;
  const separatedX = Math.abs(l[4].x - l[3].x) > 0.04;
  return thumbExtended(l) && fingersClosed(l) && (upY || separatedX);
}

function isThumbDown(l) {
  const downY = l[4].y > l[2].y + 0.02;
  const separatedX = Math.abs(l[4].x - l[3].x) > 0.04;
  return thumbExtended(l) && fingersClosed(l) && (downY || separatedX);
}

/* ======================
SUAVIZADO (BUFFER + VOTO)
====================== */
function smoothValue(buffer, value, size = 8) {
  buffer.current.push(value);
  if (buffer.current.length > size) buffer.current.shift();

  const map = {};
  buffer.current.forEach((v) => {
    map[v] = (map[v] || 0) + 1;
  });

  return Object.entries(map).sort((a, b) => b[1] - a[1])[0][0];
}

/* ======================
COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const fingerBuffer = useRef([]);
  const handBuffer = useRef([]);

  const [count, setCount] = useState(0);
  const [handedness, setHandedness] = useState("—");

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

  /* ======================
DETECCIÓN
====================== */
  function countFingers(l) {
    let total = 0;
    if (fingerUp(l, 8, 6)) total++;
    if (fingerUp(l, 12, 10)) total++;
    if (fingerUp(l, 16, 14)) total++;
    if (fingerUp(l, 20, 18)) total++;
    if (thumbExtended(l)) total++;
    return total;
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* espejo */
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (results.multiHandLandmarks?.length) {
      const l = results.multiHandLandmarks[0];

      /* MANO IZQ / DER */
      const rawHand = results.multiHandedness[0].label;
      const stableHand = smoothValue(handBuffer, rawHand);
      setHandedness(stableHand === "Left" ? "Izquierda" : "Derecha");

      /* CONTADOR */
      const rawCount = countFingers(l);
      const stableCount = smoothValue(fingerBuffer, rawCount);
      setCount(Number(stableCount));
    } else {
      setCount(0);
      setHandedness("—");
      fingerBuffer.current = [];
      handBuffer.current = [];
    }

    /* HUD */
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, 72);

    ctx.font = "bold 26px system-ui";
    ctx.fillStyle = "#22c55e";
    ctx.textAlign = "left";
    ctx.fillText(`Dedos: ${count}`, 16, 30);
    ctx.fillText(`Mano: ${handedness}`, 16, 58);
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
        gap: 10,
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 13 }}>
        Autor: Jorge Patricio Santamaría Cherrez
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 720,
          aspectRatio: "4 / 3",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.4)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
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
