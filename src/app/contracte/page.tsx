import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { stergeContract } from "@/app/actions/contracte";

const statusColors: Record<string, string> = {
  Activ: "bg-green-100 text-green-700",
  Finalizat: "bg-blue-100 text-blue-700",
  Anulat: "bg-red-100 text-red-700",
  Suspendat: "bg-yellow-100 text-yellow-700",
};

export default async function ContractePage({
  searchParams,
}: {
  searchParams: Promise<{ cautare?: string; status?: string }>;
}) {
  const { cautare, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("contracte")
    .select("*, clienti(nume)")
    .order("creat_la", { ascending: false });

  if (cautare) {
    query = query.or(`numar_contract.ilike.%${cautare}%,descriere.ilike.%${cautare}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  const { data: contracte } = await query;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contracte</h1>
        <Link href="/contracte/adauga" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          + Adaugă contract
        </Link>
      </div>

      <form className="mb-4 flex gap-2 flex-wrap">
        <input type="text" name="cautare" defaultValue={cautare} placeholder="Caută..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select name="status" defaultValue={status}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toate statusurile</option>
          <option value="Activ">Activ</option>
          <option value="Finalizat">Finalizat</option>
          <option value="Anulat">Anulat</option>
          <option value="Suspendat">Suspendat</option>
        </select>
        <button type="submit" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Caută</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr. contract</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valoare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perioadă</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contracte && contracte.length > 0 ? (
              contracte.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{c.numar_contract}</td>
                  <td className="px-6 py-4 text-gray-500">{(c.clienti as unknown as { nume: string })?.nume}</td>
                  <td className="px-6 py-4">{c.valoare ? `${Number(c.valoare).toLocaleString("ro-RO")} RON` : "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.data_inceput || "?"} - {c.data_sfarsit || "?"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] || "bg-gray-100"}`}>{c.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/contracte/${c.id}/editeaza`} className="text-yellow-600 hover:underline text-sm">Editează</Link>
                    <form action={stergeContract.bind(null, c.id)} className="inline">
                      <button type="submit" className="text-red-600 hover:underline text-sm"
                        onClick={(e) => { if (!confirm("Sigur vrei să ștergi?")) e.preventDefault(); }}>
                        Șterge
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Niciun contract găsit.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
