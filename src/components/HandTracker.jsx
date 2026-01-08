import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
   DRAW SAFE
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
     GESTOS CORREGIDOS
  ====================== */

  const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

  const detectGesture = (l) => {
    const thumbOpen =
      dist(l[4], l[5]) > dist(l[3], l[5]) * 1.2;

    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    const fingers = {
      thumb: thumbOpen,
      index,
      middle,
      ring,
      pinky,
    };

    const count = Object.values(fingers).filter(Boolean).length;

    // 🔥 PRIORIDAD ABSOLUTA
    if (count === 0) return "PUÑO ✊";

    if (
      thumbOpen &&
      !index &&
      !middle &&
      !ring &&
      !pinky
    )
      return "PULGAR ARRIBA 👍";

    if (index && middle && !ring && !pinky)
      return "PAZ ✌️";

    if (index && !middle && !ring && !pinky)
      return "APUNTAR ☝️";

    if (index && pinky && !middle && !ring)
      return "ROCK 🤟";

    if (count === 5) return "MANO ABIERTA 🖐️";

    // CLICK 👌
    if (dist(l[4], l[8]) < 0.035)
      return "CLICK 👌";

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
    ctx.font = "26px Arial";
    ctx.fillText(`Gesto: ${gesture}`, 20, 40);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          border: "2px solid #22c55e",
          borderRadius: "12px",
        }}
      />
    </div>
  );
}
