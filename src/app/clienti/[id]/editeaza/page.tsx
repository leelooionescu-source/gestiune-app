import { createClient } from "@/lib/supabase/server";
import { editeazaClient } from "@/app/actions/clienti";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditeazaClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clienti").select("*").eq("id", id).single();
  if (!client) notFound();

  const editeazaAction = editeazaClient.bind(null, client.id);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Editează client</h1>

      <form action={editeazaAction} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="nume" className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
          <input type="text" id="nume" name="nume" required defaultValue={client.nume}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input type="text" id="telefon" name="telefon" defaultValue={client.telefon || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="email" name="email" defaultValue={client.email || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="notite" className="block text-sm font-medium text-gray-700 mb-1">Notițe</label>
          <textarea id="notite" name="notite" rows={3} defaultValue={client.notite || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Salvează</button>
          <Link href="/clienti" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
