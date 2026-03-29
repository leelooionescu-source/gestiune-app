import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { stergePredare } from "@/app/actions/predari";

export default async function PredariPage({
  searchParams,
}: {
  searchParams: Promise<{ cautare?: string }>;
}) {
  const { cautare } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("predari")
    .select("*, proiecte(nume, contracte(numar_contract, clienti(nume)))")
    .order("data_predare", { ascending: false });

  if (cautare) {
    query = query.or(`descriere.ilike.%${cautare}%`);
  }
  const { data: predari } = await query;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Predări</h1>
        <Link href="/predari/adauga" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          + Adaugă predare
        </Link>
      </div>

      <form className="mb-4 flex gap-2">
        <input type="text" name="cautare" defaultValue={cautare} placeholder="Caută după descriere..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Caută</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data predare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proiect</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descriere</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {predari && predari.length > 0 ? (
              predari.map((pr) => {
                const proiect = pr.proiecte as unknown as {
                  nume: string;
                  contracte: { numar_contract: string; clienti: { nume: string } };
                };
                return (
                  <tr key={pr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{pr.data_predare}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {proiect?.nume} ({proiect?.contracte?.clienti?.nume})
                    </td>
                    <td className="px-6 py-4 text-gray-500">{pr.descriere}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{pr.document_predare}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/predari/${pr.id}/editeaza`} className="text-yellow-600 hover:underline text-sm">Editează</Link>
                      <form action={stergePredare.bind(null, pr.id)} className="inline">
                        <button type="submit" className="text-red-600 hover:underline text-sm"
                          onClick={(e) => { if (!confirm("Sigur vrei să ștergi?")) e.preventDefault(); }}>Șterge</button>
                      </form>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nicio predare găsită.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
