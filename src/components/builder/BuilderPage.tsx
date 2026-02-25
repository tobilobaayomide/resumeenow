import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase'; 
import { useAuth } from '../../context/AuthContext';
import EditorPanel from './editor/EditorPanel';
import LivePreview from './preview/LivePreview';
import { FiDownloadCloud, FiChevronLeft, FiLayout, FiEdit3, FiEye, FiCheck, FiDownload } from 'react-icons/fi';

// Initial empty data structure
const INITIAL_DATA = {
  personalInfo: { fullName: '', email: '', phone: '', jobTitle: '', location: '', website: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
};

const BuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [resumeData, setResumeData] = useState<any>(INITIAL_DATA);
  const [templateId, setTemplateId] = useState(searchParams.get('template') || 'executive');
  const [title, setTitle] = useState(searchParams.get('title') || 'Untitled Resume');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew && id && user) {
      const fetchResume = async () => {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) console.error('Error fetching resume:', error);
        if (data) {
          setResumeData(data.content || INITIAL_DATA);
          setTemplateId(data.template_id || 'executive');
          setTitle(data.title || 'Untitled Resume');
        }
      };
      fetchResume();
    }
  }, [id, isNew, user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
         const targetZoom = window.innerWidth / 794; 
         setZoom(Math.min(Math.max(targetZoom, 0.2), 1));
      } else {
         setZoom(0.9);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const executeImport = async () => {
    setIsImporting(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
      if (error) throw error;

      if (data) {
        const mappedData = {
          personalInfo: {
            fullName: data.full_name || '',
            email: user!.email || '',
            phone: data.phone || '',
            jobTitle: data.headline || '',
            location: data.location || '',
            website: data.website || ''
          },
          summary: data.bio || '',
          experience: Array.isArray(data.experience) ? data.experience : [],
          education: Array.isArray(data.education) ? data.education : [],
          skills: Array.isArray(data.skills) ? data.skills : [],
        };
        setResumeData(mappedData);
        setMobileView('editor'); 
        toast.success("Profile imported successfully!");
      } else {
        toast.error("No Career Profile found.");
      }
    } catch (err: any) {
      toast.error("Failed to import profile: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportProfile = () => {
    if (!user) {
      toast.error("Login required.");
      return;
    }
    toast('Overwrite current resume with Profile data?', {
      action: {
        label: 'Overwrite',
        onClick: () => executeImport(),
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const handleDownload = () => {
    const originalTitle = document.title;
    document.title = `${resumeData.personalInfo.fullName || 'Resume'} - ${title}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const handleSave = async () => {
    if (!user) return toast.error("Login required.");
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        title: title || 'Untitled Resume',
        template_id: templateId,
        content: resumeData,
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        const { data, error } = await supabase.from('resumes').insert([payload]).select().single();
        if (error) throw error;
        toast.success("Resume created successfully!");
        navigate(`/builder/${data.id}?template=${templateId}`, { replace: true });
      } else {
        const { error } = await supabase.from('resumes').update(payload).eq('id', id);
        if (error) throw error;
        toast.success("Resume saved successfully!");
      }
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (section: string, field: string | any, value?: any) => {
    setResumeData((prev: any) => {
      if (section === 'personalInfo' && typeof field === 'string') {
        return { ...prev, personalInfo: { ...prev.personalInfo, [field]: value } };
      }
      if (typeof field === 'object' || Array.isArray(field)) {
         return { ...prev, [section]: field };
      }
      return { ...prev, [section]: value !== undefined ? value : field };
    });
  };

  return (
    // Top level container needs print:block to ensure nothing is hidden on body level
    <div className="flex flex-col h-screen bg-[#F3F4F6] overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white print:block">
      
      {/* HEADER: Hidden on print */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 z-30 shrink-0 shadow-sm transition-all print:hidden">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button onClick={() => navigate('/dashboard')} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:text-black transition-all shadow-sm shrink-0">
            <FiChevronLeft size={16} />
          </button>
          
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          
          <div className="flex flex-col relative group sm:flex">
              <label className="text-[10px] uppercase font-bold text-gray-400 hidden md:block">Project Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-gray-900 text-sm md:text-base focus:outline-none bg-transparent placeholder-gray-300 w-24 md:w-64 truncate"
              />
              <FiEdit3 className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block" size={12}/>
          </div>
        </div>

        <div className="flex md:hidden bg-gray-100 rounded-lg p-0.5 mx-1 shrink-0">
            <button onClick={() => setMobileView('editor')} className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${mobileView === 'editor' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>
                <FiLayout size={14} /> Edit
            </button>
            <button onClick={() => setMobileView('preview')} className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${mobileView === 'preview' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>
                <FiEye size={14} /> View
            </button>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button onClick={handleImportProfile} disabled={isImporting} className="flex px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 items-center gap-2 transition-colors">
             <FiDownloadCloud className={isImporting ? "animate-bounce" : ""} size={16} /> 
             <span className="hidden md:inline">{isImporting ? 'Importing...' : 'Import Profile'}</span>
          </button>

          <button onClick={handleDownload} className="flex px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 items-center gap-2 transition-colors group">
             <FiDownload size={16} className="group-hover:translate-y-0.5 transition-transform" />
             <span className="hidden md:inline">Download PDF</span>
          </button>

          <button onClick={handleSave} disabled={isSaving} className={`px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all shadow-md ${isSaving ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg'}`}>
            {isSaving ? <span className="animate-spin">⟳</span> : <FiCheck size={16} />}
            <span className="hidden md:inline">{isSaving ? 'Saving' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex flex-1 overflow-hidden relative isolate print:block print:h-auto print:overflow-visible">
        
        {/* EDITOR PANEL: Hidden on print */}
        <div className={`h-full border-r border-gray-200 bg-white shadow-xl z-20 transition-transform duration-300 ease-in-out absolute md:relative w-full md:w-auto shrink-0 print:hidden ${mobileView === 'editor' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
           <EditorPanel data={resumeData} onChange={handleChange} />
        </div>

        {/* PREVIEW PANEL: Visible and Reset on print */}
        <div className={`
            flex-1 h-full relative bg-[#525659] -ml-40 md:ml-0 flex flex-col min-w-0 transition-opacity duration-300
            ${mobileView === 'preview' ? 'opacity-100 z-30' : 'opacity-0 md:opacity-100 -z-10 md:z-auto'}
            absolute md:relative w-full h-full inset-0 md:inset-auto
            print:opacity-100! print:z-50! print:visible! print:static! print:block! print:h-auto! print:w-full! print:m-0! print:bg-white! print:overflow-visible!
        `}>
           {/* Inner scrolling container needs reset for print */}
           <div className="flex-1 overflow-y-auto overflow-x-hidden md:overflow-auto flex justify-center items-start pt-4 md:pt-8 md:p-8 touch-pan-y w-full print:p-0 print:block print:h-auto print:overflow-visible">
              <LivePreview data={resumeData} templateId={templateId} zoom={zoom} />
           </div>
           
           <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border border-gray-200 p-1.5 flex gap-1 z-50 print:hidden">
               <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 active:scale-95 transition-transform">-</button>
               <span className="w-12 flex items-center justify-center text-xs font-bold text-gray-500 tabular-nums">{Math.round(zoom * 100)}%</span>
               <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600 active:scale-95 transition-transform">+</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;