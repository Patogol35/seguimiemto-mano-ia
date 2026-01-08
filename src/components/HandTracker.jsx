import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import {
  drawConnectors,
  drawLandmarks,
} from "@mediapipe/drawing_utils";

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

  const isFist = (landmarks) => {
    const fingers = [
      [8, 6],
      [12, 10],
      [16, 14],
      [20, 18],
    ];
    return fingers.every(([tip, pip]) => landmarks[tip].y > landmarks[pip].y);
  };

  const isOpenHand = (landmarks) => {
    const fingers = [
      [8, 6],
      [12, 10],
      [16, 14],
      [20, 18],
    ];
    return fingers.every(([tip, pip]) => landmarks[tip].y < landmarks[pip].y);
  };

  const isClick = (landmarks) => {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const distance = Math.hypot(
      thumb.x - index.x,
      thumb.y - index.y
    );
    return distance < 0.035;
  };

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    let gesture = "Sin mano";

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: "#22c55e",
          lineWidth: 4,
        });

        drawLandmarks(ctx, landmarks, {
          color: "#22c55e",
          lineWidth: 2,
        });

        if (isClick(landmarks)) gesture = "CLICK ✊";
        else if (isFist(landmarks)) gesture = "PUÑO ✊";
        else if (isOpenHand(landmarks)) gesture = "MANO ABIERTA 🤚";
        else gesture = "GESTO INTERMEDIO";
      }
    }

    // Texto en pantalla
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
          borderRadius: "12px",
          border: "2px solid #22c55e",
        }}
      />
    </div>
  );
}
