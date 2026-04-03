import React from 'react';
import { FiBell } from 'react-icons/fi';
import type { DashboardNotificationsPanelProps } from '../../../types/dashboard';

const DashboardNotificationsPanel: React.FC<DashboardNotificationsPanelProps> = ({
  items,
  loading,
}) => (
  <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.14)]">
    <div className="border-b border-gray-100 px-5 py-4">
      <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
      <p className="mt-1 text-xs text-gray-500">
        Recent account and product updates from ResumeeNow.
      </p>
    </div>

    <div className="max-h-104 overflow-y-auto">
      {loading ? (
        <div className="space-y-3 px-5 py-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`notification-loading-${index + 1}`}
              className="animate-pulse rounded-2xl border border-gray-100 p-4"
            >
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="mt-3 h-3 w-full rounded bg-gray-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80"
            >
              <div className="pt-1">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    item.isUnread ? 'bg-black' : 'bg-gray-200'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {item.timeLabel}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="rounded-2xl bg-gray-100 p-3 text-gray-400">
            <FiBell size={18} />
          </div>
          <h4 className="mt-4 text-sm font-bold text-gray-900">
            No notifications yet
          </h4>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
            New updates like welcome emails, waitlist confirmations, and future
            reminders will appear here.
          </p>
        </div>
      )}
    </div>
  </div>
);

export default DashboardNotificationsPanel;
