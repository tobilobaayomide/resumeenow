import React from 'react';
import { FiCheck, FiMail } from 'react-icons/fi';
import type { SettingsAccountTabProps } from '../../../types/dashboard';

const SettingsAccountTab: React.FC<SettingsAccountTabProps> = ({ email, onDeleteAccount }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-6 md:px-8 md:py-6 bg-gray-50/50">
        <h3 className="font-bold text-gray-900">Login Details</h3>
      </div>
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
            Email Address
          </label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
            <input
              type="email"
              value={email}
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
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Permanently remove your account and all of its contents. This action is not reversible.
          </p>
        </div>
        <button
          onClick={onDeleteAccount}
          className="bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 hover:border-red-200 transition-all whitespace-nowrap"
        >
          Delete Account
        </button>
      </div>
    </section>
  </div>
);

export default SettingsAccountTab;
