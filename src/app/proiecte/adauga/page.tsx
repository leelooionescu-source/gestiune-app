import { createClient } from "@/lib/supabase/server";
import { adaugaProiect } from "@/app/actions/proiecte";
import Link from "next/link";

export default async function AdaugaProiectPage() {
  const supabase = await createClient();
  const { data: contracte } = await supabase
    .from("contracte")
    .select("id, numar_contract, clienti(nume)")
    .order("numar_contract");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Adaugă proiect</h1>
      <form action={adaugaProiect} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
          <input type="text" name="nume" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contract *</label>
          <select name="contract_id" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Selectează --</option>
            {contracte?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.numar_contract} - {(c.clienti as unknown as { nume: string })?.nume}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
          <textarea name="descriere" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsabil</label>
            <input type="text" name="responsabil" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" defaultValue="In lucru" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>In lucru</option><option>Finalizat</option><option>Suspendat</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data start</label>
            <input type="date" name="data_start" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data estimată finalizare</label>
            <input type="date" name="data_estimata_finalizare" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Salvează</button>
          <Link href="/proiecte" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
