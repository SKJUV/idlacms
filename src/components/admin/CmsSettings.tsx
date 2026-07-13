import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

interface CmsSettingsProps {
  settingsName: string;
  setSettingsName: (name: string) => void;
  settingsEmail: string;
  setSettingsEmail: (email: string) => void;
  settingsSiteName: string;
  setSettingsSiteName: (siteName: string) => void;
  settingsAdmissionsOpen: boolean;
  setSettingsAdmissionsOpen: (open: boolean) => void;
  settingsEmailNotif: boolean;
  setSettingsEmailNotif: (notif: boolean) => void;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function CmsSettings({
  settingsName,
  setSettingsName,
  settingsEmail,
  setSettingsEmail,
  settingsSiteName,
  setSettingsSiteName,
  settingsAdmissionsOpen,
  setSettingsAdmissionsOpen,
  settingsEmailNotif,
  setSettingsEmailNotif,
  logActivity,
}: CmsSettingsProps) {
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    logActivity('article', 'Super Admin', `a mis à jour les paramètres du CMS.`);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h3 className="font-sans font-bold text-lg text-[#00020e]">Paramètres</h3>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider">
            Profil administrateur
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Nom complet</label>
              <input
                type="text"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
              <input
                type="email"
                value={settingsEmail}
                onChange={(e) => setSettingsEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-[#00020e] uppercase tracking-wider font-semibold">
            Préférences du CMS
          </h4>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nom du site</label>
            <input
              type="text"
              value={settingsSiteName}
              onChange={(e) => setSettingsSiteName(e.target.value)}
              className="w-full md:w-1/2 p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-sm"
            />
          </div>
          <label className="flex items-center justify-between py-2 border-t border-[#c6c6cf]/30 cursor-pointer">
            <span className="text-sm font-medium text-[#0b1c30]">Admissions ouvertes</span>
            <input
              type="checkbox"
              checked={settingsAdmissionsOpen}
              onChange={(e) => setSettingsAdmissionsOpen(e.target.checked)}
              className="w-4 h-4 text-[#006c49] border-[#c6c6cf] rounded focus:ring-[#006c49]"
            />
          </label>
          <label className="flex items-center justify-between py-2 border-t border-[#c6c6cf]/30 cursor-pointer">
            <span className="text-sm font-medium text-[#0b1c30]">Notifications par email</span>
            <input
              type="checkbox"
              checked={settingsEmailNotif}
              onChange={(e) => setSettingsEmailNotif(e.target.checked)}
              className="w-4 h-4 text-[#006c49] border-[#c6c6cf] rounded focus:ring-[#006c49]"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          {settingsSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Enregistré
            </span>
          )}
          <button
            type="submit"
            className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Enregistrer les paramètres
          </button>
        </div>
      </form>
    </div>
  );
}
