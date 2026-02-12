/**
 * Daily Draw Challenge - Drawing canvas (HTML5 Canvas)
 * Touch + mouse, pen, eraser, undo, color picker. One-thumb friendly.
 */

import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const PEN_SIZE = 4;
const ERASER_SIZE = 24;
const BG = '#ffffff';
const DEFAULT_COLOR = '#000000';

type Tool = 'pen' | 'eraser';

type DrawingCanvasProps = {
  width: number;
  height: number;
  onExport: (dataUrl: string) => void;
  disabled?: boolean;
  className?: string;
};

export function DrawingCanvas({
  width,
  height,
  onExport,
  disabled = false,
  className = '',
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d') ?? null, []);

  const pushUndo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-49), imageData]);
  }, [getCtx]);

  const undo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const prev = s[s.length - 1];
      if (prev) ctx.putImageData(prev, 0, 0);
      return s.slice(0, -1);
    });
  }, [getCtx]);

  const clear = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    pushUndo();
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getCtx, pushUndo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const getCoords = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement> | PointerEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = 'clientX' in e ? e.clientX : (e as PointerEvent).clientX;
      const clientY = 'clientY' in e ? e.clientY : (e as PointerEvent).clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const draw = useCallback(
    (x: number, y: number) => {
      const ctx = getCtx();
      const canvas = canvasRef.current;
      if (!ctx || !canvas || disabled) return;
      const size = tool === 'eraser' ? ERASER_SIZE : PEN_SIZE;
      const fill = tool === 'eraser' ? BG : color;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      if (lastPoint.current) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = fill;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      lastPoint.current = { x, y };
    },
    [getCtx, tool, color, disabled]
  );

  const undoStackLength = undoStack.length;
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (disabled) return;
      isDrawing.current = true;
      pushUndo();
      const { x, y } = getCoords(e);
      lastPoint.current = { x, y };
      draw(x, y);
    },
    [disabled, getCoords, draw, pushUndo]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing.current || disabled) return;
      const { x, y } = getCoords(e);
      draw(x, y);
    },
    [disabled, getCoords, draw]
  );

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  const handlePointerLeave = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('pointermove', handlePointerMove as unknown as (e: PointerEvent) => void);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove as unknown as (e: PointerEvent) => void);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerUp, handlePointerLeave]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onExport(dataUrl);
  }, [onExport]);

  const colors = [
    '#ffffff',
    '#000000',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
  ];

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className="touch-none rounded-xl overflow-hidden bg-white border-2 border-gray-300 shadow-lg"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block w-full max-w-full"
          style={{ touchAction: 'none', cursor: tool === 'eraser' ? 'crosshair' : 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTool('pen')}
          className={`min-h-[44px] min-w-[44px] rounded-lg px-3 font-medium transition-colors ${
            tool === 'pen' ? 'bg-[#d93900] text-white' : 'bg-[#333] text-gray-300'
          }`}
          aria-label="Pen"
        >
          Pen
        </button>
        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`min-h-[44px] min-w-[44px] rounded-lg px-3 font-medium transition-colors ${
            tool === 'eraser' ? 'bg-[#d93900] text-white' : 'bg-[#333] text-gray-300'
          }`}
          aria-label="Eraser"
        >
          Eraser
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={undoStackLength === 0}
          className="min-h-[44px] min-w-[44px] rounded-lg bg-[#333] px-3 font-medium text-gray-300 disabled:opacity-50"
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={clear}
          className="min-h-[44px] rounded-lg bg-[#333] px-3 font-medium text-gray-300"
          aria-label="Clear"
        >
          Clear
        </button>
        <div className="flex flex-wrap gap-1">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setTool('pen');
                setColor(c);
              }}
              className="h-9 w-9 rounded-full border-2 border-[#444] transition-transform active:scale-95"
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={disabled}
          className="ml-auto min-h-[44px] rounded-lg bg-[#22c55e] px-4 font-medium text-white disabled:opacity-50"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
