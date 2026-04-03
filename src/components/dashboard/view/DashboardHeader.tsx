import React, { useEffect, useRef } from 'react';
import { FiBell, FiSearch } from 'react-icons/fi';
import type { DashboardHeaderProps } from '../../../types/dashboard';

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dateLabel,
  searchQuery,
  onSearchQueryChange,
  onNotificationsClick,
  onNotificationsDismiss,
  onSettingsClick,
  unreadNotificationsCount,
  notificationsPanel,
  username,
}) => {
  const notificationsContainerRef = useRef<HTMLDivElement>(null);
  const isNotificationsOpen = Boolean(notificationsPanel);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationsContainerRef.current?.contains(event.target as Node)) {
        onNotificationsDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onNotificationsDismiss();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen, onNotificationsDismiss]);

  return (
    <header className="h-24 px-4 md:px-8 lg:px-12 flex items-center justify-between sticky top-0 z-40 bg-[#FDFDFD]/80 backdrop-blur-md border-b border-gray-100/70">
      <div className="flex flex-col">
        <h1 className="text-xl font-medium tracking-tight text-black">Overview</h1>
        <span className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
          {dateLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 md:gap-6">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100/50 rounded-lg hover:bg-gray-100 transition-colors w-64 group cursor-text">
          <FiSearch className="text-gray-400 group-hover:text-black transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 text-black"
          />
        </div>
        <div ref={notificationsContainerRef} className="relative">
          <button
            onClick={onNotificationsClick}
            className="relative p-2 text-gray-400 hover:text-black transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <FiBell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
          {notificationsPanel}
        </div>
        <button
          onClick={onSettingsClick}
          className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-4 ring-gray-100 transition-all"
          title="Open settings"
          aria-label="Open settings"
        >
          {username?.charAt(0) || 'U'}
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
