import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import "./HandTracker.css";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState("👋 Muestra tu mano");

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

    // LIMPIAR
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🪞 MODO ESPEJO
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (results.multiHandLandmarks?.length) {
      const landmarks = results.multiHandLandmarks[0];
      drawLandmarks(ctx, landmarks);
      detectGesture(landmarks);
    } else {
      setGesture("👋 Muestra tu mano");
    }
  };

  const drawLandmarks = (ctx, landmarks) => {
    landmarks.forEach((p) => {
      ctx.beginPath();
      ctx.arc(
        p.x * ctx.canvas.width,
        p.y * ctx.canvas.height,
        5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#22c55e";
      ctx.fill();
    });
  };

  const fingerOpen = (tip, pip) => tip.y < pip.y;

  const detectGesture = (lm) => {
    const index = fingerOpen(lm[8], lm[6]);
    const middle = fingerOpen(lm[12], lm[10]);
    const ring = fingerOpen(lm[16], lm[14]);
    const pinky = fingerOpen(lm[20], lm[18]);

    const openCount = [index, middle, ring, pinky].filter(Boolean).length;

    // 👍 PULGAR ARRIBA
    const thumbTip = lm[4];
    const thumbBase = lm[2];
    const thumbUp = thumbTip.y < thumbBase.y - 0.05;

    if (thumbUp && openCount === 0) {
      setGesture("👍 PULGAR ARRIBA");
      return;
    }

    // 👌 OK
    const ok =
      Math.hypot(lm[8].x - lm[4].x, lm[8].y - lm[4].y) < 0.04 &&
      middle &&
      ring &&
      pinky;

    if (ok) {
      setGesture("👌 OK");
      return;
    }

    // ✌️ PAZ
    if (index && middle && !ring && !pinky) {
      setGesture("✌️ PAZ");
      return;
    }

    // ✊ PUÑO
    if (openCount === 0) {
      setGesture("✊ PUÑO");
      return;
    }

    // ✋ MANO ABIERTA
    if (openCount === 4) {
      setGesture("✋ MANO ABIERTA");
      return;
    }

    setGesture("🤷 GESTO");
  };

  return (
    <div className="app">
      <video ref={videoRef} />

      <div className="camera-container">
        <canvas ref={canvasRef} width={640} height={480} />
        <div className="gesture-badge">{gesture}</div>
      </div>
    </div>
  );
}
