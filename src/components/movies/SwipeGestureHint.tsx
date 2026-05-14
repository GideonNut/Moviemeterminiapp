"use client";

import { useEffect, useRef } from "react";
import { motion, animate, useMotionValue, useTransform } from "motion/react";

export const HINT_KEY = "moviemeter-swipe-gesture-seen";

interface SwipeGestureHintProps {
  onDismiss: () => void;
}

export function SwipeGestureHint({ onDismiss }: SwipeGestureHintProps) {
  const x = useMotionValue(0);
  const cardRotate = useTransform(x, [-120, 0, 120], [-10, 0, 10]);
  const yesOpacity = useTransform(x, [30, 100], [0, 1]);
  const noOpacity = useTransform(x, [-100, -30], [1, 0]);
  const dismissed = useRef(false);

  const dismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    try { localStorage.setItem(HINT_KEY, "true"); } catch {}
    onDismiss();
  };

  useEffect(() => {
    const seq = async () => {
      await new Promise(r => setTimeout(r, 700));
      // Swipe right → YES
      await animate(x, 115, { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] });
      await new Promise(r => setTimeout(r, 550));
      await animate(x, 0, { duration: 0.45, ease: "easeInOut" });
      await new Promise(r => setTimeout(r, 500));
      // Swipe left → NO
      await animate(x, -115, { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] });
      await new Promise(r => setTimeout(r, 550));
      await animate(x, 0, { duration: 0.45, ease: "easeInOut" });
      await new Promise(r => setTimeout(r, 850));
      dismiss();
    };
    seq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-[18px] overflow-hidden"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      onClick={dismiss}
    >
      {/* Ghost card that tilts with the hand */}
      <motion.div
        style={{ rotate: cardRotate, x }}
        className="w-36 h-52 rounded-2xl border border-white/12 bg-white/5 mb-10 flex items-center justify-center relative select-none"
      >
        {/* YES stamp */}
        <motion.div
          style={{ opacity: yesOpacity }}
          className="absolute top-3 left-3 border-[2.5px] border-[#4CDF6F] rounded-[5px] px-2 py-0.5"
        >
          <span style={{ fontWeight: 900, fontFamily: '"Arial Black", sans-serif' }}
            className="text-[#4CDF6F] text-base tracking-widest uppercase">YES</span>
        </motion.div>

        {/* NO stamp */}
        <motion.div
          style={{ opacity: noOpacity }}
          className="absolute top-3 right-3 border-[2.5px] border-[#FF4458] rounded-[5px] px-2 py-0.5"
        >
          <span style={{ fontWeight: 900, fontFamily: '"Arial Black", sans-serif' }}
            className="text-[#FF4458] text-base tracking-widest uppercase">NO</span>
        </motion.div>

        {/* Film placeholder */}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="18" rx="2" stroke="white" strokeOpacity="0.18" strokeWidth="1.5"/>
          <circle cx="8.5" cy="9.5" r="1.5" stroke="white" strokeOpacity="0.18" strokeWidth="1.5"/>
          <path d="M2 15l5-5 4 4 3-3 6 6" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </motion.div>

      {/* Animated hand */}
      <motion.div style={{ x }} className="flex flex-col items-center gap-3 select-none">
        {/* Hand SVG */}
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          {/* Palm */}
          <rect x="17" y="25" width="21" height="19" rx="5" fill="white" fillOpacity="0.92"/>
          {/* Thumb */}
          <rect x="10" y="30" width="9" height="8" rx="4" fill="white" fillOpacity="0.92"/>
          {/* Index */}
          <rect x="18" y="13" width="5.5" height="16" rx="2.75" fill="white" fillOpacity="0.92"/>
          {/* Middle */}
          <rect x="25" y="11" width="5.5" height="18" rx="2.75" fill="white" fillOpacity="0.92"/>
          {/* Ring */}
          <rect x="32" y="14" width="5" height="15" rx="2.5" fill="white" fillOpacity="0.92"/>
        </svg>

        {/* Direction labels */}
        <div className="flex items-center gap-4 text-white/45 text-xs font-semibold tracking-wider">
          <span>← NO</span>
          <span className="text-white/15">·</span>
          <span>YES →</span>
        </div>
      </motion.div>

      {/* Voting context */}
      <div className="mt-8 flex flex-col items-center gap-1.5 px-8 text-center">
        <p className="text-white text-base font-semibold tracking-tight">Swipe to vote on movies</p>
        <p className="text-white/40 text-[13px] leading-snug">
          Swipe <span className="text-[#4CDF6F] font-semibold">right</span> to vote Yes ·{' '}
          <span className="text-[#FF4458] font-semibold">left</span> to vote No
        </p>
   
      </div>

      <p className="mt-5 text-white/25 text-[11px] tracking-widest uppercase">tap to skip</p>
    </motion.div>
  );
}
