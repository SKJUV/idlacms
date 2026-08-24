import React, { useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, X } from 'lucide-react';
import { User } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from '../../lib/appwrite';

interface UsersManagementProps {
  usersList: User[];
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>;
  setActiveTab: (tab: any) => void;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function UsersManagement({
  usersList,
  setUsersList,
  setActiveTab,
  logActivity,
}: UsersManagementProps) {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserStatusFilter, setSelectedUserStatusFilter] = useState('Tous');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesStatus = selectedUserStatusFilter === 'Tous' || u.status === selectedUserStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteUser = async (id: string) => {
    const target = usersList.find((u) => u.id === id);
    if (!target) return;
    setUsersList((curr) => curr.filter((u) => u.id !== id));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
      try {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.cmsUsers,
          id
        );
      } catch (err) {
        console.error("Échec de suppression de l'utilisateur sur Appwrite:", err);
      }
    }
    logActivity('registration', 'Super Admin', `a supprimé l'utilisateur CMS : ${target.name}.`);
  };

  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const edited = editingUser;
    setUsersList((curr) => curr.map((u) => (u.id === edited.id ? edited : u)));

    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.cmsUsers) {
      try {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.cmsUsers,
          edited.id,
          {
            name: edited.name,
            email: edited.email,
            role: edited.role,
            status: edited.status,
          }
        );
      } catch (err) {
        console.error("Échec de la mise à jour de l'utilisateur sur Appwrite:", err);
      }
    }
    logActivity('registration', 'Super Admin', `a modifié l'utilisateur CMS : ${edited.name}.`);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-sans font-bold text-lg text-text-primary">Comptes d'accès IDLA CMS</h3>
        <button
          onClick={() => setActiveTab('admin-add-user')}
          className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* User management search bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-bg-secondary p-4 rounded-xl border border-border-primary shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4.5 h-4.5" />
          <input
            className="w-full bg-bg-primary border border-border-primary text-text-primary rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="Rechercher par nom ou email..."
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {['Tous', 'Actif', 'Inactif', 'Bloqué'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedUserStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                selectedUserStatusFilter === st
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-primary hover:bg-border-primary/50 text-text-secondary border border-border-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full min-w-[600px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-bg-primary text-text-secondary border-b border-border-primary/50 font-bold uppercase">
              <th className="p-4 w-20">ID</th>
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Rôle</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Dernière activité</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary/40">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-bg-primary/50 transition-colors">
                <td className="p-4 font-bold text-text-secondary opacity-60">#{u.id}</td>
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-light text-brand-primary font-bold text-xs flex items-center justify-center overflow-hidden border border-border-primary/30">
                    {u.avatar ? (
                      <img className="w-full h-full object-cover" alt={u.name} src={u.avatar} />
                    ) : (
                      u.initials
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">{u.name}</div>
                    <div className="text-[10px] text-text-secondary font-semibold">{u.email}</div>
                  </div>
                </td>
                <td className="p-4 font-semibold text-text-secondary">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      u.role === 'Super Admin'
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                        : 'bg-bg-primary text-text-secondary border border-border-primary'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      u.status === 'Actif'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : u.status === 'Bloqué'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    ● {u.status}
                  </span>
                </td>
                <td className="p-4 text-text-secondary">{u.lastLogin}</td>
                <td className="p-4">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="text-text-secondary hover:text-brand-primary p-1.5 hover:bg-bg-primary rounded transition-all cursor-pointer"
                      title="Modifier l'utilisateur"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {u.id !== '8821' ? (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all cursor-pointer"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[9px] text-text-secondary/60 italic">Système</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALE — Édition d'un utilisateur */}
      {editingUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="bg-bg-secondary border border-border-primary w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary/50 bg-bg-primary">
              <h3 className="font-bold text-base text-text-primary">Modifier l'utilisateur</h3>
              <button onClick={() => setEditingUser(null)} className="text-text-secondary hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Nom complet</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Rôle</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Writer">Writer</option>
                    <option value="Marketer">Marketer</option>
                    <option value="OC">OC</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary uppercase">Statut</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                    className="w-full p-2.5 rounded-lg border border-border-primary bg-bg-primary text-text-primary focus:ring-2 focus:ring-brand-primary outline-none text-xs font-bold"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="Bloqué">Bloqué</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3 border-t border-border-primary/50">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-bg-primary border border-border-primary cursor-pointer"
                >
                  Annuler
                </button>
                <button type="submit" className="bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
