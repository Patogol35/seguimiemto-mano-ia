import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState("Esperando mano...");

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
        drawLandmarks(ctx, landmarks);
        detectGesture(landmarks);
      }
    } else {
      setGesture("👋 Muestra tu mano");
    }
  };

  const drawLandmarks = (ctx, landmarks) => {
    landmarks.forEach((point) => {
      ctx.beginPath();
      ctx.arc(
        point.x * ctx.canvas.width,
        point.y * ctx.canvas.height,
        6,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#22c55e";
      ctx.fill();
    });
  };

  const detectGesture = (landmarks) => {
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];

    const indexTip = landmarks[8];
    const indexPip = landmarks[6];

    const middleTip = landmarks[12];
    const middlePip = landmarks[10];

    const ringTip = landmarks[16];
    const ringPip = landmarks[14];

    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];

    const indexOpen = indexTip.y < indexPip.y;
    const middleOpen = middleTip.y < middlePip.y;
    const ringOpen = ringTip.y < ringPip.y;
    const pinkyOpen = pinkyTip.y < pinkyPip.y;

    // 🤏 PINZA
    const pinch = Math.abs(indexTip.x - thumbTip.x) < 0.03;
    if (pinch) {
      setGesture("🤏 PINZA / CLICK");
      return;
    }

    // 👍 PULGAR ARRIBA (CORREGIDO)
    const thumbUp = thumbTip.y < thumbBase.y;
    if (
      thumbUp &&
      !indexOpen &&
      !middleOpen &&
      !ringOpen &&
      !pinkyOpen
    ) {
      setGesture("👍 PULGAR ARRIBA");
      return;
    }

    // ✊ PUÑO
    if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
      setGesture("✊ PUÑO");
      return;
    }

    // ✋ MANO ABIERTA
    if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
      setGesture("✋ MANO ABIERTA");
      return;
    }

    // 👉 SEÑALAR
    if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
      setGesture("👉 SEÑALANDO");
      return;
    }

    setGesture("🤷 GESTO NO DEFINIDO");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "30px",
        position: "relative",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          borderRadius: "16px",
          border: "4px solid #22c55e",
          boxShadow: "0 0 25px rgba(34,197,94,0.4)",
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          background: "rgba(0,0,0,0.6)",
          color: "#22c55e",
          padding: "10px 20px",
          borderRadius: "20px",
          fontSize: "22px",
          fontWeight: "bold",
          backdropFilter: "blur(6px)",
        }}
      >
        {gesture}
      </div>
    </div>
  );
}
