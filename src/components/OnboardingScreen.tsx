"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { AnimatedMovies } from "~/components/ui/animatedmovies";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { RewardsIcon } from "~/components/icons";
import { VotingIcon } from "./icons/VotingIcon";
import voteMoviesData from "../data/vote-movies.json";

// Add the Testimonial interface to match what AnimatedMovies expects
interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}

interface OnboardingProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [movies, setMovies] = useState<Testimonial[]>([]);

  // Load movies from JSON file
  useEffect(() => {
    // Transform movies for AnimatedMovies component
    const transformedMovies: Testimonial[] = voteMoviesData.slice(0, 5).map((movie) => ({
      quote: movie.title,
      name: movie.title,
      designation: movie.year || "Movie",
      src: movie.posterUrl || "/placeholder-poster.jpg"
    }));
    setMovies(transformedMovies);
  }, []);

  const slides = [
    {
      id: "discover",
      title: "Discover Inspiring Movies",
      subtitle: "Find movies that match your interests from trending shows to hidden gems tailored just for you",
      content: "animated-movies"
    },
    {
      id: "vote",
      title: "Vote & Share Opinions",
      subtitle: "Express your thoughts by voting on movies and see what the community thinks about your favorites",
      icon: <VotingIcon width={200} height={300} />,
      content: "icon"
    },
    {
      id: "rewards",
      title: "Earn Rewards Daily",
      subtitle: "Get rewarded for your participation with daily claims and unlock exclusive badges for your engagement",
      icon: <RewardsIcon width={200} height={300} />,
      content: "icon"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
      {/* Top Section - Skip Button */}
      <div className="flex justify-end p-4">
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          className="text-white/90 hover:text-white"
        >
          Skip
        </Button>
      </div>

      {/* Middle Section - Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full max-w-lg text-center"
          >
            {/* Visual Content */}
            <div className="mb-4 flex justify-center">
              {currentSlideData.content === "animated-movies" ? (
                movies.length === 0 ? (
                  <div className="w-64 h-64 bg-white/10 rounded-3xl flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm">
                    <AnimatedMovies 
                      testimonials={movies} 
                      autoplay={true} 
                    />
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center">
                  {currentSlideData.icon}
                </div>
              )}
            </div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-lg md:text-2xl text-left font-medium mt-2 text-white mb-2">
                {currentSlideData.title}
              </h1>
              <p className="text-white/70 text-sm text-left md:text-lg leading-relaxed mb-6 max-w-md ">
                {currentSlideData.subtitle}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Section - Progress Dots and Button */}
      <div className="flex flex-col items-center px-6 pb-8">
        {/* Progress Dots */}
        <div className="flex space-x-2 mb-6">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Button 
            onClick={handleNext}
            className="w-full bg-white text-black hover:bg-white/90 font-medium py-3 ring-primary rounded-full text-base"
          >
            {currentSlide === slides.length - 1 ? (
              "Get Started"
            ) : (
              <>
                Next
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}