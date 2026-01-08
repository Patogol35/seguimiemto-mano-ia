import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
GESTOS ROBUSTOS
====================== */
function isThumbUp(l) {
  const wrist = l[0];

  const thumbTip = l[4];
  const thumbMCP = l[2];

  const indexMCP = l[5];

  // dedos cerrados de verdad
  const indexClosed = dist(l[8], wrist) < dist(l[5], wrist) * 0.9;
  const middleClosed = dist(l[12], wrist) < dist(l[9], wrist) * 0.9;
  const ringClosed = dist(l[16], wrist) < dist(l[13], wrist) * 0.9;
  const pinkyClosed = dist(l[20], wrist) < dist(l[17], wrist) * 0.9;

  // pulgar extendido
  const thumbExtended =
    dist(thumbTip, thumbMCP) >
    dist(indexMCP, wrist) * 0.6;

  // pulgar vertical (no horizontal)
  const vertical =
    Math.abs(thumbTip.y - thumbMCP.y) >
    Math.abs(thumbTip.x - thumbMCP.x);

  return (
    thumbExtended &&
    vertical &&
    indexClosed &&
    middleClosed &&
    ringClosed &&
    pinkyClosed
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

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let gesture = "Sin mano";

    if (results.multiHandLandmarks) {
      for (const l of results.multiHandLandmarks) {
        gesture = detectGesture(l);
      }
    }

    ctx.font = "bold 32px Segoe UI";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.strokeText(gesture, canvas.width / 2, 40);
    ctx.fillStyle = "#fff";
    ctx.fillText(gesture, canvas.width / 2, 40);
  }

  return (
    <div style={{ background: "#020617", minHeight: "100svh", padding: 16 }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ width: "100%", maxWidth: 640 }}
      />
      <video ref={videoRef} style={{ display: "none" }} />
    </div>
  );
}
