import React from "react";
import { DiGoogleCloudPlatform } from "react-icons/di";
import { FiUploadCloud, FiZap } from "react-icons/fi";
import dashboard from "../../assets/dashboard.png";

// Example company logos (replace with your own as needed)
const companies = [
  { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  { name: "Spotify", logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" },
  { name: "Facebook", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_(2019).png" },
];

const HeroSection: React.FC = () => (
  <section className="relative min-h-screen flex flex-col justify-center pt-28 pb-0 bg-white overflow-hidden">
    {/* 1. Full Modern Grid Background (z-0) */}
    <div className="absolute inset-0 flex justify-center mt-22 z-0">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          maskImage: "linear-gradient(to bottom, white 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, white 60%, transparent 100%)",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="modern-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              className="text-gray-300"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#modern-grid)" />
      </svg>
    </div>

    {/* 2. White Masking Blobs (z-10) */}
    <div className="absolute top-0 right-0 w-75 md:w-125 h-125 md:h-100 bg-white rounded-full blur-[100px] z-10 translate-x-1/4 -translate-y-1/4"></div>
    <div className="absolute bottom-0 left-0 w-75 md:w-175 h-125 md:h-75 bg-white rounded-full blur-[100px] z-10 -translate-x-1/4 translate-y-1/4"></div>
    <div className="absolute top-0 left-0 w-75 md:w-125 h-125 md:h-100 bg-white rounded-full blur-[100px] z-10 -translate-x-1/4 -translate-y-1/4"></div>
    <div className="absolute bottom-0 right-0 w-75 md:w-175 h-125 md:h-75 bg-white rounded-full blur-[100px] z-10 translate-x-1/4 translate-y-1/4"></div>

    {/* 3. Colored Glows (z-20) */}
    <div className="absolute top-0 right-0 w-50 md:w-100 h-100 md:h-75 bg-purple-300/60 rounded-full blur-[120px] z-20 translate-x-1/3 -translate-y-1/4"></div>
    <div className="absolute bottom-0 left-0 w-50 md:w-100 h-100 md:h-75 bg-blue-300/60 rounded-full blur-[120px] z-20 -translate-x-1/3 translate-y-1/4"></div>
    <div className="absolute top-0 left-0 w-50 md:w-100 h-100 md:h-75 bg-green-300/60 rounded-full blur-[120px] z-20 -translate-x-1/3 -translate-y-1/4"></div>
    <div className="absolute bottom-0 right-0 w-50 md:w-100 h-100 md:h-75 bg-yellow-300/60 rounded-full blur-[120px] z-20 translate-x-1/3 translate-y-1/4"></div>

    {/* 4. Main Content Container (z-30) */}
    <div className="max-w-6xl mx-auto px-6 lg:px-0 w-full grid lg:grid-cols-2 gap-12 items-center relative z-30">
      
      {/* Left Column: Text & CTA */}
      <div className="flex flex-col items-start text-left pt-10 lg:pt-0">
        <div className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full border border-gray-200 bg-white/60 backdrop-blur-md text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <span className="flex text-blue-600 mr-2 animate-pulse">
            <DiGoogleCloudPlatform size={20} />
          </span>
          ResumeNow 2.0 is live
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-6 tracking-tight leading-[1.1]">
          Create Your Resume <br />
          <span className="text-transparent bg-clip-text bg-gray-400">
            Effortlessly
          </span>
        </h1>

        <p className="text-lg font-light md:text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
          Build a professional resume in minutes with our easy-to-use,
          customizable templates. Stand out and land your dream job!
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <a
            href="#get-started"
            className="w-full sm:w-auto text-center bg-[#0f1115] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#2d2f31] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Start Building for Free
          </a>
          <a
            href="#templates"
            className="w-full sm:w-auto text-center bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            View Templates
          </a>
        </div>

        {/* Trusted By Section */}
        <div className="mt-10 flex flex-row items-center gap-2 sm:gap-4">
          <div className="flex -space-x-3">
            <img className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src="https://i.pravatar.cc/100?img=1" alt="User avatar" />
            <img className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src="https://i.pravatar.cc/100?img=2" alt="User avatar" />
            <img className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src="https://i.pravatar.cc/100?img=3" alt="User avatar" />
            <img className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src="https://i.pravatar.cc/100?img=4" alt="User avatar" />
          </div>
          <div className="flex flex-row items-center text-sm text-gray-600 gap-2">
            Trusted by explorers, job seekers worldwide
          </div>
        </div>
      </div>

      {/* Right Column: Bleeding Image Mockup & Floating Cards (hidden on mobile) */}
      <div className="relative w-full items-center mt-10 lg:mt-0 hidden lg:flex">
        
        {/* Floating Card 1: Upload Resume */}
        <div className="absolute -left-2 top-12 lg:-left-12 lg:top-32 z-40 bg-white/80 backdrop-blur-xl -rotate-5 border border-white/60 shadow-xl rounded-2xl p-4 flex items-start gap-4 transition-transform duration-500 hover:-translate-y-2 cursor-pointer max-w-65">
          <div className="w-12 h-12 shrink-0 bg-blue-100/80 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
            <FiUploadCloud size={24} />
          </div>
          <div className="pr-2">
            <p className="text-sm font-bold text-gray-900">Upload Existing</p>
            <p className="text-xs text-gray-500 font-light mt-1 leading-relaxed">Upload your current resume to enhance or update it with AI</p>
          </div>
        </div>

        {/* Floating Card 2: Create Resume */}
        <div className="absolute -left-6 bottom-12 lg:left-5 lg:bottom-18 z-40 bg-white/80 backdrop-blur-xl rotate-3 border border-white/60 shadow-xl rounded-2xl p-4 flex items-start gap-4 transition-transform duration-500 hover:-translate-y-2 cursor-pointer max-w-65">
          <div className="w-12 h-12 shrink-0 bg-purple-100/80 rounded-full flex items-center justify-center text-purple-600 shadow-inner">
            <FiZap size={24} />
          </div>
          <div className="pr-2">
            <p className="text-sm font-bold text-gray-900">Create Resume</p>
            <p className="text-xs text-gray-500 font-light mt-1 leading-relaxed">Start afresh and build a professional resume in a few minutes</p>
          </div>
        </div>

        {/* Frosted Glass Container & Image */}
        <div
          className="
            w-full
            p-4
            bg-white/40
            backdrop-blur-xl
            rounded-2xl
            border border-white/60
            shadow-2xl
            flex
            justify-center
            items-center
            z-0
            lg:absolute lg:left-16 lg:w-[calc(140%+8rem)] lg:h-120.5 lg:max-w-none
          "
        >
          <img
            src={dashboard}
            alt="Resume Builder Interface"
            className="
              w-full
              h-auto
              rounded-l-2xl shadow-2xl border border-gray-200/60 object-cover object-left
              max-w-full
              relative
              transition-transform duration-700 hover:scale-[1.02]
              z-10
            "
            style={{ objectPosition: 'left center' }}
          />
        </div>
      </div>
    </div>

    {/* 5. Joined Companies Section */}
  <div className="w-full  py-8 md:py-12 mt-25 mb-10 relative z-30">
  <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
    <p className="text-gray-500 text-sm md:text-base mb-6 text-center">
      <span className="font-normal text-gray-700 opacity-70 hover:opacity-100">TRUSTED BY PROFESSIONALS AT</span>
    </p>
    <div className="flex flex-wrap justify-center items-center gap-6 md:gap-20">
      {companies.map((company) => (
        <img
          key={company.name}
          src={company.logo}
          alt={company.name}
          className="h-8 md:h-10 w-auto opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition duration-300 cursor-pointer"
          style={{ maxWidth: 120 }}
        />
      ))}
    </div>
  </div>
</div>
  </section>
);

export default HeroSection;