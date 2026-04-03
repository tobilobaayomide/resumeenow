import React from 'react';
import { 
  FiLogOut, 
  FiLock,
  FiShield,
  FiStar,
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { usePlan } from '../../context/usePlan';
import { useCurrentUserRole } from '../../hooks/useCurrentUserRole';
import {
    DASHBOARD_MAIN_MENU_ITEMS,
    DASHBOARD_MOBILE_DOCK_ITEMS,
    DASHBOARD_PREFERENCES_ITEMS,
} from '../../data/dashboard';
import type { DashboardNavItem } from '../../types/dashboard';

const Sidebar: React.FC = () => {
    const { user, signOut } = useAuth();
    const { isPro, planStatus, tier, hasUnlimitedAccess } = usePlan();
    const { isAdmin, isSuperAdmin } = useCurrentUserRole();
    const navigate = useNavigate();
    const location = useLocation();
    const showFreeTierPlanUi = planStatus === 'ready' && !isPro;
    const tierLabel =
        planStatus === 'loading'
            ? 'syncing'
            : planStatus === 'unavailable'
                ? 'unavailable'
                : isAdmin
                    ? isSuperAdmin
                        ? 'super admin'
                        : 'admin'
                    : hasUnlimitedAccess
                        ? 'unlimited'
                        : tier;
    const tierClassName =
        planStatus === 'unavailable'
            ? 'bg-red-500/10 text-red-300 border border-red-500/20'
            : isPro
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700';

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    // --- Desktop Nav Item ---
    const DesktopNavItem = ({ item }: { item: DashboardNavItem }) => {
        const active = isActive(item.path);
        return (
            <button
                onClick={() => navigate(item.path)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all cursor-pointer duration-200 rounded-xl border ${
                    active 
                        ? 'text-white bg-white/6 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-white/3'
                }`}
                aria-label={`Go to ${item.label}`}
            >
                <span>
                    <item.icon size={16} className={active ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'} />
                </span>
                <span>{item.label}</span>
                {item.proPage && showFreeTierPlanUi && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                        <FiLock size={10} />
                        Pro
                    </span>
                )}
            </button>
        );
    };

    // --- Mobile Dock Item ---
    const MobileDockItem = ({ item }: { item: DashboardNavItem }) => {
        const active = isActive(item.path);
        return (
            <button
                onClick={() => navigate(item.path)}
                aria-label={`Go to ${item.label}`}
                title={item.label}
                className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                    active 
                        ? 'bg-neutral-800 text-white shadow-lg shadow-black/30 ring-1 ring-white/10' 
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
            <aside className="hidden md:flex w-80 bg-[#0C0C0C] flex-col h-screen sticky top-0 z-50 font-sans border-r border-[#1a1a1a]">
                
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
                           Resumee<span className="text-zinc-600">Now.</span>
                        </span>
                    </div>
                </div>

                {/* 2. Navigation */}
                <nav className="flex-1 px-5 py-6 space-y-8">
                    
                    {/* Main Group */}
                    <div className="space-y-1">
                        <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">Workspace</p>
                        {DASHBOARD_MAIN_MENU_ITEMS.map((item) => (
                            <DesktopNavItem key={item.label} item={item} />
                        ))}
                    </div>

                    {/* Preferences Group */}
                    <div className="space-y-1">
                        <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4">You</p>
                        {DASHBOARD_PREFERENCES_ITEMS.map((item) => (
                            <DesktopNavItem key={item.label} item={item} />
                        ))}
                    </div>
                </nav>

                {/* 3. User Aesthetic Footer */}
                <div className="p-5">
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="mb-3 flex w-full items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-3 text-left text-sm font-medium text-zinc-300 transition-all hover:border-[#3a3a3a] hover:text-white"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white">
                                <FiShield size={16} />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate">Admin Console</span>
                                <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                                    Internal controls
                                </span>
                            </span>
                        </button>
                    )}
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
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${tierClassName}`}>
                                        {tierLabel}
                                    </span>
                                    {showFreeTierPlanUi && (
                                        <button
                                            disabled
                                            className="hidden items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 transition-colors cursor-not-allowed opacity-50"
                                        >
                                            <FiStar size={10} />
                                            Coming Soon
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSignOut} 
                            className="text-zinc-600 hover:text-red-400 p-1.5 rounded-md cursor-pointer hover:bg-neutral-900 transition-all"
                            title="Sign out"
                            aria-label="Sign out"
                        >
                            <FiLogOut size={14} />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="md:hidden fixed left-1/2 -translate-x-1/2 z-50 w-auto bottom-[max(1.5rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-2 bg-[#121212]/20 backdrop-blur-2xl border border-white/5 p-2 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                    {DASHBOARD_MOBILE_DOCK_ITEMS.map((item) => (
                        <MobileDockItem key={item.label} item={item} />
                    ))}
                    
                    <div className="w-px h-8 bg-white/10 mx-1 rounded-full"></div>
                    
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/admin')}
                            aria-label="Open admin console"
                            title="Open admin console"
                            className="group flex flex-col items-center justify-center w-12 h-12 rounded-2xl text-zinc-500 hover:text-white hover:bg-neutral-800/50 transition-colors"
                        >
                            <FiShield size={20} />
                        </button>
                    )}
                    <button 
                         onClick={handleSignOut}
                         aria-label="Sign out"
                         title="Sign out"
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
