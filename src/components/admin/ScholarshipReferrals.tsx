import React, { useEffect, useMemo, useState } from 'react';
import { Gift, Users, Search, Eye, ArrowLeft, Mail } from 'lucide-react';
import { CustomFormResponse, ReferralCode } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from '../../lib/appwrite';
import { loadAllReferralCodes } from '../../lib/referral';
import { isCcnaFormResponse, isTrackedReferralFormResponse } from '../../lib/referralPrograms';

const referralFromResponse = (r: CustomFormResponse): string => {
  const raw = r.data?.referralCode || r.data?.sponsorCode || r.data?.ref;
  return raw ? String(raw).trim().toUpperCase() : '';
};

export default function ScholarshipReferrals() {
  const [responses, setResponses] = useState<CustomFormResponse[]>([]);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'referred' | 'direct'>('all');
  const [selected, setSelected] = useState<CustomFormResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let list: CustomFormResponse[] = [];
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.formResponses) {
        try {
          const res = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.formResponses
          );
          list = res.documents.map((d: any) => ({
            id: d.$id,
            formId: d.formId,
            formTitle: d.formTitle,
            respondentName: d.respondentName,
            respondentEmail: d.respondentEmail,
            submittedAt: d.submittedAt,
            data: typeof d.data === 'string' ? JSON.parse(d.data || '{}') : (d.data || {}),
          }));
        } catch {}
      }
      if (list.length === 0) {
        try {
          list = JSON.parse(localStorage.getItem('idla_form_responses') || '[]');
        } catch {
          list = [];
        }
      }
      setResponses(list.filter(r => isTrackedReferralFormResponse(r.formId, r.formTitle)));
      setCodes(await loadAllReferralCodes());
      setLoading(false);
    };
    load();
  }, []);

  const sponsorByCode = useMemo(() => {
    const map = new Map<string, ReferralCode>();
    codes.forEach(c => map.set(c.code.toUpperCase(), c));
    return map;
  }, [codes]);

  const filtered = useMemo(() => {
    return responses.filter(r => {
      const code = referralFromResponse(r);
      if (filter === 'referred' && !code) return false;
      if (filter === 'direct' && code) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        (r.respondentName || '').toLowerCase().includes(q) ||
        (r.respondentEmail || '').toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) ||
        (sponsorByCode.get(code)?.sponsorName || '').toLowerCase().includes(q)
      );
    });
  }, [responses, filter, query, sponsorByCode]);

  const referredCount = responses.filter(r => referralFromResponse(r)).length;

  if (selected) {
    const code = referralFromResponse(selected);
    const sponsor = code ? sponsorByCode.get(code) : undefined;
    const entries = Object.entries(selected.data || {}).filter(([k]) => k !== 'referralCode' && k !== 'sponsorCode');
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-text-primary border border-[#c6c6cf]/60 hover:bg-bg-primary px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>
        <div className="bg-white border border-[#c6c6cf] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#c6c6cf]/40">
            <div>
              <h3 className="font-bold text-xl text-[#00020e]">{selected.respondentName || 'Candidat bourse'}</h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Mail className="w-3 h-3" />{selected.respondentEmail}
              </p>
            </div>
            {code ? (
              <span className="bg-[#006c49]/10 text-[#006c49] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#006c49]/20">
                {code}
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-full">Sans parrain</span>
            )}
          </div>
          {sponsor && (
            <p className="text-sm text-slate-600">
              Parrain : <strong>{sponsor.sponsorName}</strong> ({sponsor.sponsorEmail})
            </p>
          )}
          <p className="text-xs text-slate-400">Soumis le {selected.submittedAt}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map(([key, value]) => (
              <div key={key}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{key}</p>
                <p className="text-sm font-semibold text-[#00020e] mt-0.5 break-words">
                  {Array.isArray(value) ? value.join(', ') : String(value ?? '—')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm">
          <h2 className="font-sans font-bold text-xl text-[#00020e] flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#006c49]" />
          Candidatures Bourse, CCNA & Parrainage
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Dossiers remplis via les questionnaires de qualification MScFE et CCNA. Le code parrain est collé ici, pas sur l’inscription programme.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Dossiers bourse</p>
          <p className="text-3xl font-extrabold text-[#00020e] mt-1">{responses.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Via un parrain</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{referredCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cf] shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-400">Entrée directe</p>
          <p className="text-3xl font-extrabold text-slate-700 mt-1">{responses.length - referredCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, email ou code parrain…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#c6c6cf] text-xs outline-none focus:ring-2 focus:ring-[#006c49]"
          />
        </div>
        <div className="flex gap-2">
          {([
            ['all', 'Tous'],
            ['referred', 'Avec parrain'],
            ['direct', 'Sans parrain'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                filter === id ? 'bg-[#006c49] text-white' : 'bg-white border border-[#c6c6cf] text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 border-b border-[#c6c6cf]/30 font-bold uppercase text-[10px]">
              <th className="p-3.5">Candidat</th>
              <th className="p-3.5">Campagne</th>
              <th className="p-3.5">Code parrain</th>
              <th className="p-3.5">Parrain</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5 text-center">Dossier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c6c6cf]/20">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Aucun dossier bourse pour ce filtre.
                </td>
              </tr>
            ) : (
              filtered.map(r => {
                const code = referralFromResponse(r);
                const sponsor = code ? sponsorByCode.get(code) : undefined;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <p className="font-bold text-[#00020e]">{r.respondentName || '—'}</p>
                      <p className="text-[10px] text-slate-400">{r.respondentEmail}</p>
                    </td>
                    <td className="p-3.5 text-slate-600">{isCcnaFormResponse(r.formId, r.formTitle) ? 'CCNA' : 'Bourse MScFE'}</td>
                    <td className="p-3.5 font-mono font-bold text-[#006c49]">{code || '—'}</td>
                    <td className="p-3.5 text-slate-600">{sponsor?.sponsorName || '—'}</td>
                    <td className="p-3.5 text-slate-500">{r.submittedAt}</td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
