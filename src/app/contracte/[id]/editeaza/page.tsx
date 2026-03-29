import { createClient } from "@/lib/supabase/server";
import { editeazaContract } from "@/app/actions/contracte";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditeazaContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: contract }, { data: clienti }] = await Promise.all([
    supabase.from("contracte").select("*").eq("id", id).single(),
    supabase.from("clienti").select("id, nume").order("nume"),
  ]);
  if (!contract) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editează contract</h1>
      <form action={editeazaContract.bind(null, contract.id)} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nr. contract *</label>
          <input type="text" name="numar_contract" required defaultValue={contract.numar_contract} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
          <select name="client_id" required defaultValue={contract.client_id} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            {clienti?.map((c) => <option key={c.id} value={c.id}>{c.nume}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
          <textarea name="descriere" rows={2} defaultValue={contract.descriere || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valoare</label>
            <input type="number" name="valoare" step="0.01" defaultValue={contract.valoare || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" defaultValue={contract.status} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Activ</option><option>Finalizat</option><option>Anulat</option><option>Suspendat</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data început</label>
            <input type="date" name="data_inceput" defaultValue={contract.data_inceput || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data sfârșit</label>
            <input type="date" name="data_sfarsit" defaultValue={contract.data_sfarsit || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Salvează</button>
          <Link href="/contracte" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
