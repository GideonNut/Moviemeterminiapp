"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { SpinWheelIcon, SparkleIcon } from "~/components/icons/AppIcons";

const STORAGE_KEY = "moviemeter-last-spin";

const SEGMENTS = [
  { label: "+50 pts",    color: "#FF6B6B", pts: 50 },
  { label: "+100 pts",   color: "#4ECDC4", pts: 100 },
  { label: "+25 pts",    color: "#FFE66D", pts: 25 },
  { label: "+200 pts",   color: "#A855F7", pts: 200 },
  { label: "+75 pts",    color: "#F97316", pts: 75 },
  { label: "+10 pts",    color: "#22C55E", pts: 10 },
  { label: "JACKPOT!",    color: "#FACC15", pts: 500 },
  { label: "+30 pts",    color: "#3B82F6", pts: 30 },
];

const NUM = SEGMENTS.length;
const SLICE = 360 / NUM;

function getWheelPath(index: number, radius: number): string {
  const startAngle = (index * SLICE - 90) * (Math.PI / 180);
  const endAngle   = ((index + 1) * SLICE - 90) * (Math.PI / 180);
  const cx = radius, cy = radius;
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  return `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;
}

function getLabelTransform(index: number, radius: number): string {
  const angle = (index * SLICE + SLICE / 2 - 90) * (Math.PI / 180);
  const r = radius * 0.65;
  const x = radius + r * Math.cos(angle);
  const y = radius + r * Math.sin(angle);
  const rot = index * SLICE + SLICE / 2;
  return `translate(${x}, ${y}) rotate(${rot})`;
}

export function useDailySpin() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      const today = new Date().toDateString();
      if (last !== today) setShouldShow(true);
    } catch {
      setShouldShow(true);
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toDateString()); } catch {}
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DailySpinModal({ open, onClose }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof SEGMENTS[0] | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const baseRotationRef = useRef(0);

  const spin = () => {
    if (spinning || hasSpun) return;
    // Pick a random winning segment
    const winIndex = Math.floor(Math.random() * NUM);
    // Extra full spins (5–8) + land on winning segment
    // The pointer is at top (0°). A segment at index i occupies [i*SLICE, (i+1)*SLICE].
    // We want the midpoint of the winning segment to face the top after rotation.
    const winMid = winIndex * SLICE + SLICE / 2;
    // We rotate the wheel so winMid ends up at 0° (top)
    const extra = (5 + Math.floor(Math.random() * 4)) * 360;
    const target = extra + (360 - winMid);
    baseRotationRef.current = rotation + target;
    setRotation(baseRotationRef.current);
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setResult(SEGMENTS[winIndex]);
      setHasSpun(true);
    }, 4200);
  };

  const handleClose = () => {
    onClose();
    // Reset so next day it resets properly
    setTimeout(() => {
      setRotation(0);
      setResult(null);
      setHasSpun(false);
      baseRotationRef.current = 0;
    }, 300);
  };

  const R = 140; // wheel radius
  const SIZE = R * 2;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!spinning ? handleClose : undefined} />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0E0E0E] border border-white/10 px-5 pt-6 pb-10 mx-0 sm:mx-4 overflow-hidden"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Close */}
            <button onClick={handleClose} disabled={spinning} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/60 hover:text-white transition-colors">
              <X size={16} />
            </button>

            <div className="flex items-center justify-center gap-2 mb-1">
              <SpinWheelIcon size={20} className="text-white/70" />
              <h2 className="text-white font-bold text-xl">Daily Spin</h2>
            </div>
            <p className="text-white/40 text-sm text-center mb-6">One free spin per day — come back tomorrow!</p>

            {/* Wheel */}
            <div className="flex justify-center mb-6 relative">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white drop-shadow-lg" />
              </div>

              <motion.svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                style={{ transformOrigin: "center" }}
                animate={{ rotate: rotation }}
                transition={spinning ? { duration: 4, ease: [0.25, 0.1, 0.1, 1] } : { duration: 0 }}
              >
                {SEGMENTS.map((seg, i) => (
                  <g key={i}>
                    <path d={getWheelPath(i, R)} fill={seg.color} stroke="#0E0E0E" strokeWidth="2" />
                    <text
                      transform={getLabelTransform(i, R)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#000"
                    >
                      {seg.label}
                    </text>
                  </g>
                ))}
                {/* Center cap */}
                <circle cx={R} cy={R} r={18} fill="#0E0E0E" stroke="white" strokeWidth="2" />
                {/* Film frame icon centered */}
                <g transform={`translate(${R - 9}, ${R - 8})`}>
                  <rect x="1" y="3" width="16" height="10" rx="1.5" stroke="white" strokeWidth="1.3" fill="none" />
                  <rect x="0" y="4.5" width="1.8" height="2" rx="0.3" fill="white" />
                  <rect x="0" y="7.5" width="1.8" height="2" rx="0.3" fill="white" />
                  <rect x="16.2" y="4.5" width="1.8" height="2" rx="0.3" fill="white" />
                  <rect x="16.2" y="7.5" width="1.8" height="2" rx="0.3" fill="white" />
                  <rect x="6" y="5.5" width="6" height="5" rx="0.8" fill="white" opacity="0.45" />
                </g>
              </motion.svg>
            </div>

            {/* Result */}
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-5"
                >
                  <p className="text-white/60 text-sm mb-1">You won</p>
                  <p className="text-3xl font-bold text-yellow-400">{result.label}</p>
                  {result.pts >= 200 && (
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <SparkleIcon size={11} className="text-yellow-400" />
                      <p className="text-white/40 text-xs">Outstanding spin</p>
                      <SparkleIcon size={11} className="text-yellow-400" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="idle" className="text-center mb-5 h-14" />
              )}
            </AnimatePresence>

            {/* Button */}
            <button
              onClick={hasSpun ? handleClose : spin}
              disabled={spinning}
              className={`w-full py-3.5 rounded-full font-bold text-base transition-all ${
                hasSpun
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : spinning
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-white text-black hover:opacity-90 active:scale-95"
              }`}
            >
              {spinning ? "Spinning…" : hasSpun ? "Close" : "Spin the wheel!"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
