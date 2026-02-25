import React, { useState, useEffect } from 'react';

// Custom, premium-looking SVG icons
const CustomIcons = {
  AI: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" fill="currentColor" />
      <path d="M19 17L20 19.5L22.5 20.5L20 21.5L19 24L18 21.5L15.5 20.5L18 19.5L19 17Z" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  Layout: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <rect x="3" y="14" width="18" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  ATS: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    </svg>
  ),
  Export: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
      <path d="M12 15V3M12 15L8.5 11.5M12 15L15.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 21H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
};

const featuresData = [
  {
    id: 0,
    title: "AI-Powered Writing Assistant",
    description: "Stuck on what to write? Our AI analyzes your job title and generates professional, impact-driven bullet points instantly.",
    icon: CustomIcons.AI,
    color: "text-blue-600",
    bgColor: "bg-blue-100/80",
    glow: "bg-blue-500/30",
    media: "https://www.w3schools.com/html/mov_bbb.mp4", 
  },
  {
    id: 1,
    title: "Premium Templates",
    description: "Choose from dozens of professionally designed templates tailored for tech, finance, creative fields, and more.",
    icon: CustomIcons.Layout,
    color: "text-purple-600",
    bgColor: "bg-purple-100/80",
    glow: "bg-purple-500/30",
    media: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 2,
    title: "ATS-Optimized Formatting",
    description: "Designed to pass through Applicant Tracking Systems seamlessly so human eyes actually see your application.",
    icon: CustomIcons.ATS,
    color: "text-green-600",
    bgColor: "bg-green-100/80",
    glow: "bg-green-500/30",
    media: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 3,
    title: "1-Click Export",
    description: "Download your polished resume in high-resolution PDF or DOCX formats, ready to be attached to any application.",
    icon: CustomIcons.Export,
    color: "text-orange-600",
    bgColor: "bg-orange-100/80",
    glow: "bg-orange-500/30",
    media: "https://www.w3schools.com/html/mov_bbb.mp4",
  }
];

const FeaturesSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-rotate features every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveFeature((current) => (current + 1) % featuresData.length);
          return 0;
        }
        return prev + 1; // Updates every 50ms to reach 100 in 5s
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeFeature]);

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
    setProgress(0);
  };

  return (
    <section id="features" className="relative py-24 bg-white overflow-hidden">
      
  

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Interactive Showcase Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-stretch">
          
          {/* Left Column (Tall Media Window) */}
          <div className="lg:col-span-7 relative top-24 order-2 lg:order-1 h-full min-h-125 flex items-center">
            {/* Dynamic Ambient Glow behind the video */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[120px] pointer-events-none -z-10 transition-colors duration-1000 ${featuresData[activeFeature].glow}`}></div>
            
            {/* Glassmorphic Container */}
            <div className="w-full h-full max-h-175 p-2 md:p-3 bg-white/60 backdrop-blur-2xl rounded-4xl border border-gray-200/60 shadow-2xl relative z-10 flex flex-col">
              <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden shadow-inner min-h-100">
                
                {/* Video Element */}
                <video 
                  key={activeFeature}
                  className="absolute inset-0 w-full h-full object-cover opacity-95"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                >
                  <source src={featuresData[activeFeature].media} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Subtle Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-tr from-black/10 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Right Column (Header + Compact Feature Texts) */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-8 order-1 lg:order-2">
            
            {/* Header */}
            <div>
              <h2 className="text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">
                Everything you need to <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gray-400">
                  land the interview
                </span>
              </h2>
              <p className="font-light text-gray-600">
                We’ve stripped away the complexity. Build, optimize, and export a world-class resume in minutes.
              </p>
            </div>

            {/* Features Accordion List - COMPACT */}
            <div className="flex flex-col gap-2">
              {featuresData.map((feature, index) => {
                const isActive = activeFeature === index;
                
                return (
                  <div 
                    key={feature.id}
                    onClick={() => handleFeatureClick(index)}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                      isActive 
                        ? 'bg-gray-50/80 shadow-sm border border-gray-200/60' 
                        : 'hover:bg-gray-50/50 border border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      
                      {/* Icon */}
                      <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors duration-500 ${isActive ? feature.bgColor : 'bg-gray-100'} ${isActive ? feature.color : 'text-gray-400'}`}>
                        {feature.icon}
                      </div>
                      
                      <div className="flex-1 pt-1">
                        <h3 className={`font-normal transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                          {feature.title}
                        </h3>
                        
                        <div 
                          className={`grid transition-all duration-300 ease-in-out ${
                            isActive ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="text-sm font-extralight leading-relaxed text-gray-600 pb-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar for Active Item (At Bottom) */}
                    {isActive && (
                      <div className="absolute left-0 bottom-0 right-0 h-0.5 bg-gray-200 w-full rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all duration-75 ease-linear rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
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