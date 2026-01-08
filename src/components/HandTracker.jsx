import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState("Detectando...");

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

    if (results.multiHandLandmarks?.length) {
      const lm = results.multiHandLandmarks[0];
      drawLandmarks(ctx, lm);
      detectGesture(lm);
    } else {
      setGesture("Sin mano");
    }
  };

  const detectGesture = (lm) => {
    const thumbUp = lm[4].y < lm[3].y;
    const thumbDown = lm[4].y > lm[3].y;

    const index = lm[8].y < lm[6].y;
    const middle = lm[12].y < lm[10].y;
    const ring = lm[16].y < lm[14].y;
    const pinky = lm[20].y < lm[18].y;

    const fingersUp = [index, middle, ring, pinky].filter(Boolean).length;

    // ✊ PUÑO
    if (!index && !middle && !ring && !pinky && !thumbUp && !thumbDown) {
      setGesture("✊ PUÑO");
      return;
    }

    // ✋ MANO ABIERTA
    if (fingersUp === 4 && thumbUp) {
      setGesture("✋ MANO ABIERTA");
      return;
    }

    // 👍 PULGAR ARRIBA
    if (thumbUp && fingersUp === 0) {
      setGesture("👍 PULGAR ARRIBA");
      return;
    }

    // 👎 PULGAR ABAJO
    if (thumbDown && fingersUp === 0) {
      setGesture("👎 PULGAR ABAJO");
      return;
    }

    // ✌️ PAZ
    if (index && middle && !ring && !pinky) {
      setGesture("✌️ PAZ");
      return;
    }

    // 🤟 AMOR (I Love You)
    if (thumbUp && index && !middle && !ring && pinky) {
      setGesture("🤟 AMOR");
      return;
    }

    setGesture("🤔 DESCONOCIDO");
  };

  const drawLandmarks = (ctx, lm) => {
    ctx.fillStyle = "#00ffcc";
    lm.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * 640, p.y * 480, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} />
      <h2>{gesture}</h2>
    </div>
  );
  }
