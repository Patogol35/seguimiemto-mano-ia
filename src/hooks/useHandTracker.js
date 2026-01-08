// src/hooks/useHandTracker.js
import { useEffect, useCallback } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { detectGesture } from "../utils/handGestures";
import { drawLandmarks, drawConnectors } from "../utils/drawHand";

export const useHandTracker = (videoRef, canvasRef) => {
  const onResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      let gesture = "Sin mano";

      if (results.multiHandLandmarks) {
        for (const l of results.multiHandLandmarks) {
          drawConnectors(ctx, l);
          drawLandmarks(ctx, l);
          gesture = detectGesture(l);
        }
      }

      ctx.font = "bold 32px Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;

      ctx.strokeStyle = "#000";
      ctx.strokeText(gesture, canvas.width / 2, 48);

      ctx.fillStyle = "#fff";
      ctx.fillText(gesture, canvas.width / 2, 48);
    },
    [canvasRef]
  );

  useEffect(() => {
    const hands = new Hands({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
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
    return () => camera.stop();
  }, [onResults, videoRef]);
};
