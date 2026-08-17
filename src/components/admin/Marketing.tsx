import React, { useState, useEffect } from 'react';
import { Plus, Megaphone, Pencil, Trash2, Share2, Copy, Check, Users, Gift, Link, Sparkles, Filter } from 'lucide-react';
import { Campaign, ReferralCode } from '../../types';
import { loadAllReferralCodes, persistReferralCode, buildReferralLink } from '../../lib/referral';

interface MarketingProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
  programs?: Array<{ id: string; title: string }>;
}

export default function Marketing({
  campaigns,
  setCampaigns,
  logActivity,
  programs = [],
}: MarketingProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'referrals'>('referrals');

  // ── States Campagnes ──
  const [showAddCampaignForm, setShowAddCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignChannel, setCampaignChannel] = useState('Email + Réseaux');
  const [campaignReach, setCampaignReach] = useState('');

  // ── States Parrainage (Contrôle Admin Exclusif) ──
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [showAddReferralForm, setShowAddReferralForm] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string | null>(null);

  // Form states Parrainage
  const [refCodeStr, setRefCodeStr] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorEmail, setSponsorEmail] = useState('');
  const [targetProgram, setTargetProgram] = useState('Tous les programmes');
  const [discountReward, setDiscountReward] = useState('10% de réduction sur les frais');
  const [maxUsesStr, setMaxUsesStr] = useState('10');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Charger les codes de parrainage
  useEffect(() => {
    loadAllReferralCodes().then(list => {
      setReferralCodes(list);
      setLoadingReferrals(false);
    });
  }, []);

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

  // ── Handlers Parrainage Admin ──
  const resetReferralForm = () => {
    setRefCodeStr('');
    setSponsorName('');
    setSponsorEmail('');
    setTargetProgram('Tous les programmes');
    setDiscountReward('10% de réduction sur les frais');
    setMaxUsesStr('10');
    setEditingReferralId(null);
    setShowAddReferralForm(false);
  };

  const generateAutoCode = () => {
    const cleanName = (sponsorName || 'IDLA').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'IDLA';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setRefCodeStr(`REF-${cleanName}-${rand}`);
  };

  const startEditReferral = (r: ReferralCode) => {
    setEditingReferralId(r.id);
    setRefCodeStr(r.code);
    setSponsorName(r.sponsorName);
    setSponsorEmail(r.sponsorEmail);
    setTargetProgram(r.targetProgram || 'Tous les programmes');
    setDiscountReward(r.discountReward || 'Frais de dossier offerts');
    setMaxUsesStr(r.maxUses ? String(r.maxUses) : '');
    setShowAddReferralForm(true);
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCodeStr || !sponsorEmail) return;

    const saved = await persistReferralCode({
      id: editingReferralId || undefined,
      code: refCodeStr,
      sponsorName: sponsorName || sponsorEmail.split('@')[0],
      sponsorEmail: sponsorEmail.trim(),
      targetProgram,
      discountReward,
      maxUses: maxUsesStr ? Number(maxUsesStr) : undefined,
      currentUses: editingReferralId ? (referralCodes.find(r => r.id === editingReferralId)?.currentUses || 0) : 0,
      status: 'Active',
    });

    setReferralCodes(curr => {
      const idx = curr.findIndex(c => c.id === saved.id || c.code === saved.code);
      if (idx >= 0) {
        const copy = [...curr];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...curr];
    });

    logActivity('registration', 'Super Admin', `a configuré le code de parrainage ${saved.code} pour ${saved.sponsorEmail}.`);
    resetReferralForm();
  };

  const toggleReferralStatus = async (r: ReferralCode) => {
    const nextStatus = r.status === 'Active' ? 'Paused' : 'Active';
    const updated = await persistReferralCode({
      ...r,
      status: nextStatus,
    });

    setReferralCodes(curr => curr.map(c => c.id === updated.id ? updated : c));
  };

  const handleCopyLink = (code: string) => {
    const link = buildReferralLink(code);
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm">
        <div>
          <h2 className="font-sans font-bold text-xl text-[#00020e] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#006c49]" />
            Centre Marketing & Parrainage
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos campagnes de communication et configurez exclusivement les liens de parrainage attribués aux étudiants et ambassadeurs.
          </p>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl shrink-0 w-fit">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'referrals' ? 'bg-[#006c49] text-white shadow-sm' : 'text-slate-600 hover:text-[#00020e]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" /> Codes & Liens de Parrainage
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'campaigns' ? 'bg-[#006c49] text-white shadow-sm' : 'text-slate-600 hover:text-[#00020e]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Campagnes Média
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 1 : PARRAINAGE & RECOMMANDATIONS (CONTRÔLE ADMIN EXCLUSIF) */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-sans font-bold text-base text-[#00020e]">Gestionnaire des Liens & Codes Parrains</h3>
              <p className="text-xs text-slate-500">Seul l'administrateur peut créer, configurer et attribuer les codes de parrainage.</p>
            </div>
            <button
              onClick={() => (showAddReferralForm ? resetReferralForm() : setShowAddReferralForm(true))}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddReferralForm ? 'Fermer le formulaire' : 'Créer un Code Parrain'}
            </button>
          </div>

          {/* Stats Parrainage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">Codes Parrains Actifs</p>
                <Gift className="w-5 h-5 text-[#006c49]" />
              </div>
              <span className="text-3xl font-extrabold text-[#00020e]">
                {referralCodes.filter(r => r.status === 'Active').length}
              </span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">Total Filleuls Recommandés</p>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-extrabold text-[#00020e]">
                {referralCodes.reduce((sum, r) => sum + (r.currentUses || 0), 0)}
              </span>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#c6c6cf] shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">Avantage Filleul Standard</p>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-base font-extrabold text-[#00020e] line-clamp-1">
                Frais offerts / Réduction
              </span>
            </div>
          </div>

          {/* Formulaire Création / Édition Code Parrain Admin */}
          {showAddReferralForm && (
            <form onSubmit={handleSubmitReferral} className="bg-white border border-[#c6c6cf] rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <p className="text-sm font-bold text-[#00020e] flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#006c49]" />
                  {editingReferralId ? 'Modifier le Code de Parrainage' : 'Configuration d\'un Nouveau Code Parrain (Admin)'}
                </p>
                <span className="bg-amber-500/10 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/20">
                  Exclusivité Administration
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Code de Parrainage *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={refCodeStr}
                      onChange={(e) => setRefCodeStr(e.target.value.toUpperCase())}
                      placeholder="ex: REF-PAUL2026"
                      className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-mono font-bold uppercase"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateAutoCode}
                      title="Générer automatiquement"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer shrink-0"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Nom du Parrain Beneficiaire *</label>
                  <input
                    type="text"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="ex: Paul Kengne (Étudiant M1)"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">E-mail du Parrain *</label>
                  <input
                    type="email"
                    value={sponsorEmail}
                    onChange={(e) => setSponsorEmail(e.target.value)}
                    placeholder="ex: paul.kengne@etudiant.idla.com"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Programme Ciblé</label>
                  <select
                    value={targetProgram}
                    onChange={(e) => setTargetProgram(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium bg-white"
                  >
                    <option value="Tous les programmes">Tous les programmes</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.title}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Avantage offert au Filleul (Gratification)</label>
                  <input
                    type="text"
                    value={discountReward}
                    onChange={(e) => setDiscountReward(e.target.value)}
                    placeholder="ex: 10% de réduction sur les frais de scolarité ou Frais de dossier offerts"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Limite d'Utilisations (Max)</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsesStr}
                    onChange={(e) => setMaxUsesStr(e.target.value)}
                    placeholder="ex: 10 (laisser vide si illimité)"
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#c6c6cf]/30">
                <button
                  type="button"
                  onClick={resetReferralForm}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Gift className="w-3.5 h-3.5" />
                  {editingReferralId ? 'Mettre à jour le Code' : 'Enregistrer & Attribuer le Code'}
                </button>
              </div>
            </form>
          )}

          {/* Tableau des Codes Parrains Configurés par l'Admin */}
          <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-[#c6c6cf]/30 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Liste des Codes de Parrainage Officiels ({referralCodes.length})
              </p>
              <span className="text-[11px] text-slate-500 italic">
                Les liens ci-dessous sont ceux visibles par les étudiants dans leur portail.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-500 border-b border-[#c6c6cf]/30 font-bold uppercase text-[10px]">
                    <th className="p-3.5">Code Parrain</th>
                    <th className="p-3.5">Parrain Destinataire</th>
                    <th className="p-3.5">Programme Ciblé</th>
                    <th className="p-3.5">Avantage Filleul</th>
                    <th className="p-3.5 text-center">Utilisations</th>
                    <th className="p-3.5">Statut Admin</th>
                    <th className="p-3.5 text-center">Actions Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cf]/20">
                  {loadingReferrals ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Chargement des codes de parrainage...
                      </td>
                    </tr>
                  ) : referralCodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                        <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Aucun code de parrainage configuré. Cliquez sur "Créer un Code Parrain" ci-dessus pour en créer un.
                      </td>
                    </tr>
                  ) : (
                    referralCodes.map((r) => {
                      const link = buildReferralLink(r.code);
                      const isMaxReached = r.maxUses ? r.currentUses >= r.maxUses : false;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-[#006c49]">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#006c49]/10 text-[#006c49] px-2 py-1 rounded-md border border-[#006c49]/20 text-xs">
                                {r.code}
                              </span>
                              <button
                                onClick={() => handleCopyLink(r.code)}
                                title="Copier le lien de parrainage"
                                className="text-slate-400 hover:text-[#006c49] p-1 rounded transition-colors cursor-pointer"
                              >
                                {copiedCode === r.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-[#00020e]">{r.sponsorName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{r.sponsorEmail}</p>
                          </td>
                          <td className="p-3.5 font-medium text-slate-600">{r.targetProgram || 'Tous'}</td>
                          <td className="p-3.5 font-semibold text-slate-700">
                            <span className="bg-amber-500/10 text-amber-800 text-[11px] px-2 py-0.5 rounded-full border border-amber-500/20">
                              {r.discountReward || 'Frais offerts'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-[#00020e]">
                            <span className={isMaxReached ? 'text-rose-600 font-extrabold' : 'text-emerald-700'}>
                              {r.currentUses} {r.maxUses ? `/ ${r.maxUses}` : ''}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => toggleReferralStatus(r)}
                              title="Activer / Mettre en pause"
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                r.status === 'Active' && !isMaxReached
                                  ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-500/20'
                              }`}
                            >
                              ● {isMaxReached ? 'Limite atteinte' : r.status === 'Active' ? 'Actif' : 'En pause'}
                            </button>
                          </td>
                          <td className="p-3.5">
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                onClick={() => handleCopyLink(r.code)}
                                title="Copier le lien canonique"
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded cursor-pointer transition-colors"
                              >
                                <Link className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startEditReferral(r)}
                                title="Modifier la configuration Admin"
                                className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ONGLET 2 : CAMPAGNES MÉDIA & COMMUNICATION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans font-bold text-base text-[#00020e]">Campagnes média & affichage</h3>
            <button
              onClick={() => (showAddCampaignForm ? resetCampaignForm() : setShowAddCampaignForm(true))}
              className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
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
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg cursor-pointer transition-all"
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
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
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
                          className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c.id)}
                          title="Supprimer"
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all cursor-pointer"
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
      )}
    </div>
  );
}
