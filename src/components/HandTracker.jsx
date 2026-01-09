import { useEffect, useRef } from "react";
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
function isOK(l) {
  return (
    dist(l[4], l[8]) < 0.05 &&
    !fingerUp(l, 8, 6) &&
    fingerUp(l, 12, 10) &&
    fingerUp(l, 16, 14) &&
    fingerUp(l, 20, 18)
  );
}

function isThumbUp(l) {
  return (
    fingerUp(l, 4, 3) &&
    !fingerUp(l, 8, 6) &&
    !fingerUp(l, 12, 10) &&
    !fingerUp(l, 16, 14) &&
    !fingerUp(l, 20, 18)
  );
}

/* ======================
COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

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
      width: 640,
      height: 480,
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  function detectGesture(l) {
    if (isOK(l)) return "OK 👌";
    if (isThumbUp(l)) return "PULGAR ARRIBA 👍";
    return "—";
  }

  function onResults(results) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let gesture = "Sin mano";

    if (results.multiHandLandmarks?.length) {
      gesture = detectGesture(results.multiHandLandmarks[0]);
    }

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, 60);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 26px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(gesture, canvas.width / 2, 40);
  }

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ width: "100%" }}
      />
    </div>
  );
}
