'use client';

import { useRef, useEffect, useState } from 'react';

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PolygonPoint {
  x: number;
  y: number;
}

interface ImageCanvasProps {
  imageSrc?: string;
  onBoxDrawn?: (box: BoundingBox) => void;
  onPolygonDrawn?: (points: PolygonPoint[]) => void;
  mode: 'box' | 'polygon' | 'view';
  className?: string;
}

export function ImageCanvas({ imageSrc, onBoxDrawn, onPolygonDrawn, mode, className = '' }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Polygon mode state
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoint[]>([]);
  const [isPolygonComplete, setIsPolygonComplete] = useState(false);

  // Store image transformation parameters
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });

  // 이미지 로드
  useEffect(() => {
    if (!imageSrc) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImage(img);
      drawCanvas(img, null);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Canvas 그리기
  const drawCanvas = (img: HTMLImageElement | null, box: BoundingBox | null, polygon: PolygonPoint[] = []) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image if exists
    if (img) {
      // Fit image to canvas
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      // Store transformation parameters for coordinate mapping
      transformRef.current = { scale, offsetX, offsetY };

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Draw box if exists
      if (box && mode === 'box') {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.setLineDash([]);

        // Draw dimensions
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        ctx.fillText(
          `${Math.abs(box.w)}x${Math.abs(box.h)}`,
          box.x + 5,
          box.y - 5
        );
      }

      // Draw polygon if exists
      if (polygon.length > 0 && mode === 'polygon') {
        // Draw lines between points
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        // Close polygon if complete
        if (isPolygonComplete && polygon.length > 2) {
          ctx.closePath();
          ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
          ctx.fill();
        }
        ctx.stroke();

        // Draw points
        polygon.forEach((point, index) => {
          ctx.fillStyle = index === 0 ? '#ff0000' : '#00ff00';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Draw point number
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.fillText(`${index + 1}`, point.x + 8, point.y - 8);
        });

        // Draw point count
        if (polygon.length > 0) {
          ctx.fillStyle = '#00ff00';
          ctx.font = '12px monospace';
          ctx.fillText(
            `점: ${polygon.length}`,
            10,
            20
          );
        }
      }
    } else {
      // No image - show placeholder
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('이미지를 로드하세요', canvas.width / 2, canvas.height / 2);
    }
  };

  // Redraw when box or polygon changes
  useEffect(() => {
    if (image) {
      drawCanvas(image, currentBox, polygonPoints);
    }
  }, [currentBox, image, polygonPoints, isPolygonComplete]);

  // Helper function to convert canvas coordinates to image-relative coordinates
  const canvasToImageCoords = (canvasX: number, canvasY: number) => {
    const { scale, offsetX, offsetY } = transformRef.current;

    // Remove offset and scale to get image coordinates
    const imageX = (canvasX - offsetX) / scale;
    const imageY = (canvasY - offsetY) / scale;

    return { x: imageX, y: imageY };
  };

  // Helper function to get canvas coordinates from mouse event
  // Accounts for canvas internal resolution vs displayed size
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    // Get mouse position relative to the canvas element
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Scale from displayed size to internal canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = mouseX * scaleX;
    const canvasY = mouseY * scaleY;

    return { canvasX, canvasY };
  };

  // Mouse handlers for box drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    if (mode === 'box') {
      handleBoxMouseDown(e);
    } else if (mode === 'polygon') {
      handlePolygonClick(e);
    }
  };

  // Polygon click handler
  const handlePolygonClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image || isPolygonComplete) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const { canvasX: x, canvasY: y } = coords;

    // Check if clicking near first point to close polygon (within 10px)
    if (polygonPoints.length >= 3) {
      const firstPoint = polygonPoints[0];
      const distance = Math.sqrt(
        Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2)
      );

      if (distance < 10) {
        // Close polygon
        setIsPolygonComplete(true);
        onPolygonDrawn?.(polygonPoints);
        return;
      }
    }

    // Add new point
    setPolygonPoints(prev => [...prev, { x, y }]);
  };

  // Reset polygon
  const resetPolygon = () => {
    setPolygonPoints([]);
    setIsPolygonComplete(false);
  };

  // Expose reset method via ref (optional, for parent component)
  useEffect(() => {
    if (mode !== 'polygon') {
      resetPolygon();
    }
  }, [mode]);

  const handleBoxMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const { canvasX: x, canvasY: y } = coords;

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || mode !== 'box') return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const { canvasX: currentX, canvasY: currentY } = coords;

    const box: BoundingBox = {
      x: Math.min(startPos.x, currentX),
      y: Math.min(startPos.y, currentY),
      w: Math.abs(currentX - startPos.x),
      h: Math.abs(currentY - startPos.y)
    };

    setCurrentBox(box);
  };

  const handleMouseUp = () => {
    if (!isDrawing || mode !== 'box') return;

    setIsDrawing(false);

    if (currentBox && currentBox.w > 10 && currentBox.h > 10) {
      // Only call callback if box is large enough
      onBoxDrawn?.(currentBox);
    } else {
      // Too small, clear box
      setCurrentBox(null);
    }
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentBox(null);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className={`border border-border rounded-lg cursor-crosshair w-full h-full object-contain ${className}`}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
