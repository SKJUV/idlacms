import React, { useState, useMemo } from 'react';
import { UserPlusIcon as UserPlus, SearchIcon as Search, PencilIcon as Pencil, Trash2Icon as Trash2, XIcon as X } from '../Icons';
import { User } from '../../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured } from '../../lib/appwrite';

interface UsersManagementProps {
  usersList: User[];
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>;
  handleDeleteUser: (id: string) => Promise<void>;
  setActiveTab: (tab: any) => void;
  logActivity: (type: 'registration' | 'article' | 'error' | 'alumni', user: string, text: string) => Promise<void>;
}

export default function UsersManagement({
  usersList,
  setUsersList,
  handleDeleteUser,
  setActiveTab,
  logActivity,
}: UsersManagementProps) {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserStatusFilter, setSelectedUserStatusFilter] = useState<string>('Tous');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
      const matchesStatus =
        selectedUserStatusFilter === 'Tous' || u.status === selectedUserStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [usersList, userSearchQuery, selectedUserStatusFilter]);

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
          { name: edited.name, email: edited.email, role: edited.role, status: edited.status }
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
        <h3 className="font-sans font-bold text-lg text-[#00020e]">Comptes d'accès IDLA CMS</h3>
        <button
          onClick={() => setActiveTab('admin-add-user')}
          className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* User management search bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-[#c6c6cf] shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
          <input
            className="w-full bg-slate-50 border border-[#c6c6cf] rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none"
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
                  : 'bg-bg-primary hover:bg-border-primary/50 text-text-secondary border border-border-primary/40'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-bg-primary text-text-secondary border-b border-border-primary/40 font-bold uppercase">
              <th className="p-4 w-20">ID</th>
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Rôle</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Dernière activité</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary/20">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-bg-primary/40">
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
                <td className="p-4 font-semibold text-slate-600">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      u.role === 'Super Admin'
                        ? 'bg-[#006c49]/10 text-[#006c49]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      u.status === 'Actif'
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : u.status === 'Bloqué'
                        ? 'bg-red-500/10 text-red-700'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    ● {u.status}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{u.lastLogin}</td>
                <td className="p-4">
                  <div className="flex justify-center items-center gap-1">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="text-slate-500 hover:text-[#006c49] p-1.5 hover:bg-slate-100 rounded transition-all"
                      title="Modifier l'utilisateur"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {u.id !== '8821' ? ( // Protège le Super Admin principal de la suppression
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded transition-all"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-300 italic">Système</span>
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c6c6cf]/40 bg-slate-50">
              <h3 className="font-bold text-base text-[#00020e]">Modifier l'utilisateur</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-[#00020e]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nom complet</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Rôle</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Writer">Writer</option>
                    <option value="Marketer">Marketer</option>
                    <option value="OC">OC</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Statut</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as User['status'] })}
                    className="w-full p-2.5 rounded-lg border border-[#c6c6cf] focus:ring-2 focus:ring-[#006c49] outline-none text-xs font-bold text-[#00020e]"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="Bloqué">Bloqué</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-[#c6c6cf]/40"
                >
                  Annuler
                </button>
                <button type="submit" className="bg-[#006c49] hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg">
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
