import React from 'react';
import { 
  FiGrid, 
  FiFileText, 
  FiSettings, 
  FiLogOut, 
  FiLayout,  
  FiBriefcase,
  FiUser
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Grouping for better extensive feeling
    const mainMenuItems = [
        { icon: FiGrid, label: 'Overview', path: '/dashboard' },
        { icon: FiFileText, label: 'My Resumes', path: '/dashboard/myresumes' },
        { icon: FiLayout, label: 'Templates', path: '/dashboard/templates' },
    ];

    const preferencesItems = [
        { icon: FiBriefcase, label: 'Career Profile', path: '/dashboard/profile' },
        { icon: FiSettings, label: 'Settings', path: '/dashboard/settings' },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        return location.pathname.startsWith(path) && path !== '/dashboard';
    };

    // --- Desktop Nav Item ---
    const DesktopNavItem = ({ item }: { item: any }) => {
        const active = isActive(item.path);
        return (
            <button
                onClick={() => navigate(item.path)}
                className={`group w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-300 relative ${
                    active 
                        ? 'text-white' 
                        : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                {/* Active Indicator Line */}
                {active && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                )}

                <span className={`transition-transform duration-300 ${active ? 'translate-x-2' : 'group-hover:translate-x-1'}`}>
                    <item.icon size={16} className={active ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'} />
                </span>
                <span className={`transition-transform duration-300 ${active ? 'translate-x-2' : 'group-hover:translate-x-1'}`}>
                    {item.label}
                </span>
            </button>
        );
    };

    // --- Mobile Dock Item ---
    const MobileDockItem = ({ item }: { item: any }) => {
        const active = isActive(item.path);
        return (
            <button
                onClick={() => navigate(item.path)}
                className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                    active 
                        ? 'bg-neutral-800 text-white shadow-xl shadow-black/20 ' 
                        : 'text-zinc-500 hover:text-white hover:bg-neutral-800/50'
                }`}
            >
                <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
              
            </button>
        );
    };

    return (
        <>
            {/* ================= DESKTOP SIDEBAR ================= */}
            <aside className="hidden md:flex w-[260px] bg-[#0C0C0C] flex-col h-screen sticky top-0 z-50 font-sans border-r border-[#1a1a1a]">
                
                {/* 1. Brand Section - Clean & Minimal */}
                <div className="h-24 flex items-center px-8">
                    <div 
                        className="flex items-center gap-3 cursor-pointer group opacity-90 hover:opacity-100 transition-opacity" 
                        onClick={() => navigate('/')}
                    >
                         <img
                            src="/resumeenowlogo.png"
                            alt="Logo"
                            className="h-6 w-6 object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                        <span className="text-lg font-medium tracking-tight text-white/90">
                           Resume<span className="text-zinc-600">Now.</span>
                        </span>
                    </div>
                </div>

                {/* 2. Navigation */}
                <nav className="flex-1 px-5 py-6 space-y-8">
                    
                    {/* Main Group */}
                    <div className="space-y-1">
                        <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">Workspace</p>
                        {mainMenuItems.map((item) => (
                            <DesktopNavItem key={item.label} item={item} />
                        ))}
                    </div>

                    {/* Preferences Group */}
                    <div className="space-y-1">
                        <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">You</p>
                        {preferencesItems.map((item) => (
                            <DesktopNavItem key={item.label} item={item} />
                        ))}
                    </div>
                </nav>

                {/* 3. User Aesthetic Footer */}
                <div className="p-5">
                    <div className="bg-[#111] rounded-xl p-3 border border-[#222] hover:border-[#333] transition-all group flex items-center justify-between cursor-default">
                        <div className="flex items-center gap-3 overflow-hidden">
                             {/* Initials Avatar */}
                            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 text-xs font-bold border border-zinc-700/50 group-hover:text-white transition-colors shrink-0">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                                    {user?.user_metadata?.full_name || "Creator"}
                                </span>
                                <span className="text-[10px] text-zinc-600 truncate">
                                    {/* Masking email for aesthetics */}
                                    {user?.email?.split('@')[0]}
                                </span>
                            </div>
                        </div>

                        <button 
                            onClick={handleSignOut} 
                            className="text-zinc-600 hover:text-red-400 p-1.5 rounded-md hover:bg-neutral-900 transition-all"
                            title="Sign out"
                        >
                            <FiLogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ================= MOBILE BOTTOM DOCK (Glassmorphism) ================= */}
            <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto">
                <div className="flex items-center gap-2 bg-[#121212]/20 backdrop-blur-2xl border border-white/5 p-2 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                    {[...mainMenuItems, ...preferencesItems].slice(0, 4).map((item) => (
                        <MobileDockItem key={item.label} item={item} />
                    ))}
                    
                    <div className="w-px h-8 bg-white/10 mx-1 rounded-full"></div>
                    
                    <button 
                         onClick={handleSignOut}
                         className="group flex flex-col items-center justify-center w-12 h-12 rounded-2xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <FiLogOut size={20} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;