import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

// Calcula el ángulo entre tres puntos: a - b - c (en radianes)
function getAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Dedo doblado si el ángulo en PIP es < 100 grados (ajustable)
function isFingerClosed(landmarks, mcp, pip, dip, tip) {
  const angle = getAngle(landmarks[mcp], landmarks[pip], landmarks[tip]);
  return angle < 100; // umbral empírico: funciona bien en pruebas
}

function detectGesture(landmarks) {
  // Índice: 5 (MCP), 6 (PIP), 7 (DIP), 8 (TIP)
  const indexClosed = isFingerClosed(landmarks, 5, 6, 7, 8);
  // Medio: 9, 10, 11, 12
  const middleClosed = isFingerClosed(landmarks, 9, 10, 11, 12);
  // Anular: 13, 14, 15, 16
  const ringClosed = isFingerClosed(landmarks, 13, 14, 15, 16);
  // Meñique: 17, 18, 19, 20
  const pinkyClosed = isFingerClosed(landmarks, 17, 18, 19, 20);

  // Pulgar: usamos posición relativa (no ángulo, es más complejo)
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbCmc = landmarks[1]; // base del pulgar

  const isThumbUp = thumbTip.y < thumbIp.y && thumbTip.y < landmarks[0].y;
  const isThumbDown = thumbTip.y > thumbIp.y && thumbTip.y > landmarks[0].y;

  // 👊 Puño: los 4 dedos cerrados
  if (indexClosed && middleClosed && ringClosed && pinkyClosed) {
    if (isThumbUp) return "PULGAR ARRIBA 👍";
    if (isThumbDown) return "PULGAR ABAJO 👎";
    return "PUÑO ✊";
  }

  // 🖐️ Mano abierta: todos los dedos abiertos
  if (!indexClosed && !middleClosed && !ringClosed && !pinkyClosed) {
    return "MANO ABIERTA 🖐️";
  }

  // ✌️ Paz: índice y medio abiertos, otros cerrados
  if (!indexClosed && !middleClosed && ringClosed && pinkyClosed) {
    return "PAZ ✌️";
  }

  // ☝️ Apuntar: solo índice abierto
  if (!indexClosed && middleClosed && ringClosed && pinkyClosed) {
    return "APUNTAR ☝️";
  }

  // 🤟 Rock: índice y meñique abiertos
  if (!indexClosed && middleClosed && ringClosed && !pinkyClosed) {
    return "ROCK 🤟";
  }

  // 👌 OK: pulgar cerca del índice Y los otros dedos abiertos
  const distThumbIndex = Math.hypot(thumbTip.x - landmarks[8].x, thumbTip.y - landmarks[8].y);
  if (distThumbIndex < 0.08 && !middleClosed && !ringClosed && !pinkyClosed) {
    return "OK 👌";
  }

  return "—";
}

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

    hands.onResults(({ image, multiHandLandmarks }) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Espejo
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      let gesture = "Sin mano";

      if (multiHandLandmarks?.[0]) {
        gesture = detectGesture(multiHandLandmarks[0]);
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, 56);
      ctx.font = "bold 28px Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#22c55e";
      ctx.fillText(gesture, canvas.width / 2, 38);
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    return () => camera.stop();
  }, []);

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "linear-gradient(180deg,#020617,#020617)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 20,
        gap: 12,
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: 13,
          letterSpacing: 0.4,
        }}
      >
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
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
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
