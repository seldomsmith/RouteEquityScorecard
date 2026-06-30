"use client";

import React, { useState, useRef, useEffect } from 'react';

interface InteractiveGlowTextProps {
  text: string;
}

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

  const lines = text.split('\n');

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative select-none cursor-default py-2 flex flex-col items-center"
    >
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex justify-center flex-wrap relative">
          {line.split('').map((char, charIdx) => {
            return (
              <CharacterGlow
                key={charIdx}
                char={char}
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
  mousePos: { x: number; y: number };
  isHovered: boolean;
}

const CharacterGlow: React.FC<CharacterGlowProps> = ({ char, mousePos, isHovered }) => {
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
      const parentRect = spanRef.current.parentElement?.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

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

  const maxRadius = 150;
  const isNear = distance < maxRadius;
  const proximityRatio = isNear ? 1 - distance / maxRadius : 0;

  // Deep navy blue color
  const navyColor = '#0f172a';

  const textShadowStyle = isNear
    ? `0 0 ${12 * proximityRatio}px rgba(15, 23, 42, 0.6)`
    : 'none';

  return (
    <span
      ref={spanRef}
      className="inline-block transition-all duration-300 ease-out font-black"
      style={{
        color: navyColor,
        WebkitTextStroke: `1.5px ${navyColor}`,
        textShadow: textShadowStyle,
        transform: isNear ? `scale(${1 + 0.04 * proximityRatio})` : 'scale(1)',
      }}
    >
      {char}
    </span>
  );
};
