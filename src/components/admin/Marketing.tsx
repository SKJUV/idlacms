import React, { useState } from 'react';
import { Plus, Megaphone, Pencil, Trash2 } from 'lucide-react';
import { Campaign } from '../../types';

interface MarketingProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function Marketing({
  campaigns,
  setCampaigns,
  logActivity,
}: MarketingProps) {
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Form states
  const [campaignName, setCampaignName] = useState('');
  const [campaignChannel, setCampaignChannel] = useState('Email + Réseaux');
  const [campaignReach, setCampaignReach] = useState('');

  const resetCampaignForm = () => {
    setCampaignName('');
    setCampaignChannel('Email + Réseaux');
    setCampaignReach('');
    setEditingCampaignId(null);
    setShowAddCampaignForm(false);
  };

  const startEditCampaign = (c: Campaign) => {
    setEditingCampaignId(c.id);
    setCampaignName(c.name);
    setCampaignChannel(c.channel);
    setCampaignReach(String(c.reach));
    setShowAddCampaignForm(true);
  };

  const handleSubmitCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) return;
    const reach = Number(campaignReach) || 0;
    if (editingCampaignId) {
      setCampaigns((curr) =>
        curr.map((c) =>
          c.id === editingCampaignId
            ? { ...c, name: campaignName, channel: campaignChannel, reach }
            : c
        )
      );
      logActivity('article', 'Super Admin', `a modifié la campagne : ${campaignName}.`);
    } else {
      const newCampaign: Campaign = {
        id: `camp-${Math.floor(1000 + Math.random() * 9000)}`,
        name: campaignName,
        channel: campaignChannel,
        status: 'Active',
        reach,
      };
      setCampaigns((curr) => [newCampaign, ...curr]);
      logActivity('article', 'Super Admin', `a créé la campagne : ${campaignName}.`);
    }
    resetCampaignForm();
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((curr) => curr.filter((c) => c.id !== id));
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((curr) =>
      curr.map((c) =>
        c.id === id ? { ...c, status: c.status === 'Active' ? 'En pause' : 'Active' } : c
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-sans font-bold text-lg text-[#00020e]">Campagnes marketing</h3>
        <button
          onClick={() => (showAddCampaignForm ? resetCampaignForm() : setShowAddCampaignForm(true))}
          className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          {showAddCampaignForm ? 'Fermer le formulaire' : 'Nouvelle campagne'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Campagnes actives</p>
          <span className="text-3xl font-extrabold text-[#00020e]">
            {campaigns.filter((c) => c.status === 'Active').length}
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portée cumulée</p>
          <span className="text-3xl font-extrabold text-[#00020e]">
            {campaigns.reduce((s, c) => s + c.reach, 0).toLocaleString('fr-FR')}
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taux d'engagement</p>
          <span className="text-3xl font-extrabold text-[#00020e]">6.4%</span>
        </div>
      </div>

      {showAddCampaignForm && (
        <form
          onSubmit={handleSubmitCampaign}
          className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <p className="text-sm font-bold text-[#00020e]">
            {editingCampaignId ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nom *</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="ex: Campagne Bourses 2026"
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Canal</label>
              <input
                type="text"
                value={campaignChannel}
                onChange={(e) => setCampaignChannel(e.target.value)}
                placeholder="ex: Email + Réseaux"
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Portée estimée</label>
              <input
                type="number"
                min="0"
                value={campaignReach}
                onChange={(e) => setCampaignReach(e.target.value)}
                placeholder="ex: 5000"
                className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
            <button
              type="button"
              onClick={resetCampaignForm}
              className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all"
            >
              {editingCampaignId ? 'Mettre à jour' : 'Créer la campagne'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase">
              <th className="p-4">Campagne</th>
              <th className="p-4">Canal</th>
              <th className="p-4">Portée</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c6c6cf]/20">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/40">
                <td className="p-4 font-semibold text-[#00020e]">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-3.5 h-3.5 text-[#006c49] shrink-0" /> {c.name}
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-600">{c.channel}</td>
                <td className="p-4 text-slate-500">{c.reach.toLocaleString('fr-FR')}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleCampaignStatus(c.id)}
                    title="Changer le statut"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                      c.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
                    }`}
                  >
                    ● {c.status}
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => startEditCampaign(c)}
                      title="Modifier"
                      className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      title="Supprimer"
                      className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                  Aucune campagne. Créez-en une.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
