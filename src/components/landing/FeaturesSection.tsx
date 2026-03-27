import React, { useState, useEffect, useRef } from 'react';
import {
  LANDING_FEATURE_ITEMS,
  LANDING_FEATURE_ROTATION_MS,
  LANDING_FEATURE_TRANSITION_MS,
} from "../../data/landing";
import featureVideo from '../../assets/RN FEATURE VIDEO.mp4';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useEnterViewport } from '../../hooks/useEnterViewport';

const FeaturesSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [cycleSeed, setCycleSeed] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shouldLoadVideo = useEnterViewport(mediaRef, '0px 0px');
  const prefersReducedMotion = usePrefersReducedMotion();
  const isPageVisible = usePageVisibility();
  const shouldAnimate = shouldLoadVideo && isPageVisible && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldAnimate) return;

    const timer = window.setTimeout(() => {
      setActiveFeature((current) => (current + 1) % LANDING_FEATURE_ITEMS.length);
    }, LANDING_FEATURE_ROTATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeFeature, cycleSeed, shouldAnimate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo) return;

    if (shouldAnimate) {
      const playback = video.play();
      if (playback instanceof Promise) {
        void playback.catch(() => {});
      }
      return;
    }

    video.pause();
  }, [shouldAnimate, shouldLoadVideo]);

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
    setCycleSeed((seed) => seed + 1);
  };

  return (
    <section id="features" className="relative py-24 bg-white overflow-hidden">
      <div className="max-w-360 mx-auto px-6 relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20 xl:gap-16 2xl:gap-14">
          <div ref={mediaRef} className="relative order-2 flex min-h-72 items-center sm:min-h-88 lg:order-1 lg:col-span-7 lg:h-full lg:min-h-125 xl:col-span-8">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] h-[76%] rounded-full bg-black/12 blur-[72px] pointer-events-none -z-10"></div>

            <div className="relative z-10 flex h-full w-full max-h-80 flex-col rounded-4xl border border-black/10 bg-white/80 p-2 shadow-[0_28px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:max-h-96 md:p-3 lg:max-h-175 xl:-ml-4 xl:w-[108%] xl:max-w-none 2xl:-ml-6 2xl:w-[112%]">
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-inner lg:min-h-100">
                <video
                  ref={videoRef}
                  className={`h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                    videoLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-label="Product walkthrough video"
                  src={shouldLoadVideo ? featureVideo : undefined}
                  autoPlay={shouldAnimate}
                  loop={shouldAnimate}
                  muted
                  playsInline
                  preload={shouldLoadVideo ? 'metadata' : 'none'}
                  onLoadStart={() => setVideoLoaded(false)}
                  onLoadedData={() => setVideoLoaded(true)}
                />

                {!videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                        {LANDING_FEATURE_ITEMS[activeFeature].icon}
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-white/50 font-mono">
                        Product Preview
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-linear-to-tr from-black/10 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>

          <div className="order-1 flex flex-col justify-center gap-8 lg:order-2 lg:col-span-5 xl:col-span-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-black/45 font-medium">
                Product Features
              </p>
              <h2 className="mt-4 text-4xl md:text-5xl text-gray-900 mb-4 tracking-[-0.02em] leading-[1.05]">
                Built for how people <br className="hidden md:block" />
                <span className="text-zinc-500">
                  actually build resumes
                </span>
              </h2>
              <p className="font-light text-gray-600 leading-relaxed">
                Parse, edit, optimize, and export in one flow. No context switching, no duplicate data entry.
              </p>
              <div className="mt-6 h-px w-16 bg-black/15" />
            </div>

            <div className="flex flex-col gap-2.5">
              {LANDING_FEATURE_ITEMS.map((feature, index) => {
                const isActive = activeFeature === index;
                const descriptionId = `landing-feature-description-${feature.id}`;

                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => handleFeatureClick(index)}
                    aria-expanded={isActive}
                    aria-controls={descriptionId}
                    className={`relative w-full rounded-xl p-4 text-left cursor-pointer transition-all overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 motion-reduce:transition-none ${
                      isActive 
                        ? 'bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)] border border-black/15 opacity-100' 
                        : 'hover:bg-zinc-50/50 border border-transparent opacity-65 hover:opacity-100 hover:border-black/10'
                    }`}
                    style={{ transitionDuration: `${LANDING_FEATURE_TRANSITION_MS}ms` }}
                  >
                    {isActive && <div className="absolute left-0 top-3 bottom-3 w-px bg-black/35 rounded-full" />}
                    <div className="flex items-start gap-4 relative z-10">
                      <div
                        className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                          isActive ? "bg-black text-white" : "bg-zinc-100 text-zinc-500"
                        }`}
                        style={{ transitionDuration: `${LANDING_FEATURE_TRANSITION_MS}ms` }}
                      >
                        {feature.icon}
                      </div>
                      
                      <div className="flex-1 pt-1">
                        <h3
                          className={`font-medium tracking-[-0.01em] transition-colors ${isActive ? "text-black" : "text-zinc-600"}`}
                          style={{ transitionDuration: `${LANDING_FEATURE_TRANSITION_MS}ms` }}
                        >
                          {feature.title}
                        </h3>

                        <div
                          id={descriptionId}
                          aria-hidden={!isActive}
                          className={`grid transition-all ease-out ${
                            isActive ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
                          }`}
                          style={{ transitionDuration: `${LANDING_FEATURE_TRANSITION_MS}ms` }}
                        >
                          <div className="overflow-hidden">
                            <p className="text-sm font-extralight leading-relaxed text-gray-600 pb-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isActive && !prefersReducedMotion && (
                      <div className="absolute left-0 bottom-0 right-0 h-px bg-black/12 w-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full landing-progress-fill"
                          style={{
                            animationDuration: `${LANDING_FEATURE_ROTATION_MS}ms`,
                          }}
                          key={`feature-loader-${activeFeature}-${cycleSeed}`}
                        ></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
