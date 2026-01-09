import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
PULGAR SIMPLE (NO ROMPE)
====================== */
function thumbUp(l) {
  return dist(l[4], l[2]) > dist(l[5], l[0]) * 0.55;
}

/* ======================
CONTAR DEDOS (0–5)
====================== */
function countFingers(l) {
  let c = 0;
  if (thumbUp(l)) c++;
  if (fingerUp(l, 8, 6)) c++;
  if (fingerUp(l, 12, 10)) c++;
  if (fingerUp(l, 16, 14)) c++;
  if (fingerUp(l, 20, 18)) c++;
  return c;
}

/* ======================
GESTOS CLÁSICOS
====================== */
function detectGesture(l) {
  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);
  const thumb = thumbUp(l);

  if (!index && !middle && !ring && !pinky && !thumb) return "PUÑO ✊";
  if (index && middle && ring && pinky && thumb) return "MANO ABIERTA 🖐️";
  if (index && middle && !ring && !pinky) return "PAZ ✌️";
  if (thumb && !index && !middle && !ring && !pinky) return "PULGAR 👍";
  if (thumb && index && !middle && !ring && !pinky) return "OK 👌";

  return "—";
}

/* ======================
COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let fingers = 0;
    let gesture = "Sin mano";

    if (results.multiHandLandmarks?.length) {
      const l = results.multiHandLandmarks[0];
      fingers = countFingers(l);
      gesture = detectGesture(l);
    }

    /* HUD */
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, 70);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`Dedos: ${fingers}`, canvas.width / 2, 30);
    ctx.fillText(gesture, canvas.width / 2, 58);
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
      }}
    >
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
