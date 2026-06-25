"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, BarChart2, Info, CheckCircle2 } from 'lucide-react';

interface Peg {
  x: number;
  y: number;
  radius: number;
  pulse: number; // For hit animation glow
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  targetX: number;
  landed: boolean;
  history: { x: number; y: number }[];
}

interface SimulationStats {
  totalSimulated: number;
  landedCount: number;
  mean: number;
  stdDev: number;
  bins: number[];
}

export const MonteCarloPlinko: React.FC = () => {
  // Shared simulation trigger
  const [isSimulating, setIsSimulating] = useState(false);
  const [totalDropped, setTotalDropped] = useState(0);

  // Board Stats
  const [leftStats, setLeftStats] = useState<SimulationStats>({
    totalSimulated: 0,
    landedCount: 0,
    mean: 0,
    stdDev: 0,
    bins: Array(10).fill(0),
  });

  const [rightStats, setRightStats] = useState<SimulationStats>({
    totalSimulated: 0,
    landedCount: 0,
    mean: 0,
    stdDev: 0,
    bins: Array(10).fill(0),
  });

  // Canvas Refs
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active particles & pegs refs
  const leftParticles = useRef<Particle[]>([]);
  const rightParticles = useRef<Particle[]>([]);
  const leftPegs = useRef<Peg[]>([]);
  const rightPegs = useRef<Peg[]>([]);

  // Simulation parameters
  const canvasWidth = 480;
  const canvasHeight = 420;
  const gravity = 0.16;
  const bounceRestitution = 0.45;
  const pegRadius = 3.5;
  const particleRadius = 4.5;
  const binCount = 10;
  const binWidth = canvasWidth / binCount;
  const dividerY = canvasHeight - 65;

  // Initialize Pegs
  const initPegs = () => {
    const pegs: Peg[] = [];
    const rows = 9;
    const startY = 70;
    const rowHeight = 28;
    const horizontalSpacing = canvasWidth / 12;

    for (let r = 0; r < rows; r++) {
      const isAlternating = r % 2 === 1;
      const xOffset = isAlternating ? horizontalSpacing / 2 : 0;
      const colCount = isAlternating ? 11 : 12;

      for (let c = 0; c < colCount; c++) {
        const x = xOffset + c * horizontalSpacing + horizontalSpacing / 2;
        const y = startY + r * rowHeight;
        
        // Keep pegs centered and within bounds
        if (x > 15 && x < canvasWidth - 15) {
          pegs.push({ x, y, radius: pegRadius, pulse: 0 });
        }
      }
    }
    return pegs;
  };

  // Reset function
  const handleReset = () => {
    leftParticles.current = [];
    rightParticles.current = [];
    
    // Reset pulses
    leftPegs.current.forEach(p => p.pulse = 0);
    rightPegs.current.forEach(p => p.pulse = 0);

    setLeftStats({
      totalSimulated: 0,
      landedCount: 0,
      mean: 0,
      stdDev: 0,
      bins: Array(10).fill(0),
    });

    setRightStats({
      totalSimulated: 0,
      landedCount: 0,
      mean: 0,
      stdDev: 0,
      bins: Array(10).fill(0),
    });

    setTotalDropped(0);
    setIsSimulating(false);
  };

  // Start simulation of 100 particles
  const triggerSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const particlesToDrop = 100;
    let dropped = 0;

    const interval = setInterval(() => {
      if (dropped >= particlesToDrop) {
        clearInterval(interval);
        return;
      }

      // Add 2 particles at a time for faster cascade but retaining separation
      for (let i = 0; i < 2; i++) {
        if (dropped >= particlesToDrop) break;
        
        // Left Board particle (Route 002): Target 65-75 (Bin index 6 or 7)
        // Maps to x: canvasWidth * 0.65 to 0.75
        const leftTargetX = canvasWidth * (0.65 + Math.random() * 0.10);
        const leftParticle: Particle = {
          id: Math.random() + dropped,
          x: canvasWidth / 2 + (Math.random() - 0.5) * 30, // Drop from top center
          y: 20,
          vx: (Math.random() - 0.5) * 1.0,
          vy: 0.5,
          radius: particleRadius,
          color: 'rgba(16, 185, 129, 0.95)', // Emerald-500
          targetX: leftTargetX,
          landed: false,
          history: [],
        };
        leftParticles.current.push(leftParticle);

        // Right Board particle (Route 003: Target 10-60 (Bin indices 1, 2, 3, 4, 5)
        // Maps to x: canvasWidth * 0.10 to 0.60
        const rightTargetX = canvasWidth * (0.10 + Math.random() * 0.50);
        const rightParticle: Particle = {
          id: Math.random() + dropped + 1000,
          x: canvasWidth / 2 + (Math.random() - 0.5) * 30,
          y: 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 0.5,
          radius: particleRadius,
          color: 'rgba(99, 102, 241, 0.95)', // Indigo-500
          targetX: rightTargetX,
          landed: false,
          history: [],
        };
        rightParticles.current.push(rightParticle);

        dropped++;
      }

      setTotalDropped(dropped);
    }, 60);
  };

  // Setup initial pegs once
  useEffect(() => {
    leftPegs.current = initPegs();
    rightPegs.current = initPegs();
  }, []);

  // Update loop for physics and canvas rendering
  useEffect(() => {
    let animationFrameId: number;

    const updatePhysicsAndDraw = () => {
      // Loop over both canvases
      const boards = [
        {
          canvas: leftCanvasRef.current,
          particles: leftParticles.current,
          pegs: leftPegs.current,
          statsSetter: setLeftStats,
          colorScheme: {
            primary: '#10b981', // Emerald
            trail: 'rgba(16, 185, 129, 0.15)',
            glow: 'rgba(16, 185, 129, 0.4)',
          }
        },
        {
          canvas: rightCanvasRef.current,
          particles: rightParticles.current,
          pegs: rightPegs.current,
          statsSetter: setRightStats,
          colorScheme: {
            primary: '#6366f1', // Indigo
            trail: 'rgba(99, 102, 241, 0.15)',
            glow: 'rgba(99, 102, 241, 0.4)',
          }
        }
      ];

      boards.forEach((board) => {
        const { canvas, particles, pegs, statsSetter, colorScheme } = board;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas with premium background
        ctx.fillStyle = '#0b0f19'; // Deep rich dark blue
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw dynamic grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvasWidth; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasHeight);
          ctx.stroke();
        }
        for (let y = 0; y < canvasHeight; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasWidth, y);
          ctx.stroke();
        }

        // Draw bin partitions at the bottom
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, dividerY, canvasWidth, canvasHeight - dividerY);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i <= binCount; i++) {
          const x = i * binWidth;
          ctx.beginPath();
          ctx.moveTo(x, dividerY);
          ctx.lineTo(x, canvasHeight - 15);
          ctx.stroke();
        }

        // Draw score ranges below bins
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < binCount; i++) {
          const x = i * binWidth + binWidth / 2;
          ctx.fillText(`${i * 10}-${(i + 1) * 10}`, x, canvasHeight - 5);
        }

        // Update and Draw pegs
        pegs.forEach((peg) => {
          // Fade peg hit pulse
          if (peg.pulse > 0) peg.pulse -= 0.08;
          if (peg.pulse < 0) peg.pulse = 0;

          ctx.beginPath();
          ctx.arc(peg.x, peg.y, peg.radius + peg.pulse * 1.5, 0, Math.PI * 2);
          if (peg.pulse > 0) {
            ctx.fillStyle = colorScheme.primary;
            ctx.shadowBlur = 10;
            ctx.shadowColor = colorScheme.primary;
          } else {
            ctx.fillStyle = '#475569'; // Slate-600
            ctx.shadowBlur = 0;
          }
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        });

        // Update and Draw active particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          if (p.landed) continue;

          // Physics update
          if (p.y < dividerY) {
            // Apply a continuous horizontal steering force toward targetX
            const steerDir = p.targetX > p.x ? 1 : -1;
            const distToTarget = Math.abs(p.targetX - p.x);
            const steerForce = Math.min(0.04, distToTarget * 0.0035);
            p.vx += steerDir * steerForce;

            p.vy += gravity;
            p.x += p.vx;
            p.y += p.vy;

            // Damp horizontal speed to prevent out-of-bounds escape
            p.vx *= 0.98;

            // Bounce off walls
            if (p.x < p.radius) {
              p.x = p.radius;
              p.vx = -p.vx * bounceRestitution;
            } else if (p.x > canvasWidth - p.radius) {
              p.x = canvasWidth - p.radius;
              p.vx = -p.vx * bounceRestitution;
            }

            // Peg collision check
            pegs.forEach((peg) => {
              const dx = p.x - peg.x;
              const dy = p.y - peg.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const minDist = p.radius + peg.radius;

              if (dist < minDist) {
                peg.pulse = 1.0; // Activate hit glow

                // Collision normals
                const nx = dx / dist;
                const ny = dy / dist;

                // Bounce math
                const vn = p.vx * nx + p.vy * ny;
                if (vn < 0) {
                  const impulse = -(1 + bounceRestitution) * vn;
                  p.vx += impulse * nx;
                  p.vy += impulse * ny;

                  // Dynamic physical correction steering towards targetX
                  const steerDir = p.targetX > p.x ? 1 : -1;
                  const steerFactor = 0.14; // Controls organic curve correction
                  p.vx += steerDir * steerFactor;

                  // Add minor random noise
                  p.vx += (Math.random() - 0.5) * 0.25;
                }

                // Resolve overlap
                const overlap = minDist - dist;
                p.x += nx * overlap;
                p.y += ny * overlap;
              }
            });
          } else {
            // Particle inside the bottom funnels/bins
            const binIdx = Math.min(binCount - 1, Math.max(0, Math.floor(p.x / binWidth)));
            const targetBinCenterX = binIdx * binWidth + binWidth / 2;

            // Smooth glide to center of the channel
            p.x += (targetBinCenterX - p.x) * 0.22;
            p.vx = 0;
            p.vy = Math.min(p.vy, 2.0); // Slower dropping through bin
            p.y += p.vy;

            // Landed threshold
            if (p.y >= canvasHeight - 20) {
              p.landed = true;
              p.y = canvasHeight - 20;

              // Update stats dynamically
              statsSetter((prev) => {
                const nextBins = [...prev.bins];
                nextBins[binIdx] += 1;

                const nextLandedCount = prev.landedCount + 1;
                
                // Calculate new mean and standard deviation
                let sumScores = 0;
                let squaredDiffSum = 0;
                
                nextBins.forEach((count, idx) => {
                  const binMidpoint = idx * 10 + 5;
                  sumScores += count * binMidpoint;
                });
                
                const newMean = nextLandedCount > 0 ? sumScores / nextLandedCount : 0;
                
                nextBins.forEach((count, idx) => {
                  const binMidpoint = idx * 10 + 5;
                  squaredDiffSum += count * Math.pow(binMidpoint - newMean, 2);
                });
                
                const newStdDev = nextLandedCount > 1 
                  ? Math.sqrt(squaredDiffSum / (nextLandedCount - 1)) 
                  : 0;

                return {
                  totalSimulated: prev.totalSimulated + 1,
                  landedCount: nextLandedCount,
                  mean: Math.round(newMean * 10) / 10,
                  stdDev: Math.round(newStdDev * 10) / 10,
                  bins: nextBins,
                };
              });
            }
          }

          // Trail handling
          p.history.push({ x: p.x, y: p.y });
          if (p.history.length > 8) p.history.shift();

          // Draw trail
          ctx.beginPath();
          p.history.forEach((pos, idx) => {
            ctx.lineTo(pos.x, pos.y);
          });
          ctx.strokeStyle = colorScheme.trail;
          ctx.lineWidth = p.radius * 0.8;
          ctx.stroke();

          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Keep running the render frame
      animationFrameId = requestAnimationFrame(updatePhysicsAndDraw);
    };

    animationFrameId = requestAnimationFrame(updatePhysicsAndDraw);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Monitor if all balls landed to toggle simulation active states
  useEffect(() => {
    if (!isSimulating) return;

    const checkCompletion = setInterval(() => {
      const leftActiveCount = leftParticles.current.filter(p => !p.landed).length;
      const rightActiveCount = rightParticles.current.filter(p => !p.landed).length;

      if (leftActiveCount === 0 && rightActiveCount === 0 && totalDropped === 100) {
        setIsSimulating(false);
        clearInterval(checkCompletion);
      }
    }, 500);

    return () => clearInterval(checkCompletion);
  }, [isSimulating, totalDropped]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col font-sans">
      {/* Header section */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Equity Stability Simulation
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm ${
              isSimulating
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-950 text-white hover:bg-blue-900 hover:shadow active:scale-95'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simulate 100 Scenarios
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-white border border-blue-950/20 text-blue-950 hover:bg-slate-50 hover:border-blue-950/40 active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* Side-by-Side Canvas Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
        
        {/* Left Board Card: Route 002 */}
        <div className="flex flex-col w-full max-w-[480px] bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white min-h-[64px]">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Route 002: Bedrock Essential
              </h4>
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                High Equity Resiliency
              </span>
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={leftCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full block"
            />
          </div>

          {/* Histogram and stats summary */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[8px] font-black text-slate-400 uppercase">Landed</div>
                <div className="text-sm font-black text-slate-800">{leftStats.landedCount}</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <div className="text-[8px] font-black text-emerald-600 uppercase">Mean REI</div>
                <div className="text-sm font-black text-emerald-700">{leftStats.mean}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[8px] font-black text-slate-400 uppercase">Std Dev (Spread)</div>
                <div className="text-sm font-black text-slate-800">±{leftStats.stdDev}</div>
              </div>
            </div>

            {/* Custom SVG Histogram display */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase">Interactive Bin Density</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Info className="w-2.5 h-2.5" /> Funneled Score profile
                </span>
              </div>
              <div className="h-16 flex items-end gap-1.5 border-b border-slate-100 pb-1">
                {leftStats.bins.map((val, idx) => {
                  const maxCount = Math.max(...leftStats.bins, 1);
                  const heightPercent = `${(val / maxCount) * 100}%`;
                  const isTargetRange = idx === 6 || idx === 7;
                  return (
                    <div key={idx} className="flex-1 h-full flex flex-col justify-end group relative">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isTargetRange 
                            ? 'bg-gradient-to-t from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                        style={{ height: heightPercent }}
                      />
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[8px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap mb-1 font-mono">
                        Bin {idx * 10}: {val}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[7px] font-bold text-slate-400 uppercase mt-1">
                <span>0 score</span>
                <span className="text-emerald-600 font-black">60-80 Range</span>
                <span>100 score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Board Card: Route 003 */}
        <div className="flex flex-col w-full max-w-[480px] bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white min-h-[64px]">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Route 003: Policy Swing Corridor
              </h4>
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                High Policy Volatility
              </span>
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={rightCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full block"
            />
          </div>

          {/* Histogram and stats summary */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[8px] font-black text-slate-400 uppercase">Landed</div>
                <div className="text-sm font-black text-slate-800">{rightStats.landedCount}</div>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                <div className="text-[8px] font-black text-indigo-600 uppercase">Mean REI</div>
                <div className="text-sm font-black text-indigo-700">{rightStats.mean}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[8px] font-black text-slate-400 uppercase">Std Dev (Spread)</div>
                <div className="text-sm font-black text-slate-800">±{rightStats.stdDev}</div>
              </div>
            </div>

            {/* Custom SVG Histogram display */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase">Interactive Bin Density</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Info className="w-2.5 h-2.5" /> Dispersed Score profile
                </span>
              </div>
              <div className="h-16 flex items-end gap-1.5 border-b border-slate-100 pb-1">
                {rightStats.bins.map((val, idx) => {
                  const maxCount = Math.max(...rightStats.bins, 1);
                  const heightPercent = `${(val / maxCount) * 100}%`;
                  const isTargetRange = idx >= 1 && idx <= 5;
                  return (
                    <div key={idx} className="flex-1 h-full flex flex-col justify-end group relative">
                      <div 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isTargetRange 
                            ? 'bg-gradient-to-t from-indigo-500 to-purple-400 shadow-[0_0_8px_rgba(99,102,241,0.3)]' 
                            : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                        style={{ height: heightPercent }}
                      />
                      {/* Tooltip */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[8px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap mb-1 font-mono">
                        Bin {idx * 10}: {val}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[7px] font-bold text-slate-400 uppercase mt-1">
                <span>0 score</span>
                <span className="text-indigo-600 font-black">10-60 Range</span>
                <span>100 score</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Info Footnote block */}
      <footer className="mt-6 bg-slate-50 border border-slate-200/60 p-5 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs md:text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-900 font-bold uppercase tracking-wide block mb-1">
            Understanding Plinko Policy Dissemination
          </strong>
          Each falling particle simulates the composite impact of a randomly sampled weight configuration across 4 core policy pillars. 
          The <span className="font-semibold text-slate-800">Bedrock Route (002)</span> exhibits tight clusters due to high correlation with spatial demographics, showing that scores remain resilient under standard weight shifting.
          The <span className="font-semibold text-slate-800">Corridor Route (003)</span> disperses widely, demonstrating extreme sensitivity to priority parameters and high political swing risks.
        </div>
      </footer>
    </div>
  );
};
