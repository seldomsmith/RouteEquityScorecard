"use client";

import React, { useEffect, useRef } from 'react';

interface RouteWaterfallProps {
  opacity?: number;
  interactive?: boolean;
  showStations?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Station {
  id: string;
  xPct: number;
  yPct: number;
  glow: number;
}

interface PathNode {
  xPct: number;
  yPct: number;
}

interface TransitLine {
  color: string;
  strokeWidth: number;
  path: PathNode[];
  stations: Station[];
  trains: {
    progress: number;
    speed: number;
    length: number;
  }[];
}

export const RouteWaterfall: React.FC<RouteWaterfallProps> = ({ opacity = 0.35, interactive = true, showStations = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const lines: TransitLine[] = [
      {
        color: '#22c55e',
        strokeWidth: 10,
        path: [
          { xPct: -10, yPct: 10 },
          { xPct: 20, yPct: 25 },
          { xPct: 35, yPct: 50 },
          { xPct: 75, yPct: 50 },
          { xPct: 90, yPct: 75 },
          { xPct: 110, yPct: 85 },
        ],
        stations: [
          { id: 'g1', xPct: 20, yPct: 25, glow: 0 },
          { id: 'g2', xPct: 35, yPct: 50, glow: 0 },
          { id: 'g3', xPct: 75, yPct: 50, glow: 0 },
          { id: 'g4', xPct: 90, yPct: 75, glow: 0 },
        ],
        trains: [
          { progress: 0.0, speed: 0.003, length: 0.15 },
          { progress: 0.5, speed: 0.0025, length: 0.15 },
        ],
      },
      {
        color: '#eab308',
        strokeWidth: 10,
        path: [
          { xPct: 12, yPct: -10 },
          { xPct: 28, yPct: 37 },
          { xPct: 42, yPct: 62 },
          { xPct: 58, yPct: 110 },
        ],
        stations: [
          { id: 'y1', xPct: 20.72, yPct: 15.625, glow: 0 },
          { id: 'y2', xPct: 28, yPct: 37, glow: 0 },
          { id: 'y3', xPct: 42, yPct: 62, glow: 0 },
          { id: 'y4', xPct: 50.5, yPct: 87.5, glow: 0 },
        ],
        trains: [
          { progress: 0.2, speed: 0.0035, length: 0.18 },
          { progress: 0.7, speed: 0.003, length: 0.18 },
        ],
      },
      {
        color: '#ef4444',
        strokeWidth: 10,
        path: [
          { xPct: -10, yPct: 90 },
          { xPct: 15, yPct: 75 },
          { xPct: 28, yPct: 50 },
          { xPct: 83, yPct: 50 },
          { xPct: 97, yPct: 25 },
          { xPct: 110, yPct: 15 },
        ],
        stations: [
          { id: 'r1', xPct: 15, yPct: 75, glow: 0 },
          { id: 'r2', xPct: 28, yPct: 50, glow: 0 },
          { id: 'r3', xPct: 83, yPct: 50, glow: 0 },
          { id: 'r4', xPct: 97, yPct: 25, glow: 0 },
        ],
        trains: [
          { progress: 0.1, speed: 0.0028, length: 0.15 },
          { progress: 0.6, speed: 0.0032, length: 0.15 },
        ],
      },
      {
        color: '#3b82f6',
        strokeWidth: 10,
        path: [
          { xPct: 80, yPct: -10 },
          { xPct: 69, yPct: 25 },
          { xPct: 55, yPct: 50 },
          { xPct: 55, yPct: 75 },
          { xPct: 42, yPct: 100 },
          { xPct: -10, yPct: 85 },
        ],
        stations: [
          { id: 'b1', xPct: 69, yPct: 25, glow: 0 },
          { id: 'b2', xPct: 55, yPct: 50, glow: 0 },
          { id: 'b3', xPct: 55, yPct: 75, glow: 0 },
          { id: 'b4', xPct: 42, yPct: 100, glow: 0 },
        ],
        trains: [
          { progress: 0.3, speed: 0.0033, length: 0.16 },
          { progress: 0.8, speed: 0.0027, length: 0.16 },
        ],
      },
      {
        color: '#f97316',
        strokeWidth: 10,
        path: [
          { xPct: 110, yPct: 5 },
          { xPct: 85, yPct: 15 },
          { xPct: 65, yPct: 35 },
          { xPct: 35, yPct: 35 },
          { xPct: 15, yPct: 60 },
          { xPct: -10, yPct: 50 },
        ],
        stations: [
          { id: 'o1', xPct: 85, yPct: 15, glow: 0 },
          { id: 'o2', xPct: 65, yPct: 35, glow: 0 },
          { id: 'o3', xPct: 35, yPct: 35, glow: 0 },
          { id: 'o4', xPct: 15, yPct: 60, glow: 0 },
        ],
        trains: [
          { progress: 0.15, speed: 0.0032, length: 0.14 },
          { progress: 0.65, speed: 0.0028, length: 0.14 },
        ],
      },
      {
        color: '#06b6d4',
        strokeWidth: 10,
        path: [
          { xPct: 95, yPct: -10 },
          { xPct: 85, yPct: 40 },
          { xPct: 95, yPct: 60 },
          { xPct: 110, yPct: 110 },
        ],
        stations: [
          { id: 'c1', xPct: 90, yPct: 15, glow: 0 },
          { id: 'c2', xPct: 85, yPct: 40, glow: 0 },
          { id: 'c3', xPct: 95, yPct: 60, glow: 0 },
          { id: 'c4', xPct: 102.5, yPct: 85, glow: 0 },
        ],
        trains: [
          { progress: 0.4, speed: 0.0036, length: 0.17 },
          { progress: 0.9, speed: 0.0031, length: 0.17 },
        ],
      },
      {
        color: '#a855f7',
        strokeWidth: 10,
        path: [
          { xPct: 62, yPct: -10 },
          { xPct: 50, yPct: 45 },
          { xPct: 20, yPct: 75 },
          { xPct: 5, yPct: 110 },
        ],
        stations: [
          { id: 'p1', xPct: 55.45, yPct: 20, glow: 0 },
          { id: 'p2', xPct: 50, yPct: 45, glow: 0 },
          { id: 'p3', xPct: 20, yPct: 75, glow: 0 },
        ],
        trains: [
          { progress: 0.05, speed: 0.0029, length: 0.15 },
          { progress: 0.55, speed: 0.0034, length: 0.15 },
        ],
      },
    ];

    const interchanges = [
      { id: 'int1', xPct: 28, yPct: 50, glow: 0 },
      { id: 'int2', xPct: 55, yPct: 50, glow: 0 },
      { id: 'int3', xPct: 42, yPct: 62, glow: 0 },
    ];

    // Track hover coordinates relative to the canvas
    let mousePos: Point | null = null;
    let hoveredLineColor: string | null = null;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const onPointerLeave = () => {
      mousePos = null;
      hoveredLineColor = null;
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getPixelCoords = (pctX: number, pctY: number, width: number, height: number): Point => {
      return {
        x: (pctX / 100) * width,
        y: (pctY / 100) * height,
      };
    };

    // Helper: perpendicular distance from point to segment
    const getDistanceToSegment = (p: Point, a: Point, b: Point): number => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) {
        const adx = p.x - a.x;
        const ady = p.y - a.y;
        return Math.sqrt(adx * adx + ady * ady);
      }
      let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = a.x + t * dx;
      const projY = a.y + t * dy;
      const pdx = p.x - projX;
      const pdy = p.y - projY;
      return Math.sqrt(pdx * pdx + pdy * pdy);
    };

    const getDistanceToPath = (p: Point, path: PathNode[], width: number, height: number): number => {
      if (path.length < 2) return Infinity;
      const pxPoints = path.map(node => getPixelCoords(node.xPct, node.yPct, width, height));
      let minDistance = Infinity;
      for (let i = 0; i < pxPoints.length - 1; i++) {
        const dist = getDistanceToSegment(p, pxPoints[i], pxPoints[i+1]);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }
      return minDistance;
    };

    const getPositionOnPath = (path: PathNode[], progress: number, width: number, height: number): Point => {
      if (path.length === 0) return { x: 0, y: 0 };
      if (path.length === 1) return getPixelCoords(path[0].xPct, path[0].yPct, width, height);

      const pxPoints = path.map(node => getPixelCoords(node.xPct, node.yPct, width, height));

      let totalLength = 0;
      const segmentLengths: number[] = [];
      for (let i = 0; i < pxPoints.length - 1; i++) {
        const dx = pxPoints[i+1].x - pxPoints[i].x;
        const dy = pxPoints[i+1].y - pxPoints[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segmentLengths.push(len);
        totalLength += len;
      }

      const targetLen = progress * totalLength;
      let currentLen = 0;

      for (let i = 0; i < pxPoints.length - 1; i++) {
        const segLen = segmentLengths[i];
        if (currentLen + segLen >= targetLen) {
          const ratio = (targetLen - currentLen) / segLen;
          return {
            x: pxPoints[i].x + (pxPoints[i+1].x - pxPoints[i].x) * ratio,
            y: pxPoints[i].y + (pxPoints[i+1].y - pxPoints[i].y) * ratio,
          };
        }
        currentLen += segLen;
      }

      return pxPoints[pxPoints.length - 1];
    };

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Check distance to cursor to locate hovered route
      if (mousePos) {
        let minRouteDistance = Infinity;
        let bestLineColor: string | null = null;
        lines.forEach(line => {
          const dist = getDistanceToPath(mousePos!, line.path, w, h);
          if (dist < minRouteDistance) {
            minRouteDistance = dist;
            bestLineColor = line.color;
          }
        });
        
        // Spotlight active within 60px proximity
        if (minRouteDistance < 60) {
          hoveredLineColor = bestLineColor;
        } else {
          hoveredLineColor = null;
        }
      } else {
        hoveredLineColor = null;
      }

      lines.forEach(line => {
        line.trains.forEach(train => {
          train.progress += train.speed;
          if (train.progress > 1) {
            train.progress = 0;
          }
        });

        line.stations.forEach(station => {
          let minDistance = Infinity;
          const sPos = getPixelCoords(station.xPct, station.yPct, w, h);

          line.trains.forEach(train => {
            const tPos = getPositionOnPath(line.path, train.progress, w, h);
            const dx = tPos.x - sPos.x;
            const dy = tPos.y - sPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
              minDistance = dist;
            }
          });

          const activationThreshold = 80;
          if (minDistance < activationThreshold) {
            station.glow = 1 - (minDistance / activationThreshold);
          } else {
            station.glow = Math.max(0, station.glow - 0.05);
          }
        });
      });

      interchanges.forEach(interchange => {
        let minDistance = Infinity;
        const iPos = getPixelCoords(interchange.xPct, interchange.yPct, w, h);

        lines.forEach(line => {
          line.trains.forEach(train => {
            const tPos = getPositionOnPath(line.path, train.progress, w, h);
            const dx = tPos.x - iPos.x;
            const dy = tPos.y - iPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
              minDistance = dist;
            }
          });
        });

        const activationThreshold = 90;
        if (minDistance < activationThreshold) {
          interchange.glow = 1 - (minDistance / activationThreshold);
        } else {
          interchange.glow = Math.max(0, interchange.glow - 0.05);
        }
      });

