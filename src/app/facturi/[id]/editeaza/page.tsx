import { createClient } from "@/lib/supabase/server";
import { editeazaFactura } from "@/app/actions/facturi";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditeazaFactura({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: factura }, { data: contracte }] = await Promise.all([
    supabase.from("facturi").select("*").eq("id", id).single(),
    supabase.from("contracte").select("id, numar_contract, clienti(nume)").order("numar_contract"),
  ]);
  if (!factura) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editează factură</h1>
      <form action={editeazaFactura.bind(null, factura.id)} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nr. factură *</label>
          <input type="text" name="numar_factura" required defaultValue={factura.numar_factura} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contract *</label>
          <select name="contract_id" required defaultValue={factura.contract_id} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            {contracte?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.numar_contract} - {(c.clienti as unknown as { nume: string })?.nume}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valoare *</label>
            <input type="number" name="valoare" step="0.01" required defaultValue={factura.valoare} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" defaultValue={factura.status} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Emisa</option><option>Incasata</option><option>Anulata</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data emitere *</label>
            <input type="date" name="data_emitere" required defaultValue={factura.data_emitere} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data scadentă</label>
            <input type="date" name="data_scadenta" defaultValue={factura.data_scadenta || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Salvează</button>
          <Link href="/facturi" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
