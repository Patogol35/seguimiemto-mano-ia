import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
   DRAW
====================== */
const drawLandmarks = (ctx, landmarks) => {
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

const drawConnectors = (ctx, landmarks, connections) => {
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  for (const [a, b] of connections) {
    const p1 = landmarks[a];
    const p2 = landmarks[b];
    ctx.beginPath();
    ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
    ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
    ctx.stroke();
  }
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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
  }, []);

  /* ======================
     GESTOS
  ====================== */
  const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

  const detectGesture = (l) => {
    const thumbOpen =
      dist(l[4], l[5]) > dist(l[3], l[5]) * 1.2;

    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    const fingers = { thumb: thumbOpen, index, middle, ring, pinky };
    const count = Object.values(fingers).filter(Boolean).length;

    if (count === 0) return "PUÑO ✊";
    if (thumbOpen && !index && !middle && !ring && !pinky)
      return "PULGAR ARRIBA 👍";
    if (index && middle && !ring && !pinky) return "PAZ ✌️";
    if (index && !middle && !ring && !pinky) return "APUNTAR ☝️";
    if (index && pinky && !middle && !ring) return "ROCK 🤟";
    if (count === 5) return "MANO ABIERTA 🖐️";
    if (dist(l[4], l[8]) < 0.035) return "CLICK 👌";

    return `DEDOS: ${count}`;
  };

  /* ======================
     RESULTADOS
  ====================== */
  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    let gesture = "Sin mano";

    if (results.multiHandLandmarks) {
      for (const l of results.multiHandLandmarks) {
        drawConnectors(ctx, l, HAND_CONNECTIONS);
        drawLandmarks(ctx, l);
        gesture = detectGesture(l);
      }
    }

    ctx.fillStyle = "#22c55e";
    ctx.font = "22px Arial";
    ctx.fillText(gesture, 16, 30);
  };

  /* ======================
     UI RESPONSIVE (SIN ZOOM)
  ====================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "720px",
          aspectRatio: "4 / 3",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.35)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          background: "#000",
        }}
      >
        {/* TÍTULO */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 16px",
            background: "rgba(2,6,23,0.8)",
            borderRadius: "999px",
            color: "#22c55e",
            fontSize: "14px",
            letterSpacing: "0.5px",
            zIndex: 2,
            whiteSpace: "nowrap",
          }}
        >
          Hand Gesture Recognition
        </div>

        <video ref={videoRef} style={{ display: "none" }} />

        {/* CANVAS RESPONSIVE */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
