import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiSearch,
  FiBell,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import Sidebar from "./Sidebar";

// Enhanced Template Data with layout hints
const TEMPLATES = [
  {
    id: "executive",
    name: "The Executive",
    desc: "Clean, authoritative, 2-column.",
    color: "bg-slate-50",
    layout: (
      <div className="flex w-full h-full gap-2 p-3 opacity-60">
        <div className="w-2/3 h-full gap-2 flex flex-col">
          <div className="w-full h-2 bg-gray-900 rounded-sm mb-1" />
          <div className="w-full h-1 bg-gray-300 rounded-sm" />
          <div className="w-full h-full bg-white shadow-sm border border-gray-100 rounded-sm mt-2" />
        </div>
        <div className="w-1/3 h-full bg-gray-100 rounded-sm p-1 gap-1 flex flex-col">
          <div className="w-full h-1 bg-gray-300 rounded-sm" />
          <div className="w-full h-1 bg-gray-300 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: "studio",
    name: "Studio",
    desc: "Bold typography, left sidebar.",
    color: "bg-stone-50",
    layout: (
      <div className="flex w-full h-full opacity-60">
        <div className="w-1/3 h-full bg-gray-900 p-2 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 mb-2" />
          <div className="w-full h-1 bg-white/20 rounded-sm" />
          <div className="w-2/3 h-1 bg-white/20 rounded-sm" />
        </div>
        <div className="w-2/3 h-full bg-white p-2 flex flex-col gap-2">
          <div className="w-full h-3 bg-gray-200 rounded-sm mb-2" />
          <div className="w-full h-1 bg-gray-100 rounded-sm" />
          <div className="w-full h-1 bg-gray-100 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: "silicon",
    name: "Silicon",
    desc: "Monospace, tech-focused.",
    color: "bg-blue-50/50",
    layout: (
      <div className="flex flex-col w-full h-full p-3 gap-2 opacity-60 font-mono">
        <div className="w-full border-b border-gray-300 pb-2 mb-1">
          <div className="w-1/2 h-2 bg-gray-800 rounded-sm mb-1" />
        </div>
        <div className="w-full h-1 bg-blue-100/50 rounded-sm" />
        <div className="w-3/4 h-1 bg-gray-200 rounded-sm" />
        <div className="flex gap-1 mt-2">
          <div className="px-1 py-0.5 bg-gray-100 text-[4px] rounded border border-gray-200">
            JS
          </div>
          <div className="px-1 py-0.5 bg-gray-100 text-[4px] rounded border border-gray-200">
            TS
          </div>
          <div className="px-1 py-0.5 bg-gray-100 text-[4px] rounded border border-gray-200">
            PY
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "mono",
    name: "Mono",
    desc: "Minimalist, pure typography.",
    color: "bg-white",
    layout: (
      <div className="flex flex-col w-full h-full p-4 gap-3 opacity-60 items-center text-center">
        <div className="w-1/2 h-4 bg-black rounded-sm mb-2" />
        <div className="w-full h-1 bg-gray-200 rounded-sm" />
        <div className="w-full h-px bg-gray-100 my-1" />
        <div className="w-full grid grid-cols-2 gap-2 text-left">
          <div className="h-8 bg-gray-50 rounded-sm" />
          <div className="h-8 bg-gray-50 rounded-sm" />
        </div>
      </div>
    ),
  },
];

interface DashboardViewProps {
  userEmail: string | undefined;
  resumes: any[];
  isLoading: boolean;
  newTitle: string;
  isCreating: boolean;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateResume?: (templateId: string) => void;
  onDeleteResume: (id: string) => void;
  onUploadResume: (file: File) => void;
  username?: string;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  resumes,
  isLoading,
  onCreateResume,
  onDeleteResume,
  onUploadResume,
  username,
}) => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Use only real data. If empty, the component handles empty state below.
  const displayResumes = resumes || [];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative">
        <header className="h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#FDFDFD]/80 backdrop-blur-md">
          <div className="flex flex-col">
            <h1 className="text-xl font-medium tracking-tight text-black">
              Overview
            </h1>
            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100/50 rounded-lg hover:bg-gray-100 transition-colors w-64 group cursor-text">
              <FiSearch className="text-gray-400 group-hover:text-black transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 text-black"
              />
              <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                ⌘K
              </span>
            </div>
            <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
              <FiBell size={20} />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-4 ring-gray-100 transition-all">
              {username?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 md:px-12 pb-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto pt-4">
            <div className="mb-16">
              <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-black mb-4">
                {greeting}, {username?.split(" ")[0] || "Creative"}.
              </h2>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                <p className="text-lg text-gray-500 font-light max-w-xl leading-relaxed">
                  You have{" "}
                  <span className="text-black font-medium">
                    {displayResumes.length} documents
                  </span>{" "}
                  in your workspace. Your last activity was{" "}
                  <span className="text-black font-medium">recently</span>.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="group flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-xl shadow-black/5 active:scale-95"
                  >
                    <FiPlus className="group-hover:rotate-90 transition-transform duration-300" />
                    Create New
                  </button>
                  <label className="cursor-pointer group flex items-center justify-center w-12 h-12 rounded-full border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all text-gray-600">
                    <FiUploadCloud size={20} />
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) =>
                        e.target.files?.[0] && onUploadResume(e.target.files[0])
                      }
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* PREMIUM TEMPLATE PICKER MODAL */}
            {showTemplateModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowTemplateModal(false);
                }}
              >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white relative z-10">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                        Pick a structure
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Select a starting point. you can change the content
                        anytime.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  {/* Grid */}
                  <div className="p-8 bg-[#FAFAFA] overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            // CRITICAL FIX: Do NOT generate a timestamp ID here.
                            // Delegate entirely to parent handler.
                            if (onCreateResume) {
                              onCreateResume(template.id);
                            }
                            setShowTemplateModal(false);
                          }}
                          className="group relative flex flex-col text-left transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1"
                        >
                          {/* Visual Card */}
                          <div
                            className={`
                                        aspect-[1/1.4] w-full rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4 relative
                                        ${template.color} transition-all duration-300 group-hover:shadow-xl group-hover:border-gray-300 group-hover:shadow-black/5
                                    `}
                          >
                            {/* Layout Preview (Abstract) */}
                            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
                              {template.layout}
                            </div>

                            {/* Hover Button Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                Select
                              </span>
                            </div>
                          </div>

                          {/* Text Info */}
                          <h3 className="font-bold text-sm text-gray-900 group-hover:text-black">
                            {template.name}
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                            {template.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-12 gap-8 lg:gap-12">
              <div className="col-span-12 lg:col-span-8">
                {/* Removed Filter Tabs since functionality is simplified */}

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-3/4 md:aspect-4/3 bg-gray-50 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : displayResumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-24 text-gray-400">
                    <p className="text-lg italic font-light mb-6">
                      no resumes yet
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => setShowTemplateModal(true)}
                        className="group flex items-center gap-2 bg-black text-white px-6 py-5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-xl shadow-black/5 active:scale-95"
                      >
                        <FiPlus className="group-hover:rotate-90 transition-transform duration-300" />
                        Create Your First Resume
                      </button>
                      <label className="group flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-5 rounded-full text-sm font-medium hover:bg-black hover:text-white hover:border-black transition-all shadow-xl shadow-black/5 active:scale-95 cursor-pointer">
                        <FiUploadCloud className="group-hover:text-white transition-colors" />
                        Upload Existing Resume
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            onUploadResume(e.target.files[0])
                          }
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayResumes.map((resume) => (
                      <div
                        key={resume.id}
                        onClick={() =>
                          navigate(
                            `/builder/${resume.id}?template=${resume.template_id || "executive"}`,
                          )
                        }
                        className="group relative bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-all duration-300 select-none hover:shadow-2xl hover:shadow-black/5 overflow-hidden flex flex-col h-full cursor-pointer"
                      >
                        <div className="aspect-[1.4] bg-[#FAFAFA] relative flex items-center justify-center overflow-hidden border-b border-gray-50 p-8 group-hover:bg-gray-50/50 transition-colors">
                          <div className="w-full h-full bg-white shadow-sm border border-gray-200/50 transform group-hover:-translate-y-2 transition-transform duration-500 p-6 flex flex-col gap-3">
                            <div className="w-1/3 h-2 bg-gray-100 rounded-sm"></div>
                            <div className="w-full h-1 bg-gray-50"></div>
                            <div className="w-full h-1 bg-gray-50"></div>
                            <div className="mt-4 flex gap-4">
                              <div className="w-1/4 h-16 bg-gray-50"></div>
                              <div className="flex-1 space-y-2">
                                <div className="w-full h-1 bg-gray-50"></div>
                                <div className="w-5/6 h-1 bg-gray-50"></div>
                                <div className="w-4/6 h-1 bg-gray-50"></div>
                              </div>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] flex items-center justify-center gap-3">
                            <button className="bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg">
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="p-5 bg-white">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                                {resume.title || "Untitled"}
                              </h3>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Last updated{" "}
                                {new Date(
                                  resume.updated_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteResume(resume.id);
                              }}
                              className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-gray-50 rounded-md"
                              title="Delete"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Simple Quick Add Card at the end */}
                    <div
                      className="relative group border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 min-h-50 hover:bg-gray-50 transition-colors bg-gray-50/50 p-6 cursor-pointer"
                      onClick={() => setShowTemplateModal(true)}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform text-gray-400 shadow-sm mb-2">
                        <FiPlus />
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        New Document
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden lg:block lg:col-span-4 space-y-8 pl-8 border-l border-gray-100/50">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
                    Onboarding
                  </h4>
                  <div className="relative pl-4 border-l border-gray-200 space-y-8">
                    {[
                      { label: "Account Created", done: true },
                      {
                        label: "First Resume",
                        done: displayResumes.length > 0,
                      },
                      { label: "Export PDF", done: false },
                    ].map((step, idx) => (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-5.25 top-0.5 w-2.5 h-2.5 rounded-full border-2 ${step.done ? "bg-black border-black" : "bg-white border-gray-300"}`}
                        ></span>
                        <p
                          className={`text-sm font-medium ${step.done ? "text-gray-400 line-through" : "text-black"}`}
                        >
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardView;
