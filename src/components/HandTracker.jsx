import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
   DIBUJO MANUAL (SAFE)
====================== */
const drawLandmarks = (ctx, landmarks, options = {}) => {
  const { color = "#22c55e", radius = 4 } = options;
  ctx.fillStyle = color;

  for (const point of landmarks) {
    ctx.beginPath();
    ctx.arc(
      point.x * ctx.canvas.width,
      point.y * ctx.canvas.height,
      radius,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
};

const drawConnectors = (ctx, landmarks, connections, options = {}) => {
  const { color = "#22c55e", lineWidth = 3 } = options;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (const [start, end] of connections) {
    const p1 = landmarks[start];
    const p2 = landmarks[end];

    ctx.beginPath();
    ctx.moveTo(
      p1.x * ctx.canvas.width,
      p1.y * ctx.canvas.height
    );
    ctx.lineTo(
      p2.x * ctx.canvas.width,
      p2.y * ctx.canvas.height
    );
    ctx.stroke();
  }
};

/* ======================
   COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
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
     DETECTORES DE GESTOS
  ====================== */
  const isFist = (l) =>
    [8, 12, 16, 20].every((i) => l[i].y > l[i - 2].y);

  const isOpenHand = (l) =>
    [8, 12, 16, 20].every((i) => l[i].y < l[i - 2].y);

  const isClick = (l) => {
    const d = Math.hypot(
      l[4].x - l[8].x,
      l[4].y - l[8].y
    );
    return d < 0.035;
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
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS);
        drawLandmarks(ctx, landmarks);

        if (isClick(landmarks)) gesture = "CLICK ✌️";
        else if (isFist(landmarks)) gesture = "PUÑO ✊";
        else if (isOpenHand(landmarks)) gesture = "MANO ABIERTA 🤚";
        else gesture = "GESTO INTERMEDIO";
      }
    }

    ctx.fillStyle = "#22c55e";
    ctx.font = "26px Arial";
    ctx.fillText(`Gesto: ${gesture}`, 20, 40);
  };

  /* ======================
     UI
  ====================== */
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
