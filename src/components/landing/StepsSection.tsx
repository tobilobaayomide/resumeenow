import React, { useEffect, useRef, useState } from "react";
import {
  LANDING_STEP_ITEMS,
  LANDING_STEP_ROTATION_MS,
} from "../../data/landing";
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useEnterViewport } from '../../hooks/useEnterViewport';

const SWIPE_THRESHOLD_PX = 42;

const StepsSection: React.FC = () => {
  const [active, setActive] = useState(0);
  const [cycleSeed, setCycleSeed] = useState(0);
  const [failedVideos, setFailedVideos] = useState<Record<string, boolean>>({});
  const [loadedVideoSource, setLoadedVideoSource] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStep = LANDING_STEP_ITEMS[active];
  const shouldLoadVideo = useEnterViewport(mediaRef, '0px 0px');
  const prefersReducedMotion = usePrefersReducedMotion();
  const isPageVisible = usePageVisibility();
  const activeVideoSource =
    activeStep && !failedVideos[activeStep.video]
      ? activeStep.video
      : null;
  const isActiveVideoLoaded = activeVideoSource !== null && loadedVideoSource === activeVideoSource;
  const shouldAnimate = shouldLoadVideo && isPageVisible && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldAnimate) return;

    const timer = window.setTimeout(() => {
      setActive((prevActive) => (prevActive + 1) % LANDING_STEP_ITEMS.length);
    }, LANDING_STEP_ROTATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active, cycleSeed, shouldAnimate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo || !activeVideoSource) return;

    if (shouldAnimate) {
      const playback = video.play();
      if (playback instanceof Promise) {
        void playback.catch(() => {});
      }
      return;
    }

    video.pause();
  }, [activeVideoSource, shouldAnimate, shouldLoadVideo]);

  const handleStepClick = (index: number) => {
    setActive(index);
    setCycleSeed((seed) => seed + 1);
  };

  const handleStepSwipe = (direction: 1 | -1) => {
    setActive((prevActive) => (
      prevActive + direction + LANDING_STEP_ITEMS.length
    ) % LANDING_STEP_ITEMS.length);
    setCycleSeed((seed) => seed + 1);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;

    touchStartXRef.current = null;

    if (startX === null || typeof endX !== "number") return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    handleStepSwipe(deltaX < 0 ? 1 : -1);
  };

  const markVideoError = (source: string) => {
    setFailedVideos((current) => {
      if (current[source]) return current;
      return { ...current, [source]: true };
    });
  };

  return (
    <section className="py-24 bg-white overflow-hidden relative" id="steps">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.06))]" />
      </div>
      <div className="max-w-360 mx-auto px-6 relative z-10">
        <div className="mb-12 text-left md:text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-black/45 font-medium mb-3">How It Works</p>
          <h2 className="text-3xl md:text-5xl text-gray-900 mb-4 tracking-[-0.02em] leading-[1.05]">
            A complete workflow in <span className="text-gray-500">3 focused steps</span>
          </h2>
          <p className="md:text-lg text-gray-600 font-light max-w-2xl md:mx-auto leading-relaxed">
            Designed for speed from first draft to final export.
          </p>
        </div>

        <div
          ref={mediaRef}
          className="relative w-full min-h-54 sm:min-h-100 md:min-h-110 lg:min-h-172 xl:min-h-196 bg-white rounded-xl md:rounded-3xl overflow-hidden shadow-[0_28px_70px_rgba(0,0,0,0.16)] border border-black/10 mb-10 md:mb-14"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f4f0e7_0%,#ece9e1_52%,#dfdbd2_100%)]">
            <div className="absolute inset-0 flex items-center justify-center">
              {shouldLoadVideo && activeVideoSource ? (
                <video
                  ref={videoRef}
                  key={activeVideoSource}
                  className={`absolute max-h-full max-w-full h-auto w-auto transition-opacity duration-500 motion-reduce:transition-none ${
                    isActiveVideoLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  aria-label={`${activeStep.title} demo video`}
                  src={activeVideoSource}
                  poster={activeStep.poster}
                  autoPlay={shouldAnimate}
                  loop={shouldAnimate}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadStart={() => setLoadedVideoSource(null)}
                  onLoadedData={() => setLoadedVideoSource(activeVideoSource)}
                  onError={() => markVideoError(activeStep.video)}
                />
              ) : null}

          
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-tr from-black/10 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="block md:hidden min-h-40">
          <div className="relative pt-6">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200">
              {!prefersReducedMotion && (
                <div
                  className="h-full bg-black landing-progress-fill"
                  style={{
                    animationDuration: `${LANDING_STEP_ROTATION_MS}ms`,
                  }}
                  key={`mobile-${active}-${cycleSeed}`}
                ></div>
              )}
            </div>
            <span className="block text-sm font-bold tracking-widest text-black mb-2 font-mono">
              {activeStep.number} <span className="text-gray-400">/ 03</span>
            </span>
            <h3 className="text-2xl text-gray-900 mb-2 font-medium tracking-[-0.01em]">
              {activeStep.title}
            </h3>
            <p className="text-gray-600 leading-relaxed font-light">
              {activeStep.description}
            </p>
          </div>
        </div>
        <div className="hidden md:grid grid-cols-3 gap-5 min-h-44">
          {LANDING_STEP_ITEMS.map((step, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleStepClick(idx)}
              className={`
                relative border p-5 pt-8 text-left transition-all duration-300 cursor-pointer motion-reduce:transition-none
                ${active === idx
                  ? "opacity-100 bg-white border-black/15 shadow-[0_12px_26px_rgba(0,0,0,0.08)]"
                  : "opacity-75 border-transparent hover:opacity-100 hover:border-black/10 hover:bg-zinc-50/40"}
              `}
              aria-label={`View step ${step.number}: ${step.title}`}
              aria-pressed={active === idx}
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200">
                {active === idx && !prefersReducedMotion && (
                  <div
                    className="h-full bg-black landing-progress-fill"
                    style={{
                      animationDuration: `${LANDING_STEP_ROTATION_MS}ms`,
                    }}
                    key={`desktop-${active}-${cycleSeed}`}
                  ></div>
                )}
              </div>
              <span className={`block text-sm font-bold tracking-widest mb-2 font-mono ${active === idx ? "text-black" : "text-gray-400"}`}>
                {step.number}
              </span>
              <h3 className="text-xl text-gray-900 mb-2 font-medium tracking-[-0.01em]">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed font-light">
                {step.description}
              </p>
            </button>
          ))}
        </div>

        <div className="flex md:hidden justify-center gap-2 mt-8">
          {LANDING_STEP_ITEMS.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => handleStepClick(index)}
              aria-label={`Show step ${step.number}: ${step.title}`}
              aria-pressed={active === index}
              className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                active === index ? "w-8 bg-black" : "w-4 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
