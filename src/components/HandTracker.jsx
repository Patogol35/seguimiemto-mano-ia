import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
   DRAW FUNCTIONS
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

/* ======================
   UTILS
====================== */
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerExtended = (l, tip, pip) => l[tip].y < l[pip].y;
const isPalmVertical = (l) => Math.abs(l[0].x - l[9].x) < 0.05;

/* ======================
   COMPONENT
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const lastIndexX = useRef(null);
  const lastPinchDist = useRef(null);
  const lastGesture = useRef("");

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
     GESTURE DETECTION
  ====================== */
  const detectGesture = (l) => {
    const fingers = {
      thumb: fingerExtended(l, 4, 3),
      index: fingerExtended(l, 8, 6),
      middle: fingerExtended(l, 12, 10),
      ring: fingerExtended(l, 16, 14),
      pinky: fingerExtended(l, 20, 18),
    };

    const count = Object.values(fingers).filter(Boolean).length;
    const pinchDist = distance(l[4], l[8]);
    const indexX = l[8].x;

    // 👌 OK
    if (
      pinchDist < 0.03 &&
      fingers.middle &&
      fingers.ring &&
      fingers.pinky
    )
      return "OK 👌";

    // 🔍 🔎 ZOOM
    if (lastPinchDist.current !== null) {
      if (pinchDist - lastPinchDist.current > 0.015)
        return "ZOOM IN 🔍";
      if (lastPinchDist.current - pinchDist > 0.015)
        return "ZOOM OUT 🔎";
    }
    lastPinchDist.current = pinchDist;

    // 👉 👈 SWIPE
    if (fingers.index && !fingers.middle && !fingers.ring) {
      if (lastIndexX.current !== null) {
        const delta = indexX - lastIndexX.current;
        if (delta > 0.05) return "SWIPE ➡️";
        if (delta < -0.05) return "SWIPE ⬅️";
      }
      lastIndexX.current = indexX;
    }

    // ✋ STOP
    if (count === 5 && isPalmVertical(l)) return "STOP ✋";

    // 🧲 GRAB
    if (
      lastGesture.current === "MANO ABIERTA 🖐️" &&
      count === 0
    )
      return "GRAB 🧲";

    // 👍
    if (
      fingers.thumb &&
      !fingers.index &&
      !fingers.middle &&
      !fingers.ring &&
      !fingers.pinky
    )
      return "PULGAR ARRIBA 👍";

    // ✌️
    if (fingers.index && fingers.middle && !fingers.ring)
      return "PAZ ✌️";

    // ☝️
    if (fingers.index && !fingers.middle)
      return "APUNTAR ☝️";

    // 🤟
    if (fingers.index && fingers.pinky && !fingers.middle)
      return "ROCK 🤟";

    if (count === 5) return "MANO ABIERTA 🖐️";
    if (count === 0) return "PUÑO ✊";

    if (pinchDist < 0.035) return "CLICK 👆";

    return `DEDOS: ${count}`;
  };

  /* ======================
     RESULTS
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
        lastGesture.current = gesture;
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
