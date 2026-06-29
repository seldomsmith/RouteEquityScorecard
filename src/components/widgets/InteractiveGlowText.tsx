"use client";

import React, { useState, useRef, useEffect } from 'react';

interface InteractiveGlowTextProps {
  text: string;
}

const TRANSIT_COLORS = [
  'rgba(34, 197, 94, 0.95)',  // Emerald Green (#22c55e)
  'rgba(234, 179, 8, 0.95)',  // Yellow (#eab308)
  'rgba(239, 68, 68, 0.95)',  // Red (#ef4444)
  'rgba(59, 130, 246, 0.95)', // Blue (#3b82f6)
];

export const InteractiveGlowText: React.FC<InteractiveGlowTextProps> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: -1000, y: -1000 });
  };

  // Convert the text into individual characters (keeping newlines)
  const lines = text.split('\n');

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative select-none cursor-default py-2"
    >
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex justify-center flex-wrap">
          {line.split('').map((char, charIdx) => {
            const globalIdx = lineIdx * 100 + charIdx;
            const transitColor = TRANSIT_COLORS[globalIdx % TRANSIT_COLORS.length];

            // Render single character with dynamic inline mouse-proximity calculations
            return (
              <CharacterGlow
                key={charIdx}
                char={char}
                color={transitColor}
                mousePos={mousePos}
                isHovered={isHovered}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

interface CharacterGlowProps {
  char: string;
  color: string;
  mousePos: { x: number; y: number };
  isHovered: boolean;
}

const CharacterGlow: React.FC<CharacterGlowProps> = ({ char, color, mousePos, isHovered }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(9999);

  useEffect(() => {
    if (!spanRef.current || !isHovered) {
      setDistance(9999);
      return;
    }

    const updateDistance = () => {
      if (!spanRef.current) return;
      const rect = spanRef.current.getBoundingClientRect();
      const parentRect = spanRef.current.parentElement?.parentElement?.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      // Span relative coordinates inside container
      const charX = (rect.left + rect.width / 2) - parentRect.left;
      const charY = (rect.top + rect.height / 2) - parentRect.top;

      const dx = mousePos.x - charX;
      const dy = mousePos.y - charY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setDistance(dist);
    };

    updateDistance();
  }, [mousePos, isHovered]);

  if (char === ' ') {
    return <span className="w-[0.27em]">&nbsp;</span>;
  }

  // Calculate opacity/intensity based on proximity radius (e.g. 150px)
  const maxRadius = 130;
  const isNear = distance < maxRadius;
  const proximityRatio = isNear ? 1 - distance / maxRadius : 0; // 1 at center, 0 at outer edge

  // Text color transitions from deep navy text-blue-955 to the transit spectrum color
  const mixColor = isNear ? color : '#020617';

  // Apply a drop shadow glow matching the character's designated transit line color
  const textShadowStyle = isNear
    ? `0 0 ${12 * proximityRatio}px ${color}, 0 0 ${24 * proximityRatio}px ${color}`
    : 'none';

  return (
    <span
      ref={spanRef}
      className="inline-block transition-all duration-300 ease-out font-black"
      style={{
        color: mixColor,
        textShadow: textShadowStyle,
        transform: isNear ? `scale(${1 + 0.05 * proximityRatio})` : 'scale(1)',
      }}
    >
      {char}
    </span>
  );
};
