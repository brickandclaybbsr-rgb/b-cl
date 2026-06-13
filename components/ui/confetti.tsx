"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#E8620A", "#F59E0B", "#10B981", "#3B82F6",
  "#8B5CF6", "#EC4899", "#FBBF24", "#34D399",
];

interface Particle {
  id: number;
  x: number;
  color: string;
  width: number;
  height: number;
  delay: number;
  duration: number;
  wobble: number;
}

function makeParticles(count = 70): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: 5 + Math.random() * 7,
    height: 8 + Math.random() * 8,
    delay: Math.random() * 0.6,
    duration: 1.4 + Math.random() * 1.2,
    wobble: (Math.random() - 0.5) * 120,
  }));
}

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setParticles(makeParticles(70));
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 3200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active]);

  if (!visible || particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <style>{`
        @keyframes bnc-fall {
          0%   { transform: translateY(-10px) translateX(0) rotate(0deg)   scaleX(1);  opacity: 1; }
          40%  { transform: translateY(40vh)  translateX(var(--wx))  rotate(180deg)  scaleX(0.4); opacity: 1; }
          100% { transform: translateY(105vh) translateX(calc(var(--wx) * 1.5)) rotate(360deg) scaleX(1); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: p.width > p.height ? "50%" : "2px",
            ["--wx" as string]: `${p.wobble}px`,
            animation: `bnc-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}

      {/* Success ring burst at center */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "bnc-burst 0.5s ease-out forwards",
        }}
      >
        <style>{`
          @keyframes bnc-burst {
            0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.2); }
            60%  { opacity: 0.8; transform: translate(-50%, -50%) scale(1.4); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
          }
          @keyframes bnc-check {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
            50%  { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1);   }
          }
        `}</style>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "radial-gradient(circle, #E8620A33 0%, transparent 70%)",
            border: "3px solid #E8620A",
          }}
        />
      </div>

      {/* Check mark */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          fontSize: 40,
          lineHeight: 1,
          animation: "bnc-check 1s 0.1s ease-out forwards",
          opacity: 0,
        }}
      >
        ✅
      </div>
    </div>
  );
}
