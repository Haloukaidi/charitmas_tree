
import { useEffect, useRef } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { GestureControllerProps } from '../types';

const GestureController = ({ onGesture, onMove, onStatus, onZoomRequest, debugMode }: GestureControllerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let gestureRecognizer: GestureRecognizer;
    let requestRef: number;

    const setup = async () => {
      onStatus("正在下载 AI 模型... 🤖");
      try {
        // Use a matching version for WASM assets to prevent version mismatch errors
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm");
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          // 稍微降低阈值，让手势更容易被识别
          minHandDetectionConfidence: 0.7, 
          minHandPresenceConfidence: 0.7,
          minTrackingConfidence: 0.7
        });
        onStatus("请求摄像头权限... 📷");
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            onStatus("AI 准备就绪：请展示你的手掌 👋");
            predictWebcam();
          }
        } else {
            onStatus("错误：无法获取摄像头权限 🚫");
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        onStatus(`错误：${errorMessage || '模型加载失败 ⚠️'}`);
        console.error("GestureController Error:", err);
      }
    };

    const predictWebcam = () => {
      if (gestureRecognizer && videoRef.current && canvasRef.current) {
        if (videoRef.current.videoWidth > 0) {
            const results = gestureRecognizer.recognizeForVideo(videoRef.current, Date.now());
            const ctx = canvasRef.current.getContext("2d");
            
            // Draw debug visualizers
            if (ctx && debugMode) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
                if (results.landmarks) for (const landmarks of results.landmarks) {
                        const drawingUtils = new DrawingUtils(ctx);
                        drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, { color: "#FFD700", lineWidth: 2 });
                        drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1 });
                }
            } else if (ctx && !debugMode) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }

            // Logic processing
            if (results.gestures.length > 0) {
              const name = results.gestures[0][0].categoryName; 
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const score = results.gestures[0][0].score;
              
              if (score > 0.50) { // 降低判定分数阈值
                 // 1. 状态切换逻辑
                 if (name === "Open_Palm") {
                    onGesture("CHAOS");
                    onZoomRequest(false); // 张开手掌：浏览模式
                 } 
                 else if (name === "Closed_Fist") {
                    onGesture("FORMED");
                    onZoomRequest(false);
                 }
                 // 2. 放大逻辑 
                 // 注意：MediaPipe 默认模型不支持 "OK" (👌) 手势，通常会识别为 None 或 Pointing_Up。
                 // 因此这里添加 Pointing_Up 和 ILoveYou 作为补充。
                 else if (name === "Victory" || name === "Thumb_Up" || name === "Pointing_Up" || name === "ILoveYou") {
                    onGesture("CHAOS"); // 保持在照片散开的状态
                    onZoomRequest(true); // 触发放大
                 }
                 
                 // Debug 显示
                 let displayName = name;
                 if (name === "Open_Palm") displayName = "张开手掌 (选择) 🖐️";
                 else if (name === "Closed_Fist") displayName = "握拳 (聚树) ✊";
                 else if (name === "Victory") displayName = "剪刀手 (确认) ✌️";
                 else if (name === "Thumb_Up") displayName = "点赞 (确认) 👍";
                 else if (name === "Pointing_Up") displayName = "指向上 (确认) ☝️";
                 else if (name === "ILoveYou") displayName = "爱你 (确认) 🤟";
                 
                 if (debugMode) onStatus(`检测到：${displayName} ${(score*100).toFixed(0)}%`);
              }
              
              if (results.landmarks.length > 0) {
                const speed = (0.5 - results.landmarks[0][0].x) * 0.15;
                onMove(Math.abs(speed) > 0.01 ? speed : 0);
              }
            } else { 
                // 没有检测到手
                onMove(0); 
                // 注意：这里不要自动重置 onZoomRequest(false)，否则手势稍微闪烁一下照片就会缩回去。
                // 保持上一帧的状态，直到明确检测到 Open_Palm 或 Closed_Fist 改变状态。
                if (debugMode) onStatus("AI 待机中：未检测到手势 😴"); 
            }
        }
        requestRef = requestAnimationFrame(predictWebcam);
      }
    };
    setup();
    return () => cancelAnimationFrame(requestRef);
  }, [onGesture, onMove, onStatus, onZoomRequest, debugMode]);

  return (
    <>
      <video ref={videoRef} style={{ opacity: debugMode ? 0.6 : 0, position: 'fixed', top: 0, left: 0, width: debugMode ? '160px' : '1px', zIndex: debugMode ? 100 : -1, pointerEvents: 'none', transform: 'scaleX(-1)' }} playsInline muted autoPlay />
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: debugMode ? '160px' : '1px', height: debugMode ? 'auto' : '1px', zIndex: debugMode ? 101 : -1, pointerEvents: 'none', transform: 'scaleX(-1)' }} />
    </>
  );
};

export default GestureController;
