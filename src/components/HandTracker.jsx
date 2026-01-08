import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const dist2D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Verifica si un dedo está doblado comparando la distancia entre punta y base
function isFingerBent(landmarks, tipIndex, pipIndex, mcpIndex) {
  const tipToMcp = dist2D(landmarks[tipIndex], landmarks[mcpIndex]);
  const pipToMcp = dist2D(landmarks[pipIndex], landmarks[mcpIndex]);
  // Si la punta está más cerca de la base que la articulación media → dedo doblado
  return tipToMcp < pipToMcp;
}

function getGesture(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const wrist = landmarks[0];

  // Distancia del pulgar a los otros dedos
  const thumbToIndex = dist2D(thumbTip, indexTip);
  const thumbToMiddle = dist2D(thumbTip, middleTip);

  // Dedos doblados?
  const indexBent = isFingerBent(landmarks, 8, 6, 5);
  const middleBent = isFingerBent(landmarks, 12, 10, 9);
  const ringBent = isFingerBent(landmarks, 16, 14, 13);
  const pinkyBent = isFingerBent(landmarks, 20, 18, 17);

  // Pulgar arriba: pulgar extendido y por encima de la muñeca, otros doblados
  if (
    thumbTip.y < wrist.y &&
    !indexBent &&
    indexTip.y < landmarks[5].y &&
    indexBent === false && // índice recto
    middleBent &&
    ringBent &&
    pinkyBent
  ) {
    // Esto no es pulgar arriba; ajustamos mejor:
  }

  // 👍 Pulgar arriba: pulgar alto, otros dedos cerrados
  if (
    thumbTip.y < landmarks[2].y && // pulgar arriba
    indexBent &&
    middleBent &&
    ringBent &&
    pinkyBent
  ) {
    return "PULGAR ARRIBA 👍";
  }

  // 👎 Pulgar abajo
  if (
    thumbTip.y > landmarks[2].y && // pulgar abajo
    indexBent &&
    middleBent &&
    ringBent &&
    pinkyBent
  ) {
    return "PULGAR ABAJO 👎";
  }

  // 👌 OK: pulgar y índice cercanos, otros extendidos
  if (
    thumbToIndex < 0.05 &&
    !indexBent &&
    !middleBent &&
    !ringBent &&
    !pinkyBent
  ) {
    return "OK 👌";
  }

  // ✊ Puño: todos los dedos doblados
  if (indexBent && middleBent && ringBent && pinkyBent) {
    return "PUÑO ✊";
  }

  // 🖐️ Mano abierta: todos rectos
  if (!indexBent && !middleBent && !ringBent && !pinkyBent) {
    return "MANO ABIERTA 🖐️";
  }

  // ✌️ Paz: índice y medio rectos, otros doblados
  if (!indexBent && !middleBent && ringBent && pinkyBent) {
    return "PAZ ✌️";
  }

  // ☝️ Apuntar: solo índice recto
  if (!indexBent && middleBent && ringBent && pinkyBent) {
    return "APUNTAR ☝️";
  }

  // 🤟 Rock: índice y meñique rectos
  if (!indexBent && middleBent && ringBent && !pinkyBent) {
    return "ROCK 🤟";
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

      // Dibujar imagen espejada
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      let gesture = "Sin mano";

      if (multiHandLandmarks && multiHandLandmarks.length > 0) {
        const landmarks = multiHandLandmarks[0];
        gesture = getGesture(landmarks);

        // Opcional: dibujar puntos (descomenta para depurar)
        /*
        for (const lm of landmarks) {
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "#22c55e";
          ctx.fill();
        }
        */
      }

      ctx.restore();

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

    return () => {
      camera.stop();
    };
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
