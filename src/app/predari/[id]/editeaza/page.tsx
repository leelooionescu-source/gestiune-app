import { createClient } from "@/lib/supabase/server";
import { editeazaPredare } from "@/app/actions/predari";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditeazaPredare({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: predare }, { data: proiecte }] = await Promise.all([
    supabase.from("predari").select("*").eq("id", id).single(),
    supabase.from("proiecte").select("id, nume, contracte(numar_contract, clienti(nume))").order("nume"),
  ]);
  if (!predare) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editează predare</h1>
      <form action={editeazaPredare.bind(null, predare.id)} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proiect *</label>
          <select name="proiect_id" required defaultValue={predare.proiect_id} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            {proiecte?.map((p) => {
              const c = p.contracte as unknown as { numar_contract: string; clienti: { nume: string } };
              return <option key={p.id} value={p.id}>{p.nume} - {c?.numar_contract} ({c?.clienti?.nume})</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data predare *</label>
          <input type="date" name="data_predare" required defaultValue={predare.data_predare} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
          <textarea name="descriere" rows={2} defaultValue={predare.descriere || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document predare</label>
          <input type="text" name="document_predare" defaultValue={predare.document_predare || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observații</label>
          <textarea name="observatii" rows={2} defaultValue={predare.observatii || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Salvează</button>
          <Link href="/predari" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
