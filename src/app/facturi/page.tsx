import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { stergeFactura } from "@/app/actions/facturi";

const statusColors: Record<string, string> = {
  Emisa: "bg-yellow-100 text-yellow-700",
  Incasata: "bg-green-100 text-green-700",
  Anulata: "bg-red-100 text-red-700",
};

export default async function FacturiPage({
  searchParams,
}: {
  searchParams: Promise<{ cautare?: string; status?: string }>;
}) {
  const { cautare, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("facturi")
    .select("*, contracte(numar_contract, clienti(nume))")
    .order("data_emitere", { ascending: false });

  if (cautare) {
    query = query.or(`numar_factura.ilike.%${cautare}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  const { data: facturi } = await query;

  // Total uncolected
  const { data: emise } = await supabase.from("facturi").select("valoare").eq("status", "Emisa");
  const totalNeincasat = emise?.reduce((s, f) => s + (Number(f.valoare) || 0), 0) || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Facturi</h1>
          <p className="text-sm text-gray-500">
            Total neîncasat: <span className="font-bold text-red-600">{totalNeincasat.toLocaleString("ro-RO")} RON</span>
          </p>
        </div>
        <Link href="/facturi/adauga" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          + Adaugă factură
        </Link>
      </div>

      <form className="mb-4 flex gap-2 flex-wrap">
        <input type="text" name="cautare" defaultValue={cautare} placeholder="Caută după nr. factură..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select name="status" defaultValue={status}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toate statusurile</option>
          <option value="Emisa">Emisa</option>
          <option value="Incasata">Incasata</option>
          <option value="Anulata">Anulata</option>
        </select>
        <button type="submit" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Caută</button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr. factură</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract / Client</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valoare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data emitere</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scadentă</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {facturi && facturi.length > 0 ? (
              facturi.map((f) => {
                const contract = f.contracte as unknown as { numar_contract: string; clienti: { nume: string } };
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{f.numar_factura}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {contract?.numar_contract} ({contract?.clienti?.nume})
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{Number(f.valoare).toLocaleString("ro-RO")} RON</td>
                    <td className="px-6 py-4 text-gray-500">{f.data_emitere}</td>
                    <td className="px-6 py-4 text-gray-500">{f.data_scadenta || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[f.status] || "bg-gray-100"}`}>{f.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/facturi/${f.id}/editeaza`} className="text-yellow-600 hover:underline text-sm">Editează</Link>
                      <form action={stergeFactura.bind(null, f.id)} className="inline">
                        <button type="submit" className="text-red-600 hover:underline text-sm"
                          onClick={(e) => { if (!confirm("Sigur vrei să ștergi?")) e.preventDefault(); }}>Șterge</button>
                      </form>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Nicio factură găsită.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
