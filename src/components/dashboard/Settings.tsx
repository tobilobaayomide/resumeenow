import React, { useState, useEffect, useRef } from 'react';
import { 
  FiUser, FiCreditCard, FiBell, FiUpload, FiShield, FiMail, FiCheck
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Sidebar from './Sidebar';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const tabs = [
    { id: 'profile', label: 'General', icon: FiUser, description: 'Profile details & public info' },
    { id: 'account', label: 'Security', icon: FiShield, description: 'Password & authentication' },
    { id: 'billing', label: 'Billing', icon: FiCreditCard, description: 'Manage your subscription' },
    { id: 'notifications', label: 'Notifications', icon: FiBell, description: 'Email preferences' },
  ];

  // 1. Fetch User Data
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const names = (data.full_name || '').split(' ');
          setFirstName(names[0] || '');
          setLastName(names.slice(1).join(' ') || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || null);
        } else {
            const metaName = user.user_metadata?.full_name || '';
            const names = metaName.split(' ');
            setFirstName(names[0] || '');
            setLastName(names.slice(1).join(' ') || '');
        }
      } catch (err: any) {
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // 2. Save Changes
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      
      const updates = {
        id: user.id,
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  // 3. Upload Avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const loadingToast = toast.loading('Uploading avatar...');

    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      toast.dismiss(loadingToast);
      toast.success('Avatar uploaded');

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error('Upload failed: ' + error.message);
    }
  };

  if (loading) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] flex font-sans">
             <Sidebar />
             <div className="flex-1 flex items-center justify-center">
                 <div className="animate-pulse flex flex-col items-center gap-4">
                     <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                     <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                 </div>
             </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-gray-900 selection:bg-black selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden w-full">
        {/* Subtle Background Texture */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        <main className="flex-1 px-4 md:px-8 lg:px-16 py-8 md:py-12 overflow-y-auto pb-32">
            <div className="max-w-6xl mx-auto w-full">
                
                {/* Header Section */}
                <div className="mb-10 md:mb-14">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">Settings</h1>
                    <p className="text-sm md:text-base text-gray-500 font-normal">Manage your account settings and preferences.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                    
                    {/* LEFT: Navigation Tabs */}
                    <nav className="w-full lg:w-64 shrink-0 space-y-1">
                        {/* Mobile Scrollable Nav */}
                        <div className="flex lg:hidden overflow-x-auto pb-4 gap-2 no-scrollbar -mx-4 px-4 sticky top-0 bg-[#F9FAFB]/95 backdrop-blur z-20 pt-2">
                             {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                                        activeTab === tab.id 
                                            ? 'bg-black text-white border-black shadow-md' 
                                            : 'bg-white text-gray-600 border-gray-200 shadow-sm'
                                    }`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Desktop Sidebar Nav */}
                        <div className="hidden lg:block sticky top-8">
                            <div className="relative">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full group flex items-start gap-4 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
                                            activeTab === tab.id 
                                                ? 'bg-white shadow-sm ring-1 ring-gray-200' 
                                                : 'hover:bg-gray-100/50'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg shrink-0 transition-colors ${activeTab === tab.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 group-hover:text-black'}`}>
                                            <tab.icon size={18} />
                                        </div>
                                        <div className="text-left">
                                            <span className={`block text-sm font-bold ${activeTab === tab.id ? 'text-black' : 'text-gray-600 group-hover:text-black'}`}>{tab.label}</span>
                                            <span className="block text-xs text-gray-400 mt-0.5">{tab.description}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </nav>

                    {/* RIGHT: Content Area */}
                    <div className="flex-1 min-w-0">
                        
                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* Avatar Card */}
                                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                        <div className="relative group w-24 h-24 shrink-0">
                                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-50 shadow-inner bg-gray-100 flex items-center justify-center">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-3xl font-bold text-gray-300">{firstName.charAt(0)}{lastName.charAt(0)}</span>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full shadow-lg border-2 border-white hover:scale-105 transition-transform"
                                                title="Upload new photo"
                                            >
                                                <FiUpload size={14} />
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                            />
                                        </div>
                                        <div className="text-center sm:text-left space-y-1">
                                            <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                                            <p className="text-sm text-gray-500 max-w-xs">This image will be displayed on your profile and shared resumes.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Personal Info Card */}
                                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="border-b border-gray-100 p-6 md:px-8 md:py-6 bg-gray-50/50">
                                        <h3 className="font-bold text-gray-900">Personal Information</h3>
                                        <p className="text-xs text-gray-500 mt-1">Update your personal details here.</p>
                                    </div>
                                    
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">First Name</label>
                                                <input 
                                                    type="text" 
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all" 
                                                    placeholder="e.g. Jane"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Last Name</label>
                                                <input 
                                                    type="text" 
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all" 
                                                    placeholder="e.g. Doe"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Bio / Headline</label>
                                            <textarea 
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all min-h-28 resize-none" 
                                                placeholder="Tell us a little bit about yourself..."
                                                maxLength={240}
                                            />
                                            <div className="flex justify-end">
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{bio.length} / 240</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 md:px-8 border-t border-gray-100 flex justify-end gap-3">
                                        <button 
                                            onClick={() => window.location.reload()}
                                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black hover:bg-gray-200/50 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* SECURITY / ACCOUNT TAB */}
                        {activeTab === 'account' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="border-b border-gray-100 p-6 md:px-8 md:py-6 bg-gray-50/50">
                                        <h3 className="font-bold text-gray-900">Login Details</h3>
                                    </div>
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">Email Address</label>
                                            <div className="relative">
                                                <FiMail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                                                <input 
                                                    type="email" 
                                                    value={user?.email || ''} 
                                                    disabled 
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed" 
                                                />
                                                <div className="absolute right-3 top-3 text-green-500 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                    <FiCheck size={10} /> Verified
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 ml-1">To change your email, please contact support.</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
                                     <div className="border-b border-red-50 p-6 md:px-8 md:py-6 bg-red-50/30">
                                        <h3 className="font-bold text-red-600">Danger Zone</h3>
                                    </div>
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Delete Account</h4>
                                            <p className="text-xs text-gray-500 mt-1 max-w-sm">Permanently remove your account and all of its contents. This action is not reversible.</p>
                                        </div>
                                        <button 
                                            onClick={() => toast.error("Action disabled in this demo.")}
                                            className="bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 hover:border-red-200 transition-all whitespace-nowrap"
                                        >
                                            Delete Account
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* PLACEHOLDER TABS */}
                        {['notifications', 'billing'].includes(activeTab) && (
                            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center h-80 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400 rotate-3">
                                     {tabs.find(t => t.id === activeTab)?.icon({ size: 28 })}
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-2">Coming Soon</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">This section is currently under active development. Check back later!</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;