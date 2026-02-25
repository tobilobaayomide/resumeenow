import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useAuth } from '../../context/AuthContext';
import { 
  FiEdit3, FiMapPin, FiLink, FiMail, FiPhone, FiPlus, 
  FiBriefcase, FiUser, FiTrash2, FiX, FiBook
} from 'react-icons/fi'; 
import { toast } from 'sonner';
import Sidebar from './Sidebar';

// --- TYPES ---
interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  date: string;
  description: string;
}

interface EducationItem {
  id: string;
  school: string;
  degree: string;
  date: string;
}

const CareerProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [activeModal, setActiveModal] = useState<'experience' | 'education' | null>(null);
  const [newExp, setNewExp] = useState<ExperienceItem>({ id: '', role: '', company: '', date: '', description: '' });
  const [newEdu, setNewEdu] = useState<EducationItem>({ id: '', school: '', degree: '', date: '' });
  const [newSkill, setNewSkill] = useState('');
  const [profile, setProfile] = useState({
    full_name: '',
    headline: '',
    location: '',
    email: '', 
    phone: '',
    website: '',
    bio: '',
    experience: [] as ExperienceItem[],
    education: [] as EducationItem[],
    skills: [] as string[],
  });

  // 1. FETCH DATA
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setProfile(prev => ({ 
            ...prev, 
            ...data, 
            email: user.email || '', 
            experience: Array.isArray(data.experience) ? data.experience : [],
            education: Array.isArray(data.education) ? data.education : [],
            skills: Array.isArray(data.skills) ? data.skills : [],
          }));
        } else {
          setProfile(prev => ({ 
            ...prev, 
            full_name: user?.user_metadata?.full_name || '', 
            email: user?.email || '' 
          }));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchProfile();
  }, [user]);

  // 2. GENERIC SAVE FUNCTION
  const handleSave = async (updatedProfile = profile, showToast = true) => {
    if (!user) return;
    setSaving(true);
    try {
      // Remove email before saving to DB
      const { email, ...updatesForDb } = updatedProfile;
      const updates = {
        id: user.id,
        ...updatesForDb,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').upsert(updates).select();
      if (error) throw error;
      setIsEditingHeader(false);
      setIsEditingAbout(false);
      if (showToast) toast.success('Profile saved successfully!');
    } catch (error: any) {
      toast.error('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 3. HELPERS
  const handleChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // --- EXPERIENCE LOGIC ---
  const addExperience = () => {
    const updated = { ...profile, experience: [...profile.experience, { ...newExp, id: Date.now().toString() }] };
    setProfile(updated);
    handleSave(updated, false); // Save silently
    toast.success('Experience added!');
    setActiveModal(null);
    setNewExp({ id: '', role: '', company: '', date: '', description: '' });
  };

  const deleteExperience = (id: string) => {
    toast('Delete this role?', {
      action: {
        label: 'Delete',
        onClick: () => {
          const updated = { ...profile, experience: profile.experience.filter(i => i.id !== id) };
          setProfile(updated);
          handleSave(updated, false);
          toast.success('Role deleted');
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  // --- EDUCATION LOGIC ---
  const addEducation = () => {
    const updated = { ...profile, education: [...profile.education, { ...newEdu, id: Date.now().toString() }] };
    setProfile(updated);
    handleSave(updated, false); // Save silently
    toast.success('Education added!');
    setActiveModal(null);
    setNewEdu({ id: '', school: '', degree: '', date: '' });
  };

  const deleteEducation = (id: string) => {
    toast('Delete this school?', {
      action: {
        label: 'Delete',
        onClick: () => {
          const updated = { ...profile, education: profile.education.filter(i => i.id !== id) };
          setProfile(updated);
          handleSave(updated, false);
          toast.success('School deleted');
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  // --- SKILLS LOGIC ---
  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      if (profile.skills.includes(newSkill.trim())) return;
      const updated = { ...profile, skills: [...profile.skills, newSkill.trim()] };
      setProfile(updated);
      handleSave(updated, false);
      setNewSkill('');
    }
  };
  
  const deleteSkill = (skillToDelete: string) => {
    const updated = { ...profile, skills: profile.skills.filter(s => s !== skillToDelete) };
    setProfile(updated);
    handleSave(updated, false);
  };

  // --- SKELETON LOADER COMPONENT ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
          <div className="h-48 md:h-64 bg-slate-50 border-b border-gray-200 animate-pulse">
             <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-4 md:pb-8 translate-y-1/2 flex items-end gap-4 md:gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-2xl border border-white"></div>
                <div className="mb-2 md:mb-4 space-y-2 md:space-y-3 w-2/3 md:w-1/3">
                   <div className="h-6 md:h-8 bg-gray-200 rounded w-full"></div>
                   <div className="h-3 md:h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
             </div>
          </div>
          <div className="mt-16 md:mt-24 px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
             <div className="col-span-1 md:col-span-4 h-64 bg-gray-100 rounded-xl animate-pulse"></div>
             <div className="col-span-1 md:col-span-8 space-y-8">
                <div className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
                <div className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-sans text-[#1a1a1a] selection:bg-black selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen relative w-full overflow-hidden">
        
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-12">
            {/* HERO SECTION */}
            <div className="relative h-48 md:h-64 bg-white border-b border-gray-200 group">
                <div className="absolute inset-0 bg-[#FAFAFA] opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px]"></div>
                
                {/* Edit Header Button - Always visible on mobile, hover on desktop */}
                <div className="absolute top-10 right-4 md:top-6 md:right-12 z-20 opacity-100 md:opacity-0 group-hover:opacity-70 transition-opacity">
                {!isEditingHeader ? (
                    <button onClick={() => setIsEditingHeader(true)} className="bg-white border border-gray-200 text-black px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs font-light shadow-sm hover:bg-gray-50 flex items-center gap-2">
                    <FiEdit3 /> <span className="hidden sm:inline">Edit Header</span>
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditingHeader(false)} className="bg-white border text-gray-500 px-3 py-1.5 md:py-2 rounded-lg text-xs font-light">Cancel</button>
                        <button onClick={() => handleSave(profile, true)} disabled={saving} className="bg-black text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs font-light flex items-center gap-2">
                        {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                )}
                </div>

                <div className="absolute bottom-0 left-0 w-full px-4 md:px-8 lg:px-12 pb-4 md:pb-8 translate-y-1/2 flex items-end justify-between">
                    <div className="flex items-end gap-4 md:gap-6 w-full">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border border-gray-200 shadow-xl p-1 shrink-0 flex items-center justify-center">
                            <div className="w-full h-full bg-black text-white rounded-xl flex items-center justify-center text-3xl md:text-4xl font-normal uppercase">{profile.full_name?.charAt(0) || "U"}</div>
                        </div>
                        <div className="mb-1 md:mb-2 space-y-1 md:space-y-2 w-full max-w-lg">
                            {isEditingHeader ? (
                            <>
                                <input value={profile.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Full Name" className="block text-xl md:text-3xl font-light text-black bg-white/50 border-b-2 border-black outline-none w-full py-1" />
                                <input value={profile.headline} onChange={(e) => handleChange('headline', e.target.value)} placeholder="Headline" className="block text-sm md:text-lg text-gray-600 font-extralight bg-white/50 border-b-2 border-gray-300 focus:border-black outline-none w-full py-1" />
                            </>
                            ) : (
                            <>
                                <h1 className="text-xl md:text-3xl font-normal text-black tracking-tight truncate">{profile.full_name || "New User"}</h1>
                                <p className="text-sm md:text-lg text-gray-500 font-light truncate">{profile.headline || "Add a professional headline"}</p>
                            </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="px-4 md:px-8 lg:px-12 pt-16 md:pt-24 pb-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                
                {/* LEFT COLUMN */}
                <div className="col-span-1 md:col-span-4 space-y-6 md:space-y-8">
                    {/* Contact Info */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact</h3>
                            <button onClick={() => setIsEditingHeader(!isEditingHeader)} className="text-gray-400 hover:text-black p-1"><FiEdit3 size={14}/></button>
                        </div>
                        <ul className="space-y-4 text-sm font-light text-gray-600">
                            <li className="flex items-center gap-3 overflow-hidden"><FiMail className="text-gray-400 shrink-0" /> <span className="truncate">{user?.email}</span></li>
                            <li className="flex items-center gap-3"><FiPhone className="text-gray-400 shrink-0" /> {isEditingHeader ? <input className="border-b w-full outline-none bg-transparent" value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} /> : <span className="truncate">{profile.phone || "No phone"}</span>}</li>
                            <li className="flex items-center gap-3"><FiMapPin className="text-gray-400 shrink-0" /> {isEditingHeader ? <input className="border-b w-full outline-none bg-transparent" value={profile.location} onChange={(e) => handleChange('location', e.target.value)} /> : <span className="truncate">{profile.location || "No location"}</span>}</li>
                            <li className="flex items-center gap-3"><FiLink className="text-gray-400 shrink-0" /> {isEditingHeader ? <input className="border-b w-full outline-none bg-transparent" value={profile.website} onChange={(e) => handleChange('website', e.target.value)} /> : <a href="#" className="border-b border-black/20 truncate hover:text-black transition-colors">{profile.website || "No website"}</a>}</li>
                        </ul>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {profile.skills.map((skill, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-light flex items-center gap-2 group">
                                    {skill}
                                    <button onClick={() => deleteSkill(skill)} className="text-gray-400 hover:text-red-500"><FiX size={12} /></button>
                                </span>
                            ))}
                        </div>
                        <input 
                            type="text" 
                            placeholder="Add skill & press Enter" 
                            className="w-full text-sm border-b border-gray-200 focus:border-black outline-none py-1 bg-transparent"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={addSkill}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="col-span-1 md:col-span-8 space-y-10 md:space-y-12">
                    
                    {/* About */}
                    <section className="group">
                        <div className="flex justify-between items-center mb-3 md:mb-4">
                            <h2 className="text-lg font-normal text-black flex items-center gap-2"><FiUser className="text-gray-400" /> About</h2>
                            {isEditingAbout ? (
                                <button onClick={() => handleSave(profile, true)} className="text-xs font-normal text-green-600 bg-green-50 px-3 py-1 rounded-md">Save</button>
                            ) : (
                                <button onClick={() => setIsEditingAbout(true)} className="text-xs font-normal text-gray-400 md:opacity-0 group-hover:opacity-100 hover:text-black transition-all bg-gray-50 px-3 py-1 rounded-md">Edit</button>
                            )}
                        </div>
                        {isEditingAbout ? (
                        <textarea className="w-full p-4 border rounded-lg text-gray-600 min-h-30 outline-none font-extralight border-black resize-y text-sm md:text-base" value={profile.bio} onChange={(e) => handleChange('bio', e.target.value)} />
                        ) : (
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed font-extralight whitespace-pre-wrap">{profile.bio || "No bio added yet."}</p>
                        )}
                    </section>

                    {/* Experience */}
                    <section>
                        <div className="flex justify-between items-end mb-4 md:mb-6 border-b border-gray-100 pb-2">
                            <h2 className="text-lg font-normal text-black flex items-center gap-2"><FiBriefcase className="text-gray-400" /> Experience</h2>
                            <button onClick={() => setActiveModal('experience')} className="text-xs font-normal bg-gray-100 px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-colors flex items-center gap-1">
                            <FiPlus /> Add
                            </button>
                        </div>
                        {profile.experience.length === 0 ? <p className="text-gray-400 text-sm italic">No experience listed.</p> : (
                            <div className="space-y-6 md:space-y-8">
                                {profile.experience.map((exp) => (
                                    <div key={exp.id} className="relative group pr-8">
                                        <h3 className="font-normal text-gray-900 text-sm md:text-base">{exp.role}</h3>
                                        <div className="text-xs md:text-sm font-normal text-gray-500 mb-2">{exp.company} • {exp.date}</div>
                                        <p className="text-xs font-extralight md:text-sm text-gray-600 leading-relaxed">{exp.description}</p>
                                        <button onClick={() => deleteExperience(exp.id)} className="absolute top-0 right-0 text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"><FiTrash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Education */}
                    <section>
                        <div className="flex justify-between items-end mb-4 md:mb-6 border-b border-gray-100 pb-2">
                            <h2 className="text-lg font-normal text-black flex items-center gap-2"><FiBook className="text-gray-400" /> Education</h2>
                            <button onClick={() => setActiveModal('education')} className="text-xs font-normal bg-gray-100 px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-colors flex items-center gap-1">
                            <FiPlus /> Add
                            </button>
                        </div>
                        {profile.education.length === 0 ? <p className="text-gray-400 text-sm italic">No education listed.</p> : (
                            <div className="space-y-5 md:space-y-6">
                                {profile.education.map((edu) => (
                                    <div key={edu.id} className="relative group flex items-start gap-3 md:gap-4 pr-8">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-base md:text-lg font-normal shrink-0">
                                            {edu.school.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-normal text-gray-900 text-sm md:text-base">{edu.school}</h3>
                                            <div className="text-xs font-light md:text-sm text-gray-600">{edu.degree}</div>
                                            <div className="text-[10px] font-light md:text-xs text-gray-400 mt-0.5">{edu.date}</div>
                                        </div>
                                        <button onClick={() => deleteEducation(edu.id)} className="absolute top-0 right-0 text-gray-300 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"><FiTrash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                </div>
            </main>
        </div>

        {/* --- MODALS --- */}
        
        {/* Experience Modal */}
        {activeModal === 'experience' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transform transition-all scale-100 max-h-[90vh] flex flex-col">
                    <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                           <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black text-white flex items-center justify-center text-xs md:text-sm"><FiBriefcase /></div>
                           Add Experience
                        </h3>
                        <button onClick={()=>setActiveModal(null)} className="text-gray-400 hover:text-black transition-colors bg-white p-1.5 md:p-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"><FiX size={18} /></button>
                    </div>
                    
                    <div className="p-5 md:p-8 space-y-4 md:space-y-5 overflow-y-auto">
                       <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Role Title</label>
                                <input className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium" 
                                       placeholder="e.g. Senior Product Designer" 
                                       value={newExp.role} onChange={e=>setNewExp({...newExp, role: e.target.value})} 
                                       autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Company</label>
                                    <input className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all" 
                                           placeholder="e.g. Google" 
                                           value={newExp.company} onChange={e=>setNewExp({...newExp, company: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Duration</label>
                                    <div className="relative">
                                        <input className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all" 
                                            placeholder="2020 - Present" 
                                            value={newExp.date} onChange={e=>setNewExp({...newExp, date: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                                <textarea className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all min-h-25 resize-none" 
                                          placeholder="Describe your responsibilities and achievements..." 
                                          value={newExp.description} onChange={e=>setNewExp({...newExp, description: e.target.value})} />
                            </div>
                       </div>
                    </div>
                    <div className="px-5 md:px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button onClick={()=>setActiveModal(null)} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm text-gray-500 hover:text-black hover:bg-gray-100 transition-colors">Cancel</button>
                        <button onClick={addExperience} disabled={!newExp.role} className="px-6 md:px-8 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10 transition-all">Add Role</button>
                    </div>
                </div>
            </div>
        )}

        {/* Education Modal */}
        {activeModal === 'education' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transform transition-all scale-100 max-h-[90vh] flex flex-col">
                    <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                           <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black text-white flex items-center justify-center text-xs md:text-sm"><FiBook /></div>
                           Add Education
                        </h3>
                        <button onClick={()=>setActiveModal(null)} className="text-gray-400 hover:text-black transition-colors bg-white p-1.5 md:p-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md"><FiX size={18} /></button>
                    </div>

                    <div className="p-5 md:p-8 space-y-4 md:space-y-5 overflow-y-auto">
                       <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">School / University</label>
                                <input className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium" 
                                       placeholder="e.g. Stanford University" 
                                       value={newEdu.school} onChange={e=>setNewEdu({...newEdu, school: e.target.value})} 
                                       autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Degree</label>
                                    <input className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all" 
                                           placeholder="e.g. Master's in CS" 
                                           value={newEdu.degree} onChange={e=>setNewEdu({...newEdu, degree: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Year</label>
                                    <div className="relative">
                                        <input className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-black outline-none transition-all" 
                                            placeholder="2022" 
                                            value={newEdu.date} onChange={e=>setNewEdu({...newEdu, date: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 md:px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button onClick={()=>setActiveModal(null)} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm text-gray-500 hover:text-black hover:bg-gray-100 transition-colors">Cancel</button>
                        <button onClick={addEducation} disabled={!newEdu.school} className="px-6 md:px-8 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10 transition-all">Add Education</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default CareerProfile;