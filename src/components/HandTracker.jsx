import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
PULGAR (ROBUSTO)
====================== */
function thumbUp(l) {
  const extended = dist(l[4], l[2]) > dist(l[5], l[0]) * 0.55;
  const up = l[4].y < l[2].y - 0.02;
  const side = Math.abs(l[4].x - l[3].x) > 0.04;
  return extended && (up || side);
}

/* ======================
CONTADOR DE DEDOS REAL
====================== */
function countFingers(l) {
  let count = 0;

  if (thumbUp(l)) count++;
  if (fingerUp(l, 8, 6)) count++;
  if (fingerUp(l, 12, 10)) count++;
  if (fingerUp(l, 16, 14)) count++;
  if (fingerUp(l, 20, 18)) count++;

  return count;
}

/* ======================
SUAVIZADO (VOTO)
====================== */
function smooth(buffer, value, size = 6) {
  buffer.current.push(value);
  if (buffer.current.length > size) buffer.current.shift();

  const freq = {};
  buffer.current.forEach((v) => (freq[v] = (freq[v] || 0) + 1));

  return Number(
    Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
  );
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
  const [hand, setHand] = useState("—");

  useEffect(() => {
    const video = videoRef.current;

    video.setAttribute("playsinline", "");
    video.muted = true;
    video.autoplay = true;

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

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    return () => camera.stop();
  }, []);

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

      /* MANO */
      const rawHand = results.multiHandedness[0].label;
      const stableHand = smooth(handBuffer, rawHand);
      setHand(stableHand === "Left" ? "Izquierda" : "Derecha");

      /* DEDOS */
      const rawCount = countFingers(l);
      const stableCount = smooth(fingerBuffer, rawCount);
      setCount(stableCount);
    } else {
      setCount(0);
      setHand("—");
      fingerBuffer.current = [];
      handBuffer.current = [];
    }

    /* HUD */
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, 60);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 26px system-ui";
    ctx.fillText(`Dedos: ${count}`, 16, 30);
    ctx.fillText(`Mano: ${hand}`, 16, 54);
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
          background: "#000",
        }}
      >
        <video ref={videoRef} />
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
