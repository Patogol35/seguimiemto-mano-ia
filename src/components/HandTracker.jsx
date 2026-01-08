import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

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

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        landmarks.forEach((point) => {
          ctx.beginPath();
          ctx.arc(
            point.x * canvas.width,
            point.y * canvas.height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = "#22c55e";
          ctx.fill();
        });

        detectGesture(landmarks);
      }
    }
  };

  const detectGesture = (landmarks) => {
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    const distance = Math.abs(indexTip.x - thumbTip.x);

    if (distance < 0.03) {
      console.log("✊ CLICK");
    } else {
      console.log("👉 MOVIENDO");
    }
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
