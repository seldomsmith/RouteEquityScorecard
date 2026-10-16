"use client";

import React, { useEffect, useRef } from 'react';
import { EDMONTON_CORE_ROUTES, EDMONTON_INTERCHANGES, PathNode, CoreTransitRoute } from '@/data/edmontonCoreRoutes';

interface RouteWaterfallProps {
  opacity?: number;
  interactive?: boolean;
  showStations?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export const RouteWaterfall: React.FC<RouteWaterfallProps> = ({
  opacity = 0.35,
  interactive = true,
  showStations = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Clone route configuration into local mutable state for animation
    const lines: CoreTransitRoute[] = JSON.parse(JSON.stringify(EDMONTON_CORE_ROUTES));
    const interchanges = JSON.parse(JSON.stringify(EDMONTON_INTERCHANGES));

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
        const dist = getDistanceToSegment(p, pxPoints[i], pxPoints[i + 1]);
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
        const dx = pxPoints[i + 1].x - pxPoints[i].x;
        const dy = pxPoints[i + 1].y - pxPoints[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segmentLengths.push(len);
        totalLength += len;
      }

      const clampedProgress = Math.max(0, Math.min(1, progress));
      const targetLen = clampedProgress * totalLength;
      let currentLen = 0;

      for (let i = 0; i < pxPoints.length - 1; i++) {
        const segLen = segmentLengths[i];
        if (currentLen + segLen >= targetLen) {
          const ratio = segLen > 0 ? (targetLen - currentLen) / segLen : 0;
          return {
            x: pxPoints[i].x + (pxPoints[i + 1].x - pxPoints[i].x) * ratio,
            y: pxPoints[i].y + (pxPoints[i + 1].y - pxPoints[i].y) * ratio,
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

      // Update vehicle positions and staggered cooldown cycling
      lines.forEach(line => {
        line.trains.forEach(train => {
          if (train.active) {
            train.progress += train.speed;
            if (train.progress > 1) {
              train.progress = 0;
              train.active = false;
              train.cooldown = train.maxCooldown;
            }
          } else {
            train.cooldown -= 1;
            if (train.cooldown <= 0) {
              train.active = true;
              train.progress = 0;
            }
          }
        });

        // Station activation from passing active vehicles
        line.stations.forEach(station => {
          let minDistance = Infinity;
          const sPos = getPixelCoords(station.xPct, station.yPct, w, h);

          line.trains.forEach(train => {
            if (!train.active) return;
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
            station.glow = 1 - minDistance / activationThreshold;
          } else {
            station.glow = Math.max(0, station.glow - 0.05);
          }
        });
      });

      // Interchange station activation
      interchanges.forEach((interchange: { glow: number; xPct: number; yPct: number }) => {
        let minDistance = Infinity;
        const iPos = getPixelCoords(interchange.xPct, interchange.yPct, w, h);

        lines.forEach(line => {
          line.trains.forEach(train => {
            if (!train.active) return;
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
          interchange.glow = 1 - minDistance / activationThreshold;
        } else {
          interchange.glow = Math.max(0, interchange.glow - 0.05);
        }
      });

      // 1. Draw background track paths following true Edmonton road/track geography
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
        ctx.globalAlpha = isHovered ? 0.9 : 0.18;
        ctx.lineWidth = isHovered ? line.strokeWidth * 1.8 : line.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      });

      // 2. Draw vehicles with glowing trailing light tails
      lines.forEach(line => {
        const isHovered = hoveredLineColor === line.color;

        line.trains.forEach(train => {
          if (!train.active) return;

          const segmentsCount = 32;
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

            const opacityMultiplier = Math.pow(1 - i / segmentsCount, 2);
            ctx.globalAlpha = opacityMultiplier * (isHovered ? 1.0 : 0.9);
            ctx.strokeStyle = line.color;
            ctx.stroke();
          }

          // Glowing vehicle head
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

      // 3. Draw route stations
      if (showStations) {
        lines.forEach(line => {
          const isHovered = hoveredLineColor === line.color;

          line.stations.forEach(station => {
            const pt = getPixelCoords(station.xPct, station.yPct, w, h);
            ctx.globalAlpha = 1.0;

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isHovered ? 10 : 7, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = line.color;
            ctx.lineWidth = isHovered ? 4.5 : 3.5;
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

      // 4. Draw landmark interchange nodes
      if (showStations) {
        interchanges.forEach((interchange: { glow: number; xPct: number; yPct: number; name?: string }) => {
          const pt = getPixelCoords(interchange.xPct, interchange.yPct, w, h);
          ctx.globalAlpha = 1.0;

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#1e293b';
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
  }, [showStations]);

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
