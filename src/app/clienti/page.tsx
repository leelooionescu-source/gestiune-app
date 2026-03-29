import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { stergeClient } from "@/app/actions/clienti";

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ cautare?: string }>;
}) {
  const { cautare } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clienti").select("*").order("nume");
  if (cautare) {
    query = query.or(`nume.ilike.%${cautare}%,telefon.ilike.%${cautare}%,email.ilike.%${cautare}%`);
  }
  const { data: clienti } = await query;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clienți</h1>
        <Link
          href="/clienti/adauga"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Adaugă client
        </Link>
      </div>

      <form className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            name="cautare"
            defaultValue={cautare}
            placeholder="Caută după nume, telefon, email..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Caută
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clienti && clienti.length > 0 ? (
              clienti.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link href={`/clienti/${client.id}/detalii`} className="hover:text-blue-600">
                      {client.nume}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{client.telefon}</td>
                  <td className="px-6 py-4 text-gray-500">{client.email}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/clienti/${client.id}/detalii`} className="text-blue-600 hover:underline text-sm">
                      Detalii
                    </Link>
                    <Link href={`/clienti/${client.id}/editeaza`} className="text-yellow-600 hover:underline text-sm">
                      Editează
                    </Link>
                    <form action={stergeClient.bind(null, client.id)} className="inline">
                      <button type="submit" className="text-red-600 hover:underline text-sm"
                        onClick={(e) => { if (!confirm("Sigur vrei să ștergi acest client?")) e.preventDefault(); }}>
                        Șterge
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Niciun client găsit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
