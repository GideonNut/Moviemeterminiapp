"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export const AnimatedMovies = ({
  testimonials,
  autoplay = false,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 3000);
      return () => clearInterval(interval);
    }
  }, [autoplay]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  return (
    <div className="flex items-center justify-center w-full h-80">
      <div className="flex items-center justify-center w-64 h-80">
        <AnimatePresence>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.src}
              initial={{
                opacity: 0,
                scale: 0.8,
                rotate: randomRotateY(),
              }}
              animate={{
                opacity: isActive(index) ? 1 : 0.6,
                scale: isActive(index) ? 1 : 0.85,
                rotate: isActive(index) ? 0 : randomRotateY(),
                zIndex: isActive(index) ? 10 : testimonials.length - index,
                x: isActive(index) ? 0 : (index - active) * 20,
                y: isActive(index) ? 0 : (index - active) * 10,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                rotate: randomRotateY(),
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              className="absolute"
            >
              <img
                src={testimonial.src}
                alt={testimonial.name}
                width={200}
                height={300}
                draggable={false}
                className="w-48 h-72 rounded-2xl object-cover object-center shadow-2xl border-2 border-white/20"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
