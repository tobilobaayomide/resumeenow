import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

// Just 3 highly curated templates
const templatesData = [
  { 
    id: 1, 
    name: "The Minimalist", 
    category: "Clean & Modern", 
    tag: "Most Popular",
    accent: "bg-gray-900" 
  },
  { 
    id: 2, 
    name: "Tech Innovator", 
    category: "Engineering & IT", 
    tag: "ATS Optimized",
    accent: "bg-blue-600" 
  },
  { 
    id: 3, 
    name: "Creative Director", 
    category: "Design & Media", 
    tag: "Stand Out",
    accent: "bg-purple-600" 
  },
];

const TemplatesSection: React.FC = () => {
  return (
    <section id="templates" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Clean, High-Contrast Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">
              Beautiful templates. <br />
              <span className="text-gray-400">Ready in minutes.</span>
            </h2>
            <p className=" text-gray-600 font-light">
              Skip the formatting struggles. Our templates are mathematically designed for perfect typography and ATS readability.
            </p>
          </div>
          
          <button className="group hidden md:flex items-center gap-2 text-gray-900 font-semibold hover:text-blue-600 transition-colors">
            View All Templates 
            <div className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {templatesData.map((template) => (
            <div key={template.id} className="group cursor-pointer flex flex-col">
              
              {/* The "Desk" Background */}
              <div className="relative w-full bg-gray-50 rounded-3xl p-8 md:p-10 flex items-center justify-center transition-colors duration-500 group-hover:bg-gray-100">
                
                {/* The "Paper" (Resume Document) */}
                <div className="relative w-full aspect-[1/1.414] bg-white shadow-sm border border-gray-200 rounded-sm p-5 transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:-translate-y-4">
                  
                  {/* Abstract Resume Wireframe */}
                  <div className="w-full h-full flex flex-col gap-4 opacity-60">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <div className={`w-10 h-10 rounded-full ${template.accent} opacity-20`}></div>
                      <div className="flex-1">
                        <div className="w-1/2 h-3 bg-gray-300 rounded-full mb-1.5"></div>
                        <div className="w-1/3 h-2 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    {/* Body */}
                    <div className="flex gap-4 h-full">
                      {/* Sidebar (optional look) */}
                      <div className="w-1/3 flex flex-col gap-3">
                        <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                        <div className="w-5/6 h-2 bg-gray-200 rounded-full"></div>
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-4"></div>
                        <div className="w-4/6 h-2 bg-gray-200 rounded-full"></div>
                      </div>

                      
                      {/* Main Content */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="w-1/4 h-2.5 bg-gray-300 rounded-full mb-1"></div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
                        <div className="w-5/6 h-1.5 bg-gray-200 rounded-full"></div>
                        
                        <div className="w-1/4 h-2.5 bg-gray-300 rounded-full mt-3 mb-1"></div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
                        <div className="w-4/6 h-1.5 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Solid Hover Overlay (No Glass) */}
                  <div className="absolute inset-0 bg-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-gray-900 text-white px-6 py-3 rounded-full font-medium shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
                      Use Template <FiArrowRight />
                    </div>
                  </div>

                </div>
              </div>

              {/* Clean Typography Footer */}
              <div className="mt-6 flex items-start justify-between px-2">
                <div>
                  <h3 className="text-xl text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.category}</p>
                </div>
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase bg-gray-100 px-2.5 py-1 rounded-md">
                  {template.tag}
                </span>
              </div>

            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <button className="mt-10 w-full md:hidden flex items-center justify-center gap-2 text-gray-900 font-semibold hover:text-blue-600 transition-colors py-4 border border-gray-200 rounded-xl">
          View All Templates 
        </button>

      </div>
    </section>
  );
};

export default TemplatesSection;