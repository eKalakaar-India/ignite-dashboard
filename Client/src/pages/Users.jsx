import { useEffect, useState } from "react";
import { Plus, Users as UsersIcon, Mail, Phone, ShieldCheck, Loader2 } from "lucide-react";
import { useAFCStore } from "../store/afcStore";
import AddUserModal from "../components/AddUserModal";

const ROLE_STYLES = {
  "Super Admin": "bg-rose-50 text-rose-600 border-rose-100",
  "Regional Expert": "bg-indigo-50 text-indigo-600 border-indigo-100",
  "Gender Expert": "bg-indigo-50 text-indigo-600 border-indigo-100",
  "Gender Experts": "bg-indigo-50 text-indigo-600 border-indigo-100",
};

export default function Users() {
  const { users, usersLoading, fetchUsers } = useAFCStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage admins and regional experts across the programme</p>
        </div>
      </header>

      <main className="p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-rose-500">Administration</p>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-slate-900">All Users</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Phone No.</th>
                <th className="px-6 py-3.5">Role</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    <UsersIcon className="mx-auto mb-2 h-6 w-6" />
                    No users found. Add your first user to get started.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id ?? user._id ?? user.email}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {user.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {user.phone_no}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                          ROLE_STYLES[user.role] ?? "border-slate-100 bg-slate-50 text-slate-600"
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {["Gender Expert", "Gender Experts"].includes(user.role) ? "Regional Expert" : user.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}