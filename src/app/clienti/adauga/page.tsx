import { adaugaClient } from "@/app/actions/clienti";
import Link from "next/link";

export default function AdaugaClientPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Adaugă client</h1>

      <form action={adaugaClient} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="nume" className="block text-sm font-medium text-gray-700 mb-1">
            Nume *
          </label>
          <input type="text" id="nume" name="nume" required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input type="text" id="telefon" name="telefon"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" id="email" name="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="notite" className="block text-sm font-medium text-gray-700 mb-1">Notițe</label>
          <textarea id="notite" name="notite" rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Salvează
          </button>
          <Link href="/clienti" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
            Anulează
          </Link>
        </div>
      </form>
    </div>
  );
}
