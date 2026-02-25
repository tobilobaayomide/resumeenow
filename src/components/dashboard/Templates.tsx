import React, { useState } from "react";
import { FiSearch, FiArrowRight, FiStar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const Templates: React.FC = () => {
  const [activeWaitlist, setActiveWaitlist] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();

  // Categories for filtering
  const categories = [
    "All",
    "Professional",
    "Creative",
    "Tech",
    "Academic",
    "Minimal",
  ];

  // Template IDs must match your registry
  const templates = [
    {
      id: "executive",
      name: "The Executive",
      category: "Professional",
      description: "Clean, authoritative layout for senior roles.",
      color: "bg-slate-50",
      popular: true,
    },
    {
      id: "studio",
      name: "Studio",
      category: "Creative",
      description: "Bold typography for designers and artists.",
      color: "bg-stone-50",
      popular: false,
    },
    {
      id: "silicon",
      name: "Silicon",
      category: "Tech",
      description: "Optimized for technical skills and projects.",
      color: "bg-blue-50/30",
      popular: true,
    },
    {
      id: "ivy",
      name: "Ivy League",
      category: "Academic",
      description: "Traditional serif structure for CVs.",
      color: "bg-emerald-50/30",
      popular: false,
    },
    {
      id: "mono",
      name: "Mono",
      category: "Minimal",
      description: "Stripped back black & white aesthetic.",
      color: "bg-gray-50",
      popular: false,
    },
    {
      id: "startup",
      name: "Startup",
      category: "Tech",
      description: "Modern, energetic, and concise.",
      color: "bg-orange-50/30",
      popular: false,
    },
  ];

  const filteredTemplates =
    selectedCategory === "All"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleUseTemplate = (templateId: string) => {
    navigate(`/builder/new?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        {/* Grain Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Header - Responsive Padding */}
        <header className="h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#FDFDFD]/80 backdrop-blur-md">
          <div>
            <h1 className="text-lg md:text-xl font-medium tracking-tight text-black">
              Template Gallery
            </h1>
            <p className="text-[10px] md:text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 block">
              Curated Designs
            </p>
          </div>

          {/* Responsive Search */}
          <div className="group flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 border border-gray-100 rounded-lg w-32 sm:w-48 md:w-64 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
            <FiSearch
              className="text-gray-400 group-focus-within:text-black shrink-0"
              size={14}
            />
            <input
              type="text"
              placeholder="Find a style..."
              className="bg-transparent border-none outline-none text-xs md:text-sm w-full text-black placeholder:text-gray-400"
            />
          </div>
        </header>

        {/* Workspace - Added pb-24 for mobile bottom nav clearance */}
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 overflow-y-auto pb-24 md:pb-10">
          <div className="max-w-7xl mx-auto">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 md:mb-10 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs font-medium transition-all duration-300 border whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template Grid - Responsive Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleUseTemplate(template.id)}
                  className="group flex flex-col gap-3 md:gap-4 cursor-pointer"
                >
                  {/* Visual Preview */}
                  <div
                    className={`relative aspect-[1/1.41] ${template.color} rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-black/5 group-hover:-translate-y-1`}
                  >
                    {/* Abstract Resume Layout Mockup */}
                    <div className="absolute inset-4 md:inset-6 bg-white shadow-sm flex flex-col p-4 md:p-6 gap-2 md:gap-3 opacity-90 transition-transform duration-700 group-hover:scale-[1.02]">
                      <div className="w-1/3 h-2 md:h-3 bg-gray-800 rounded-sm mb-1 md:mb-2"></div>
                      <div className="w-full h-1 md:h-1.5 bg-gray-100 rounded-full"></div>
                      <div className="w-full h-1 md:h-1.5 bg-gray-100 rounded-full mb-2 md:mb-4"></div>

                      <div className="flex gap-3 md:gap-4 h-full">
                        <div className="w-1/4 h-full bg-gray-50 rounded-sm"></div>
                        <div className="flex-1 space-y-2 md:space-y-3">
                          <div className="w-full h-1.5 md:h-2 bg-gray-200 rounded-full"></div>
                          <div className="w-5/6 h-1.5 md:h-2 bg-gray-100 rounded-full"></div>
                          <div className="w-full h-1.5 md:h-2 bg-gray-100 rounded-full"></div>
                          <div className="w-4/6 h-1.5 md:h-2 bg-gray-100 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Popular Badge */}
                    {template.popular && (
                      <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/5 backdrop-blur-md px-2 md:px-3 py-1 rounded-full flex items-center gap-1 md:gap-1.5 border border-white/20">
                        <FiStar size={10} className="text-black fill-black" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-black">
                          Popular
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay (Hidden on touch devices, visible on desktop hover) */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-4 p-8 text-center">
                      <h3 className="text-white font-serif text-2xl italic">
                        {template.name}
                      </h3>
                      <p className="text-white/80 text-xs font-light mb-2">
                        {template.description}
                      </p>
                      <button className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold hover:scale-105 transition-transform shadow-xl flex items-center gap-2">
                        Use Template
                      </button>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="flex justify-between items-start px-1">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-black transition-colors">
                        {template.name}
                      </h3>
                      <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                        {template.category}
                      </span>
                    </div>
                    {/* Mobile-only quick action indicator */}
                    <div className="md:hidden text-gray-300 group-hover:text-black transition-colors">
                      <FiArrowRight size={16} />
                    </div>
                  </div>
                </div>
              ))}

              {/* 'Coming Soon' Placeholder */}
              <div className="aspect-[1/1.41] border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-6 md:p-8 bg-gray-50/50">
                <span className="text-xl md:text-2xl mb-2">✨</span>
                <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1">
                  More coming soon
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500 mb-4 md:mb-6 max-w-37.5">
                  We release new editorial templates every month.
                </p>
                <button
                  onClick={() => setActiveWaitlist(true)}
                  disabled={activeWaitlist}
                  className={`text-[10px] md:text-xs font-bold border-b border-black pb-0.5 transition-all ${activeWaitlist ? "text-green-600 border-green-600" : "text-black hover:text-gray-600"}`}
                >
                  {activeWaitlist ? "You're on the list ✓" : "Join Waitlist"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Templates;
