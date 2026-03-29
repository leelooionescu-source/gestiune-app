import { createClient } from "@/lib/supabase/server";
import { adaugaUtilizator, stergeUtilizator } from "@/app/actions/utilizatori";

export default async function UtilizatoriPage() {
  const supabase = await createClient();
  const { data: utilizatori } = await supabase
    .from("utilizatori")
    .select("*")
    .order("nume");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Utilizatori</h1>

      {/* Add user form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Adaugă utilizator</h2>
        <form action={adaugaUtilizator} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" name="email" required placeholder="email@exemplu.ro"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parolă *</label>
            <input type="password" name="password" required minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
            <input type="text" name="nume" required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" name="is_admin" id="is_admin" className="rounded" />
            <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">Admin</label>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Adaugă
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {utilizatori && utilizatori.length > 0 ? (
              utilizatori.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{u.nume}</td>
                  <td className="px-6 py-4 text-gray-500">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.is_admin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                      {u.is_admin ? "Admin" : "Utilizator"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={stergeUtilizator.bind(null, u.id, u.auth_user_id)} className="inline">
                      <button type="submit" className="text-red-600 hover:underline text-sm"
                        onClick={(e) => { if (!confirm("Sigur vrei să ștergi acest utilizator?")) e.preventDefault(); }}>
                        Șterge
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Niciun utilizator.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
