import React, { useState, useEffect, useRef } from "react";
import { FiPlay } from "react-icons/fi";

const steps = [
  {
    number: "01",
    title: "Fill your details",
    description: "Guided multi-step form covering personal info, experience, and skills.",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    number: "02",
    title: "Preview live",
    description: "Watch your resume build in real-time. Switch templates instantly.",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    number: "03",
    title: "Download & apply",
    description: "Export a pixel-perfect PDF that looks exactly like the preview.",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];

const StepsSection: React.FC = () => {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const duration = 5000;
    const intervalTime = 50;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = (intervalTime / duration) * 100;
        if (prev + increment >= 100) {
          setActive(prevActive => (prevActive + 1) % steps.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  const handleStepClick = (index: number) => {
    setActive(index);
    setProgress(0);
  };

  return (
    <section className="py-24 bg-[#F0F7FF] overflow-hidden relative" id="steps">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="mb-12 text-left md:text-center">
          <h2 className="text-3xl md:text-5xl text-gray-900 mb-4 tracking-tight">
            Ready in <span className="text-gray-500">3 Simple Steps</span>
          </h2>
          <p className="md:text-lg text-gray-600 font-light max-w-2xl md:mx-auto">
            No design skills needed. Just follow the flow.
          </p>
        </div>

        {/* Cinematic Video Container */}
        <div className="relative w-full aspect-4/3 md:aspect-21/9 bg-white rounded-xl md:rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-white/50 mb-10 md:mb-16 group">
          <video
            key={active}
            ref={videoRef}
            src={steps[active].video}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Optional decorative play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-lg">
              <FiPlay size={32} color="currentColor" />
            </div>
          </div>
        </div>

        {/* Steps Control */}
        {/* Mobile: Only show the active step */}
        <div className="block md:hidden min-h-40">
          <div className="relative pt-6">
            {/* Progress Line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200">
              <div
                className="h-full bg-black transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="block text-sm font-bold tracking-widest text-black mb-2 font-mono">
              {steps[active].number} <span className="text-gray-400">/ 03</span>
            </span>
            <h3 className="text-2xl text-gray-900 mb-2">
              {steps[active].title}
            </h3>
            <p className="text-gray-600 leading-relaxed font-extralight">
              {steps[active].description}
            </p>
          </div>
        </div>
        {/* Desktop: Show all steps in grid */}
        <div className="hidden md:grid grid-cols-3 gap-x-12 min-h-40">
          {steps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => handleStepClick(idx)}
              className={`
                cursor-pointer transition-all duration-500 relative pt-6 group
                ${active === idx ? "opacity-100" : "opacity-40 hover:opacity-70"}
              `}
            >
              {/* Progress Line (Top of text) */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200">
                {active === idx && (
                  <div
                    className="h-full bg-black transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                  ></div>
                )}
              </div>
              <span className="block text-sm font-bold tracking-widest text-gray-400 mb-2 font-mono">
                {step.number}
              </span>
              <h3 className="text-2xl text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed font-extralight">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile-only Step Indicators (Dots) */}
        <div className="flex md:hidden justify-center gap-2 mt-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${active === i ? 'w-8 bg-black' : 'w-1.5 bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;