      // Draw background track paths with spotlight highlights
      lines.forEach(line => {
        const isHovered = hoveredLineColor === line.color;

        ctx.beginPath();
        line.path.forEach((node, idx) => {
          const pt = getPixelCoords(node.xPct, node.yPct, w, h);
          if (idx === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });
        ctx.strokeStyle = line.color;
        ctx.globalAlpha = isHovered ? 0.9 : 0.15; // Maintain baseline 0.15 opacity for non-hovered lines
        ctx.lineWidth = isHovered ? line.strokeWidth * 1.8 : line.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      });

      // Draw trains with spotlight highlights
      lines.forEach(line => {
        const isHovered = hoveredLineColor === line.color;

        line.trains.forEach(train => {
          const segmentsCount = 30;
          ctx.lineWidth = isHovered ? line.strokeWidth * 1.8 : line.strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          for (let i = 0; i < segmentsCount; i++) {
            const t1 = train.progress - (i / segmentsCount) * train.length;
            const t2 = train.progress - ((i + 1) / segmentsCount) * train.length;

            if (t1 < 0 || t2 < 0) continue;

            const pt1 = getPositionOnPath(line.path, t1, w, h);
            const pt2 = getPositionOnPath(line.path, t2, w, h);

            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);

            const opacityMultiplier = Math.pow(1 - (i / segmentsCount), 2);
            ctx.globalAlpha = opacityMultiplier * (isHovered ? 1.0 : 0.9);
            ctx.strokeStyle = line.color;
            ctx.stroke();
          }

          const headPos = getPositionOnPath(line.path, train.progress, w, h);
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.arc(headPos.x, headPos.y, (isHovered ? line.strokeWidth * 1.8 : line.strokeWidth) * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = isHovered ? 25 : 15;
          ctx.shadowColor = line.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });

      // Draw stations with spotlight highlights
      if (showStations) {
        lines.forEach(line => {
          const isHovered = hoveredLineColor === line.color;

          line.stations.forEach(station => {
            const pt = getPixelCoords(station.xPct, station.yPct, w, h);
            ctx.globalAlpha = 1.0;

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isHovered ? 11 : 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = line.color;
            ctx.lineWidth = isHovered ? 5 : 4;
            ctx.fill();
            ctx.stroke();

            if (station.glow > 0) {
              ctx.globalAlpha = station.glow;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, isHovered ? 15 : 12, 0, Math.PI * 2);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.shadowBlur = isHovered ? 15 : 10;
              ctx.shadowColor = line.color;
              ctx.stroke();
              ctx.shadowBlur = 0;
            }
          });
        });
      }

      // Draw interchange stations with basic overlay highlights
      if (showStations) {
        interchanges.forEach(interchange => {
          const pt = getPixelCoords(interchange.xPct, interchange.yPct, w, h);
          ctx.globalAlpha = 1.0;

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 4;
          ctx.fill();
          ctx.stroke();

          if (interchange.glow > 0) {
            ctx.globalAlpha = interchange.glow;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        opacity,
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    />
  );
};
