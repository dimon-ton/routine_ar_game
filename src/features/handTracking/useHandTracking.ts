import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState, type RefObject } from 'react';

export interface HandPoint {
  x: number;
  y: number;
  visible: boolean;
  lastSeen: number;
}
export interface HandSkeletonPoint {
  x: number;
  y: number;
}
export type TrackingStatus = 'idle' | 'requesting' | 'loading' | 'ready' | 'detected' | 'error';

const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export function useHandTracking(
  enabled: boolean,
  videoRef: RefObject<HTMLVideoElement | null>,
  sensitivity: number,
  reloadToken = 0,
) {
  const pointerRef = useRef<HandPoint>({ x: 0, y: 0, visible: false, lastSeen: 0 });
  const landmarksRef = useRef<HandSkeletonPoint[]>([]);
  const pinchRef = useRef({ closed: false, changedAt: 0 });
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled) {
      pointerRef.current.visible = false;
      landmarksRef.current = [];
      setStatus('idle');
      return;
    }
    let disposed = false;
    let frame = 0;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;
    let previousInference = 0;
    let hadHand = false;
    const activeVideo = videoRef.current;

    const start = async () => {
      try {
        setError('');
        setStatus('requesting');
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error('Camera access needs HTTPS or localhost in a supported browser.');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = activeVideo;
        if (!video) throw new Error('Camera preview is not available.');
        video.srcObject = stream;
        await video.play();
        setStatus('loading');
        const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
        if (disposed) return;
        setStatus('ready');
        const detect = (time: number) => {
          if (disposed) return;
          if (time - previousInference >= 40 && video.readyState >= 2 && landmarker) {
            previousInference = time;
            const results = landmarker.detectForVideo(video, performance.now());
            const hand = results.landmarks[0];
            if (hand) {
              const index = hand[8];
              const thumb = hand[4];
              landmarksRef.current = hand.map((landmark) => {
                const x = Math.min(1, Math.max(0, 0.5 + (1 - landmark.x - 0.5) * sensitivity));
                const y = Math.min(1, Math.max(0, 0.5 + (landmark.y - 0.5) * sensitivity));
                return { x: x * innerWidth, y: y * innerHeight };
              });
              const rawX = 1 - index.x;
              const adjustedX = Math.min(1, Math.max(0, 0.5 + (rawX - 0.5) * sensitivity));
              const adjustedY = Math.min(1, Math.max(0, 0.5 + (index.y - 0.5) * sensitivity));
              const current = pointerRef.current;
              const alpha = 0.32;
              current.x = current.visible
                ? current.x + (adjustedX * innerWidth - current.x) * alpha
                : adjustedX * innerWidth;
              current.y = current.visible
                ? current.y + (adjustedY * innerHeight - current.y) * alpha
                : adjustedY * innerHeight;
              current.visible = true;
              current.lastSeen = performance.now();
              const distance = Math.hypot(index.x - thumb.x, index.y - thumb.y);
              const closed = pinchRef.current.closed ? distance < 0.075 : distance < 0.055;
              if (closed !== pinchRef.current.closed)
                pinchRef.current = { closed, changedAt: performance.now() };
              if (!hadHand) {
                hadHand = true;
                setStatus('detected');
              }
            } else if (performance.now() - pointerRef.current.lastSeen > 700) {
              pointerRef.current.visible = false;
              landmarksRef.current = [];
              pinchRef.current.closed = false;
              if (hadHand) {
                hadHand = false;
                setStatus('ready');
              }
            }
          }
          frame = requestAnimationFrame(detect);
        };
        frame = requestAnimationFrame(detect);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Hand tracking could not start.';
        if (!disposed) {
          setError(
            message.includes('Permission') || message.includes('denied')
              ? 'Camera permission was denied. You can retry or switch to Mouse / Touch.'
              : message,
          );
          setStatus('error');
        }
      }
    };
    void start();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      landmarker?.close();
      stream?.getTracks().forEach((track) => track.stop());
      landmarksRef.current = [];
      if (activeVideo) activeVideo.srcObject = null;
    };
  }, [enabled, reloadToken, sensitivity, videoRef]);

  return { pointerRef, landmarksRef, pinchRef, status, error };
}
