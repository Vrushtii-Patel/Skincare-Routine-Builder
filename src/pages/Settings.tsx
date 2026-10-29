import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Sparkles,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui/Modal';
import { loadReferenceData } from '../lib/loadData';
import { SkinType } from '../types';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const profile = useStore((state) => state.profile);
  const updateProfile = useStore((state) => state.updateProfile);
  const resetOnboarding = useStore((state) => state.resetOnboarding);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);
  const clearAllData = useStore((state) => state.clearAllData);
  const loadSampleData = useStore((state) => state.loadSampleData);
  const { user, loading, error, loginWithGoogle, logout } = useAuth();

  const [skinType, setSkinType] = useState<SkinType>(profile.skinType);
  const [sensitive, setSensitive] = useState<boolean>(profile.sensitive);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const refData = loadReferenceData();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      skinType,
      sensitive,
    });
  };

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skincare-routine-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importData(content);
      setImportStatus(res);
    };
    reader.readAsText(file);
  };

  const handleRetakeQuiz = () => {
    resetOnboarding();
    navigate('/quiz');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-cream-200">
        <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold flex items-center gap-1.5">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Preferences & Data Management</span>
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-cocoa-900 mt-1">
          Settings & Profile
        </h1>
      </div>

      {/* Account (temporary, for testing sync) */}
      <div className="card-editorial p-6 space-y-3">
        <h3 className="font-editorial text-xl font-semibold text-cocoa-900">Account</h3>
        {user ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-cocoa-700">Signed in as {user.email}</p>
            <button type="button" onClick={logout} disabled={loading} className="btn-outline text-xs">
              Sign out
            </button>
          </div>
        ) : (
          <button type="button" onClick={loginWithGoogle} disabled={loading} className="btn-outline text-xs">
            Continue with Google
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Profile Preferences */}
      <div className="card-editorial p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-cream-100">
          <div>
            <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
              Skin Profile Settings
            </h3>
            <p className="text-xs text-cocoa-500">
              Update your base skin type and sensitivity preference.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetakeQuiz}
            className="btn-outline text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake Assessment Quiz</span>
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cocoa-700 mb-1">
                Skin Type
              </label>
              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value as SkinType)}
                className="w-full px-4 py-2.5 rounded-2xl border border-cream-200 bg-white text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="normal">Normal / Balanced</option>
                <option value="dry">Dry</option>
                <option value="oily">Oily</option>
                <option value="combination">Combination</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensitive}
                  onChange={(e) => setSensitive(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 border-cream-300"
                />
                <span className="text-xs font-medium text-cocoa-800">
                  Sensitive mode (applies gentle lower active frequencies)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary text-xs">
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Migration */}
      <div className="card-editorial p-6 sm:p-7 space-y-5">
        <div>
          <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
            Data Portability & Storage
          </h3>
          <p className="text-xs text-cocoa-500">
            Your data is stored securely in your browser's local storage. Export to backup or transfer between devices.
          </p>
        </div>

        {importStatus && (
          <div
            className={`p-3.5 rounded-2xl text-xs border ${importStatus.success
                ? 'bg-sage-50 text-sage-900 border-sage-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
          >
            {importStatus.message}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="btn-outline text-xs"
          >
            <Download className="w-4 h-4 text-cocoa-600" />
            <span>Export Data (JSON)</span>
          </button>

          <label className="btn-outline text-xs cursor-pointer">
            <Upload className="w-4 h-4 text-cocoa-600" />
            <span>Import Data (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={loadSampleData}
            className="btn-ghost text-xs text-cocoa-600"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Reset with Sample Shelf</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card-editorial p-6 sm:p-7 space-y-4 border-rose-200/80 bg-rose-50/20">
        <div>
          <h3 className="font-editorial text-xl font-semibold text-rose-900">
            Reset All Application Data
          </h3>
          <p className="text-xs text-cocoa-500 mt-1">
            Permanently clear all products, routines, check-in history, and custom settings from this device.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          className="btn-outline text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Clear All Data</span>
        </button>
      </div>

      {/* Authoritative Sources & About */}
      <div className="card-editorial p-6 sm:p-7 space-y-4">
        <div>
          <h3 className="font-editorial text-xl font-semibold text-cocoa-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sage-600" />
            <span>Clinical References & Evidence Sources</span>
          </h3>
          <p className="text-xs text-cocoa-500 mt-1">
            This educational tool adheres to published guidance from professional dermatological bodies:
          </p>
        </div>

        <div className="space-y-2">
          {refData.sources.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-cream-50/70 border border-cream-200 hover:bg-cream-100 transition-colors text-xs"
            >
              <div>
                <span className="font-semibold text-cocoa-900 block">{s.title}</span>
                <span className="text-[11px] text-cocoa-500">{s.organization} ({s.tier})</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-cocoa-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Data Reset"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-cocoa-600 leading-relaxed">
            This action will erase all saved products, custom schedules, and check-in history. You will be redirected to the welcome onboarding flow.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                clearAllData();
                setIsClearModalOpen(false);
                navigate('/welcome');
              }}
              className="btn-primary text-xs bg-rose-600 hover:bg-rose-700"
            >
              Yes, Reset Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};