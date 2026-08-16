import { useEffect, useRef, type MutableRefObject } from 'react';
import type { GestureMode } from '../../types/game';
import type { HandPoint, HandSkeletonPoint } from './useHandTracking';

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
] as const;

interface Props {
  active: boolean;
  pointerRef: MutableRefObject<HandPoint>;
  landmarksRef: MutableRefObject<HandSkeletonPoint[]>;
  pinchRef: MutableRefObject<{ closed: boolean; changedAt: number }>;
  gesture: GestureMode;
  dwellDuration: number;
  onSelect: (id: string) => void;
}

export function HandCursorOverlay({
  active,
  pointerRef,
  landmarksRef,
  pinchRef,
  gesture,
  dwellDuration,
  onSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    let animation = 0;
    let hoverTarget: HTMLElement | null = null;
    let hoverStart = 0;
    let pinchWasClosed = false;
    let cooldownUntil = 0;

    const activate = (target: HTMLElement) => {
      const id = target.dataset.choiceId;
      if (id) onSelectRef.current(id);
      else target.click();
    };

    const drawSkeleton = () => {
      const landmarks = landmarksRef.current;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 5;
      context.strokeStyle = 'rgba(80, 227, 164, 0.92)';
      for (const [startIndex, endIndex] of HAND_CONNECTIONS) {
        const start = landmarks[startIndex];
        const end = landmarks[endIndex];
        if (!start || !end) continue;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
      }
      context.fillStyle = '#ffffff';
      context.strokeStyle = '#6046e8';
      context.lineWidth = 3;
      for (const landmark of landmarks) {
        context.beginPath();
        context.arc(landmark.x, landmark.y, 6, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    };

    const draw = (now: number) => {
      const ratio = devicePixelRatio || 1;
      if (canvas.width !== innerWidth * ratio || canvas.height !== innerHeight * ratio) {
        canvas.width = innerWidth * ratio;
        canvas.height = innerHeight * ratio;
        canvas.style.width = `${innerWidth}px`;
        canvas.style.height = `${innerHeight}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      context.clearRect(0, 0, innerWidth, innerHeight);
      const point = pointerRef.current;
      if (point.visible) {
        drawSkeleton();
        const candidate =
          document
            .elementFromPoint(point.x, point.y)
            ?.closest<HTMLElement>('[data-choice-id], button') ?? null;
        const target =
          candidate instanceof HTMLButtonElement && candidate.disabled ? null : candidate;
        if (target !== hoverTarget) {
          hoverTarget = target;
          hoverStart = now;
        }
        let progress = 0;
        if (gesture === 'dwell' && target) {
          progress = Math.min(1, (now - hoverStart) / dwellDuration);
          if (progress >= 1 && now >= cooldownUntil) {
            activate(target);
            cooldownUntil = now + 1000;
            hoverStart = now;
          }
        }
        const closed = pinchRef.current.closed;
        if (gesture === 'pinch' && closed && !pinchWasClosed && target && now >= cooldownUntil) {
          activate(target);
          cooldownUntil = now + 500;
        }
        pinchWasClosed = closed;
        context.beginPath();
        context.arc(point.x, point.y, 20, 0, Math.PI * 2);
        context.fillStyle = closed ? '#ffd84d' : '#ffffff';
        context.fill();
        context.lineWidth = 5;
        context.strokeStyle = target ? '#50e3a4' : '#6149e7';
        context.stroke();
        if (gesture === 'dwell' && target) {
          context.beginPath();
          context.arc(point.x, point.y, 29, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
          context.lineWidth = 7;
          context.strokeStyle = '#50e3a4';
          context.stroke();
        }
      } else {
        hoverTarget = null;
        pinchWasClosed = false;
      }
      animation = requestAnimationFrame(draw);
    };
    animation = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animation);
  }, [active, dwellDuration, gesture, landmarksRef, pinchRef, pointerRef]);

  return <canvas ref={canvasRef} className="hand-canvas" aria-hidden="true" />;
}
