import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* ======================
CONTEO DE DEDOS (0–5)
====================== */
function countFingers(l, handedness) {
  let count = 0;

  // Pulgar (clave del bug original)
  if (handedness === "Right") {
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
GESTOS BÁSICOS
====================== */
function detectGesture(l) {
  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  if (index && middle && ring && pinky) return "MANO ABIERTA 🖐️";
  if (!index && !middle && !ring && !pinky) return "PUÑO ✊";
  if (index && middle && !ring && !pinky) return "PAZ ✌️";

  return "—";
}

/* ======================
COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    /* === Hands === */
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(handleResults);
    handsRef.current = hands;

    /* === Camera === */
    const camera = new Camera(videoRef.current, {
      width: 640,
      height: 480,
      onFrame: async () => {
        if (handsRef.current) {
          await handsRef.current.send({
            image: videoRef.current,
          });
        }
      },
    });

    camera.start();
    cameraRef.current = camera;

    /* === CLEANUP (CLAVE PARA QUE NO SE CUELGUE) === */
    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  function handleResults(results) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // espejo
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let fingers = 0;
    let gesture = "Sin mano";

    if (results.multiHandLandmarks && results.multiHandedness) {
      const l = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness[0].label;

      fingers = countFingers(l, handedness);
      gesture = detectGesture(l);
    }

    /* HUD */
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, 90);

    ctx.textAlign = "center";

    ctx.font = "bold 28px Segoe UI";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(gesture, canvas.width / 2, 36);

    ctx.font = "bold 22px Segoe UI";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`Dedos: ${fingers}`, canvas.width / 2, 70);
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
        <video ref={videoRef} playsInline style={{ display: "none" }} />
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
