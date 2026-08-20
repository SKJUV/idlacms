import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertTriangle, Send, RefreshCw, Zap, ShieldCheck, Clock, FileText, ChevronRight, X, Play, Pause } from 'lucide-react';
import { EMAIL_TEMPLATES, EmailTemplateKey, BASE_URL } from '../../lib/emailTemplates';
import {
  analyzeStudentAccount,
  StudentAccountAnalysis,
  sendTemplateEmail,
  isAutoPilotActive,
  setAutoPilotActive,
  runAutoPilotCheck,
  getEmailRemindersLog,
  EmailLogEntry
} from '../../lib/emailReminderEngine';

interface EmailAutomationSectionProps {
  candidates: any[];
  onRefreshData?: () => void;
}

export default function EmailAutomationSection({
  candidates,
  onRefreshData
}: EmailAutomationSectionProps) {
  const [autoPilot, setAutoPilot] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<StudentAccountAnalysis | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<EmailTemplateKey>('no_application_reminder');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'candidates' | 'logs'>('candidates');
  const [categoryFilter, setCategoryFilter] = useState<'registered_no_course' | 'candidates_with_course' | 'accepted' | 'all'>('registered_no_course');

  useEffect(() => {
    setAutoPilot(isAutoPilotActive());
    setLogs(getEmailRemindersLog());
  }, []);

  const analyzedList: StudentAccountAnalysis[] = candidates.map(c => analyzeStudentAccount(c));

  const noCourseCount = analyzedList.filter(a => a.status === 'RegisteredOnly' || !a.hasApplied).length;
  const withCourseCount = analyzedList.filter(a => a.hasApplied && a.status !== 'Accepted').length;
  const acceptedCount = analyzedList.filter(a => a.status === 'Accepted').length;

  const filteredList = analyzedList.filter(a => {
    if (categoryFilter === 'registered_no_course') return a.status === 'RegisteredOnly' || !a.hasApplied;
    if (categoryFilter === 'candidates_with_course') return a.hasApplied && a.status !== 'Accepted';
    if (categoryFilter === 'accepted') return a.status === 'Accepted';
    return true;
  });

  const handleToggleAutoPilot = async () => {
    const nextState = !autoPilot;
    setAutoPilot(nextState);
    setAutoPilotActive(nextState);

    if (nextState) {
      setNotification({
        type: 'success',
        text: 'Mode Automatique (Auto-Pilot) Activé ! Les relances suggérées seront envoyées automatiquement en arrière-plan.'
      });
      const res = await runAutoPilotCheck(candidates);
      setLogs(getEmailRemindersLog());
      if (res.sentCount > 0) {
        setNotification({
          type: 'success',
          text: `Auto-Pilot actif : ${res.sentCount} e-mail(s) de relance envoyé(s) automatiquement.`
        });
      }
    } else {
      setNotification({
        type: 'error',
        text: 'Mode Automatique désactivé. Les relances sont repassées en mode manuel.'
      });
    }
  };

  const handleOpenPreview = (analysis: StudentAccountAnalysis) => {
    setSelectedCandidate(analysis);
    setSelectedTemplateKey(analysis.suggestedTemplateKey);
  };

  const handleSendSingleEmail = async (analysis: StudentAccountAnalysis) => {
    setSendingId(analysis.id);
    setIsSending(true);
    setNotification(null);

    const spec = EMAIL_TEMPLATES[selectedTemplateKey || analysis.suggestedTemplateKey];

    const result = await sendTemplateEmail(analysis.email, spec.key, {
      studentName: analysis.name,
      studentEmail: analysis.email,
      programTitle: analysis.program,
      entryLevel: analysis.entryLevel,
      matricule: analysis.matricule,
      missingDocs: analysis.missingDocs
    });

    setIsSending(false);
    setSendingId(null);

    if (result.success) {
      setNotification({ type: 'success', text: result.message });
      setLogs(getEmailRemindersLog());
      setSelectedCandidate(null);
    } else {
      setNotification({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-[#00020e] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            <h2 className="font-bold text-xl tracking-wide uppercase">Relances & Notifications Automatiques IDLA</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Expéditeur officiel : <span className="text-emerald-400 font-mono font-semibold">admissions@idlaacademy.online</span> — E-mails institutionnels 100% professionnels
          </p>
        </div>

        {/* Toggle Auto-Pilot Mode Switch */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-700/80 p-3 rounded-xl">
          <div className="text-right">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
              <Zap className={`w-4 h-4 ${autoPilot ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              Mode Auto-Pilot
            </p>
            <p className="text-[10px] text-slate-400">
              {autoPilot ? 'Envois automatiques d\'arrière-plan ACTIFS' : 'Relances manuelles uniquement'}
            </p>
          </div>
          <button
            onClick={handleToggleAutoPilot}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer focus:outline-none ${
              autoPilot ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${autoPilot ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Status Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border shadow-sm ${
          notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }`}>
          <span className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
            {notification.text}
          </span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 pt-4 gap-6">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'candidates' ? 'border-[#006c49] text-[#006c49] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Analyse des Comptes & Suggestions ({analyzedList.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'border-[#006c49] text-[#006c49] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Historique d'Envoi ({logs.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">
          {activeTab === 'candidates' && (
            <div className="space-y-4">
              {/* Category Filter Bar */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-xl gap-2 flex-wrap text-xs font-bold">
                <button
                  onClick={() => setCategoryFilter('registered_no_course')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                    categoryFilter === 'registered_no_course'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Inscrits sans cours uniquement ({noCourseCount})
                </button>

                <button
                  onClick={() => setCategoryFilter('candidates_with_course')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                    categoryFilter === 'candidates_with_course'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Candidats avec candidatures ({withCourseCount})
                </button>

                <button
                  onClick={() => setCategoryFilter('accepted')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                    categoryFilter === 'accepted'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Étudiants admis ({acceptedCount})
                </button>

                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Tous les comptes ({analyzedList.length})
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-1">
                <span>Comptes filtrés : {filteredList.length} utilisateur(s)</span>
                {autoPilot && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Protection Anti-Spam (Min 24h d'intervalle)
                  </span>
                )}
              </div>

              {filteredList.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Aucun compte ne correspond à ce filtre pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredList.map((analysis, index) => {
                    const currentSpec = EMAIL_TEMPLATES[analysis.suggestedTemplateKey];
                    const isRowSending = sendingId === analysis.id;
                    const rowKey = analysis.id ? `cand-row-${analysis.id}` : `analysis-${analysis.email || index}`;

                    return (
                      <div
                        key={rowKey}
                        className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{analysis.name}</h4>
                            <span className="text-xs text-slate-500 font-mono">&lt;{analysis.email}&gt;</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              analysis.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' :
                              analysis.status === 'RegisteredOnly' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' :
                              'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800'
                            }`}>
                              {analysis.status === 'RegisteredOnly' ? 'Compte sans formation' :
                               analysis.status === 'Accepted' ? 'Étudiant Admis' : 'Candidat'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            Suggestion du Moteur : <span className="font-bold text-slate-900 dark:text-white">{currentSpec.label}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{analysis.suggestedReason}</p>

                          {analysis.lastReminderSentAt && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Dernière relance : {new Date(analysis.lastReminderSentAt).toLocaleString('fr-FR')} ({analysis.reminderCount} relance(s))
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                          <button
                            onClick={() => handleOpenPreview(analysis)}
                            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            Prévisualiser / Choisir
                          </button>
                          <button
                            onClick={() => handleSendSingleEmail(analysis)}
                            disabled={isRowSending}
                            className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {isRowSending ? 'Envoi...' : 'Envoyer le Mail'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Historique récent des envois d'e-mails :</h4>
              {logs.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Aucun envoi d'e-mail enregistré pour le moment.
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{log.email}</span>
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            {log.templateLabel}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">{log.subject}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.sentAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Preview & Customization overlay */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                Prévisualisation du mail pour {selectedCandidate.name}
              </h4>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Sélectionner un modèle alternatif (13 modèles disponibles) :</label>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value as EmailTemplateKey)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#006c49]"
                >
                  {Object.values(EMAIL_TEMPLATES).map((spec) => (
                    <option key={spec.key} value={spec.key}>
                      {spec.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Objet du mail :</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {EMAIL_TEMPLATES[selectedTemplateKey].subject({
                      studentName: selectedCandidate.name,
                      programTitle: selectedCandidate.program,
                      matricule: selectedCandidate.matricule
                    })}
                  </p>
                </div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Corps du message (Expéditeur: admissions@idlaacademy.online) :</span>
                  <pre className="mt-1 font-sans text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto">
                    {EMAIL_TEMPLATES[selectedTemplateKey].body({
                      studentName: selectedCandidate.name,
                      studentEmail: selectedCandidate.email,
                      programTitle: selectedCandidate.program,
                      entryLevel: selectedCandidate.entryLevel,
                      matricule: selectedCandidate.matricule,
                      missingDocs: selectedCandidate.missingDocs
                    })}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleSendSingleEmail(selectedCandidate)}
                disabled={isSending}
                className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Envoi...' : 'Confirmer et Envoyer le mail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
