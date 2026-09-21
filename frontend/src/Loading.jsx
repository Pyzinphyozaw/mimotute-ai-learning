//Codes in this file are just for test purpose
import React, { useState, useEffect } from 'react';
import { Sparkles, Hourglass, Coffee, Heart, Rocket } from 'lucide-react';

const MESSAGES = [
  { text: "Wait a moment, it will take a few minutes...", icon: Hourglass },
  { text: "Good things take time!", icon: Sparkles },
  { text: "Brewing something special for you...", icon: Coffee },
  { text: "Almost there, putting on the finishing touches...", icon: Rocket },
  { text: "Thanks for your patience!", icon: Heart },
];

export default function WaitingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = MESSAGES[currentIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body items-center text-center py-10">
          
          {/* Animated Glowing Icon Badge */}
          <div className="relative mb-6">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-secondary opacity-75 blur animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-base-100 text-primary shadow-inner">
              <CurrentIcon className="w-10 h-10 animate-bounce transition-all duration-500" />
            </div>
          </div>

          {/* Dynamic Message with Fade Transition */}
          <div className="h-16 flex items-center justify-center px-4">
            <p 
              key={currentIndex}
              className="text-lg font-semibold text-base-content animate-fade-in transition-all duration-500"
            >
              "{MESSAGES[currentIndex].text}"
            </p>
          </div>

          {/* daisyUI Progress & Spinners */}
          <div className="w-full space-y-4 mt-2">
            <progress className="progress progress-primary w-full h-2"></progress>
            
            <div className="flex items-center justify-center gap-2 text-sm text-base-content/70">
              <span className="loading loading-spinner loading-xs text-primary"></span>
              <span>Processing your request...</span>
            </div>
          </div>

          {/* Animated Decorative Dots */}
          <div className="flex gap-1.5 mt-6">
            {MESSAGES.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-500 ${
                  idx === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-base-300'
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}