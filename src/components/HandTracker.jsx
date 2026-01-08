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
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.75,
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

    if (!results.multiHandLandmarks?.length) {
      setGesture("Sin mano");
      return;
    }

    const lm = results.multiHandLandmarks[0];
    drawLandmarks(ctx, lm);
    detectGesture(lm);
  };

  const isFingerUp = (tip, pip) => tip.y < pip.y;

  const detectGesture = (lm) => {
    const indexUp = isFingerUp(lm[8], lm[6]);
    const middleUp = isFingerUp(lm[12], lm[10]);
    const ringUp = isFingerUp(lm[16], lm[14]);
    const pinkyUp = isFingerUp(lm[20], lm[18]);

    const fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean)
      .length;

    // ✊ PUÑO → todos abajo
    if (fingersUp === 0) {
      setGesture("✊ PUÑO");
      return;
    }

    // ✋ MANO ABIERTA → todos arriba
    if (fingersUp === 4) {
      setGesture("✋ MANO ABIERTA");
      return;
    }

    // ✌️ PAZ → índice y medio arriba, otros abajo
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
      setGesture("✌️ PAZ");
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
