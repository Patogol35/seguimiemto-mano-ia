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
        // 🔵 Dibujar puntos
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

        detectGesture(landmarks, ctx);
      }
    }
  };

  const detectGesture = (landmarks, ctx) => {
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];

    const indexTip = landmarks[8];
    const indexPip = landmarks[6];

    const middleTip = landmarks[12];
    const middlePip = landmarks[10];

    const ringTip = landmarks[16];
    const ringPip = landmarks[14];

    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];

    const thumbOpen = thumbTip.x > thumbIp.x;
    const indexOpen = indexTip.y < indexPip.y;
    const middleOpen = middleTip.y < middlePip.y;
    const ringOpen = ringTip.y < ringPip.y;
    const pinkyOpen = pinkyTip.y < pinkyPip.y;

    let gesture = "🤷 GESTO NO RECONOCIDO";

    // 🤏 PINZA (CLICK)
    const pinchDistance = Math.abs(indexTip.x - thumbTip.x);
    if (pinchDistance < 0.03) {
      gesture = "🤏 PINZA / CLICK";
    }

    // ✊ PUÑO
    else if (
      !indexOpen &&
      !middleOpen &&
      !ringOpen &&
      !pinkyOpen
    ) {
      gesture = "✊ PUÑO";
    }

    // ✋ MANO ABIERTA
    else if (
      indexOpen &&
      middleOpen &&
      ringOpen &&
      pinkyOpen
    ) {
      gesture = "✋ MANO ABIERTA";
    }

    // 👍 PULGAR ARRIBA
    else if (
      thumbOpen &&
      !indexOpen &&
      !middleOpen &&
      !ringOpen &&
      !pinkyOpen
    ) {
      gesture = "👍 PULGAR ARRIBA";
    }

    // 👉 SEÑALAR
    else if (
      indexOpen &&
      !middleOpen &&
      !ringOpen &&
      !pinkyOpen
    ) {
      gesture = "👉 SEÑALANDO";
    }

    // 📝 Mostrar gesto en pantalla
    ctx.font = "28px Arial";
    ctx.fillStyle = "#22c55e";
    ctx.fillText(gesture, 20, 40);

    console.log(gesture);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "20px",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          borderRadius: "12px",
          border: "3px solid #22c55e",
        }}
      />
    </div>
  );
}
