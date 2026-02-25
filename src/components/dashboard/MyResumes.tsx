import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // <-- 1. Import toast
import { 
  FiSearch, 
  FiGrid, 
  FiList, 
  FiPlus, 
  FiMoreVertical, 
  FiFileText, 
  FiTrash2,
  FiEdit3
} from 'react-icons/fi';
import Sidebar from './Sidebar';
import { useResumes } from '../../hooks/useResumes';
import { useAuth } from '../../context/AuthContext';

const MyResumes: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  // 1. Get User & Data
  const { user } = useAuth();
  const { resumes, loading, deleteResume } = useResumes(user?.id);

  // 2. Filter Resumes based on search
  const filteredResumes = resumes.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Updated Delete Logic using Sonner
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    toast('Are you sure you want to delete this resume?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteResume(id);
            toast.success('Resume deleted successfully!');
          } catch (error) {
            toast.error('Failed to delete resume.');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => console.log('Deletion cancelled'),
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Header - Adjusted padding for mobile */}
        <header className="h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#FDFDFD]/80 backdrop-blur-md">
           <div>
              <h1 className="text-lg md:text-xl font-medium tracking-tight text-black">My Resumes</h1>
              <p className="text-[10px] md:text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 block">
                  Library • {filteredResumes.length} Items
              </p>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
              {/* Responsive Search Bar */}
              <div className="group flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gray-50 border border-gray-100 rounded-lg w-28 sm:w-48 md:w-64 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
                  <FiSearch className="text-gray-400 group-focus-within:text-black shrink-0" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-transparent border-none outline-none text-xs md:text-sm w-full text-black placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>

               <button 
                onClick={() => navigate('/dashboard')} 
                className="bg-black text-white p-1.5 md:p-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 shrink-0"
               >
                  <FiPlus size={18} className="md:w-5 md:h-5" />
               </button>
           </div>
        </header>

        {/* Workspace - Added pb-24 for mobile bottom nav clearance */}
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 overflow-y-auto pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 md:p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FiGrid size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 md:p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FiList size={16} />
                    </button>
                </div>
                
                {/* Sort */}
                <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-gray-500">
                    <span className="hidden sm:inline">Sort by:</span>
                    <select className="bg-transparent border-none outline-none text-black font-bold cursor-pointer">
                        <option>Date Modified</option>
                        <option>Name (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                    {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[1/1.41] bg-gray-50 rounded-lg animate-pulse" />)}
                </div>
            ) : filteredResumes.length === 0 ? (
                 <div className="h-[50vh] border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FiFileText size={24} className="text-gray-300" />
                    </div>
                    <h2 className="text-base md:text-lg font-medium text-black">No documents found</h2>
                    <p className="text-gray-400 text-xs md:text-sm mt-1 max-w-xs mb-6">Create a new resume to start building your professional profile.</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="px-5 md:px-6 py-2 bg-black text-white text-xs md:text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
                    >
                        Create New Resume
                    </button>
                </div>
            ) : (
                <>
                    {/* --- GRID VIEW --- */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
                            {filteredResumes.map((resume) => (
                                <div 
                                    key={resume.id} 
                                    className="group flex flex-col gap-2 md:gap-3 cursor-pointer"
                                    onClick={() => navigate(`/builder/${resume.id}?template=${resume.template_id || 'executive'}`)}
                                >
                                    {/* Card Preview */}
                                    <div className={`relative aspect-[1/1.41] bg-white border border-gray-100 rounded-lg shadow-sm group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden`}>
                                        
                                        {/* Abstract Paper Content */}
                                        <div className="absolute inset-2 md:inset-3 bg-white border border-gray-50 shadow-inner flex flex-col p-2 md:p-3 gap-1.5 md:gap-2 opacity-80">
                                            <div className="w-1/3 h-1 md:h-1.5 bg-gray-100 rounded-full"></div>
                                            <div className="w-full h-0.5 md:h-1 bg-gray-50 rounded-full"></div>
                                            <div className="w-full h-10 md:h-16 bg-gray-50/50 rounded-sm mt-1"></div>
                                            <div className="space-y-1 mt-1">
                                                <div className="w-full h-0.5 md:h-1 bg-gray-50"></div>
                                                <div className="w-5/6 h-0.5 md:h-1 bg-gray-50"></div>
                                            </div>
                                        </div>

                                        {/* Hover Actions Overlay (Always visible on mobile, hover on desktop) */}
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 md:gap-3">
                                            <button className="bg-white text-black px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform">Edit</button>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => handleDelete(resume.id, e)}
                                                    className="p-1.5 md:p-2 bg-white/10 text-white rounded-full hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors border border-white/20"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex justify-between items-start px-1">
                                        <div className="flex-1 min-w-0 pr-1">
                                            <h3 className="font-medium text-xs md:text-sm text-gray-900 group-hover:text-black transition-colors truncate w-full">{resume.title || "Untitled Resume"}</h3>
                                            <p className="text-[9px] md:text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                                                {new Date(resume.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button className="text-gray-300 hover:text-black transition-colors shrink-0 md:hidden">
                                            <FiMoreVertical size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {/* New Resume Ghost Card */}
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="aspect-[1/1.41] border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black hover:bg-gray-50 transition-all duration-300 group"
                            >
                                <div className="p-2 md:p-3 rounded-full border border-gray-100 group-hover:border-black/10 mb-2 transition-colors">
                                    <FiPlus size={20} className="md:w-6 md:h-6" />
                                </div>
                                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">New Resume</span>
                            </button>
                        </div>
                    )}

                    {/* --- LIST VIEW --- */}
                    {viewMode === 'list' && (
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#FAFAFA] text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                    <tr>
                                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">Name</th>
                                        {/* Hidden on mobile */}
                                        <th className="hidden sm:table-cell px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">Template</th>
                                        <th className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">Last Modified</th>
                                        <th className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs md:text-sm">
                                    {filteredResumes.map((resume) => (
                                        <tr key={resume.id} 
                                            onClick={() => navigate(`/builder/${resume.id}?template=${resume.template_id || 'executive'}`)}
                                            className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                                        >
                                            <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-gray-900 flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-10 bg-gray-100 border border-gray-200 rounded-sm flex items-center justify-center text-gray-300 shrink-0">
                                                    <FiFileText size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-30 sm:max-w-50 md:max-w-62.5">{resume.title || "Untitled"}</span>
                                                    {/* Show date on mobile under the title since column is hidden */}
                                                    <span className="text-[10px] text-gray-400 md:hidden mt-0.5">{new Date(resume.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-4 md:px-6 py-3 md:py-4">
                                                <span className="px-2 py-1 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wide border bg-gray-50 text-gray-500 border-gray-100">
                                                    {resume.template_id || 'Default'}
                                                </span>
                                            </td>
                                            <td className="hidden md:table-cell px-4 md:px-6 py-3 md:py-4 text-gray-500">
                                                {new Date(resume.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                                {/* Always visible on mobile, hover on desktop */}
                                                <div className="flex items-center justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/builder/${resume.id}?template=${resume.template_id}`); }}
                                                        className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200 shadow-sm hover:shadow" 
                                                        title="Edit"
                                                    >
                                                        <FiEdit3 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(resume.id, e)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-all border border-transparent hover:border-gray-200 shadow-sm hover:shadow" 
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyResumes;