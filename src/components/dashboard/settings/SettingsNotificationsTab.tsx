import React from 'react';
import { FiBell, FiCpu, FiMail, FiZap } from 'react-icons/fi';
import type { SettingsNotificationsTabProps } from '../../../types/dashboard';

interface NotificationRowProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({
  title,
  description,
  icon: Icon,
  checked,
  disabled = false,
  onChange,
}) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5">
    <div className="flex items-start gap-4 min-w-0">
      <div className="shrink-0 rounded-xl bg-gray-100 p-3 text-gray-700">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      </div>
    </div>

    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-black' : 'bg-gray-200'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SettingsNotificationsTab: React.FC<SettingsNotificationsTabProps> = ({
  weeklyDigest,
  aiUsageAlerts,
  proWaitlistUpdates,
  productUpdates,
  loading,
  saving,
  hasUnsavedChanges,
  onWeeklyDigestChange,
  onAiUsageAlertsChange,
  onProWaitlistUpdatesChange,
  onProductUpdatesChange,
  onReset,
  onSave,
}) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/60 p-6 md:px-8 md:py-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-black p-2.5 text-white">
            <FiBell size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Email Notifications</h3>
            <p className="mt-1 text-xs font-light text-gray-500">
              Choose which updates ResumeNow can send to your inbox.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6 md:p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm leading-relaxed text-amber-900">
            Account and security emails are always enabled. These settings only
            control optional product notifications.
          </p>
        </div>

        <NotificationRow
          title="Product updates"
          description="Get release notes, launch announcements, and other product-news emails without waiting for in-app discovery."
          icon={FiMail}
          checked={productUpdates}
          disabled={loading || saving}
          onChange={onProductUpdatesChange}
        />

        <NotificationRow
          title="Weekly digest"
          description="A short weekly recap with progress nudges and reminders to keep your resume current."
          icon={FiBell}
          checked={weeklyDigest}
          disabled={loading || saving}
          onChange={onWeeklyDigestChange}
        />

        <NotificationRow
          title="AI usage alerts"
          description="Get notified when you are getting close to your daily AI limit so you are not caught off guard."
          icon={FiCpu}
          checked={aiUsageAlerts}
          disabled={loading || saving}
          onChange={onAiUsageAlertsChange}
        />

        <NotificationRow
          title="Pro waitlist updates"
          description="Receive confirmation when you join the Pro waitlist and updates when early access or billing opens."
          icon={FiZap}
          checked={proWaitlistUpdates}
          disabled={loading || saving}
          onChange={onProWaitlistUpdatesChange}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 p-4 md:px-8">
        <button
          type="button"
          onClick={onReset}
          disabled={!hasUnsavedChanges || saving}
          className="rounded-lg px-4 py-2 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-200/50 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading || saving || !hasUnsavedChanges}
          className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-black/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </section>
  </div>
);

export default SettingsNotificationsTab;
