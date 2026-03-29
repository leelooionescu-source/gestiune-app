import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { adaugaHg, stergeHg } from "@/app/actions/hg";
import { adaugaServiciu, stergeServiciu } from "@/app/actions/servicii";

export default async function ClientDetaliiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clienti").select("*").eq("id", id).single();
  if (!client) notFound();

  const { data: contracte } = await supabase
    .from("contracte")
    .select("*")
    .eq("client_id", id)
    .order("creat_la", { ascending: false });

  // Get HG-uri and servicii for each contract
  const contracteData = await Promise.all(
    (contracte || []).map(async (c) => {
      const [{ data: hgUri }, { data: servicii }] = await Promise.all([
        supabase.from("hg_uri").select("*").eq("contract_id", c.id).order("creat_la"),
        supabase.from("servicii").select("*").eq("contract_id", c.id).order("creat_la"),
      ]);
      return { contract: c, hgUri: hgUri || [], servicii: servicii || [] };
    })
  );

  // Compute totals
  const allServicii = contracteData.flatMap((c) => c.servicii);
  const totals = {
    totalImobile: allServicii.reduce((s, srv) => s + (srv.numar_imobile || 0), 0),
    totalValoare: allServicii.reduce((s, srv) => s + (Number(srv.valoare_totala) || 0), 0),
    predate: allServicii.filter((s) => s.status_predare === "Predat").length,
    nepredate: allServicii.filter((s) => s.status_predare === "Nepredat").length,
    facturate: allServicii.filter((s) => s.status_facturare === "Facturat").length,
    nefacturate: allServicii.filter((s) => s.status_facturare === "Nefacturat").length,
    incasate: allServicii.filter((s) => s.status_incasare === "Incasat").length,
    neincasate: allServicii.filter((s) => s.status_incasare === "Neincasat").length,
    valoareNeincasata: allServicii
      .filter((s) => s.status_incasare === "Neincasat")
      .reduce((sum, s) => sum + (Number(s.valoare_totala) || 0), 0),
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/clienti" className="text-blue-600 hover:underline text-sm">&larr; Înapoi la clienți</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{client.nume}</h1>
          {client.telefon && <p className="text-gray-500">Tel: {client.telefon}</p>}
          {client.email && <p className="text-gray-500">Email: {client.email}</p>}
          {client.notite && <p className="text-gray-500 mt-1">{client.notite}</p>}
        </div>
        <Link href={`/clienti/${client.id}/editeaza`} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors">
          Editează
        </Link>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total imobile", value: totals.totalImobile },
          { label: "Valoare totală", value: `${totals.totalValoare.toLocaleString("ro-RO")} RON` },
          { label: "Predate / Nepredate", value: `${totals.predate} / ${totals.nepredate}` },
          { label: "Facturate / Nefacturate", value: `${totals.facturate} / ${totals.nefacturate}` },
          { label: "Val. neîncasată", value: `${totals.valoareNeincasata.toLocaleString("ro-RO")} RON` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-lg font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contracts with HG-uri and Servicii */}
      {contracteData.map(({ contract: c, hgUri, servicii }) => (
        <div key={c.id} className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Contract: {c.numar_contract}</h2>
              {c.descriere && <p className="text-gray-500 text-sm">{c.descriere}</p>}
              <p className="text-sm text-gray-400">
                {c.data_inceput} - {c.data_sfarsit || "N/A"} |{" "}
                <span className={`font-medium ${c.status === "Activ" ? "text-green-600" : "text-gray-600"}`}>{c.status}</span>
                {c.valoare && ` | ${Number(c.valoare).toLocaleString("ro-RO")} RON`}
              </p>
            </div>
          </div>

          {/* HG-uri */}
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">HG-uri</h3>
            {hgUri.length > 0 && (
              <div className="space-y-1 mb-2">
                {hgUri.map((hg) => (
                  <div key={hg.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm">
                    <span><strong>{hg.numar_hg}</strong> {hg.descriere && `- ${hg.descriere}`}</span>
                    <form action={stergeHg.bind(null, hg.id)} className="inline">
                      <button type="submit" className="text-red-500 hover:underline text-xs">Șterge</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <form action={adaugaHg} className="flex gap-2 items-end flex-wrap">
              <input type="hidden" name="contract_id" value={c.id} />
              <input type="hidden" name="client_id" value={client.id} />
              <input type="text" name="numar_hg" placeholder="Nr. HG" required className="px-2 py-1 border border-gray-300 rounded text-sm w-28" />
              <input type="text" name="descriere" placeholder="Descriere" className="px-2 py-1 border border-gray-300 rounded text-sm flex-1 min-w-[150px]" />
              <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">+ HG</button>
            </form>
          </div>

          {/* Servicii */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Servicii</h3>
            {servicii.length > 0 && (
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1 text-left">Descriere</th>
                      <th className="px-2 py-1 text-right">Imobile</th>
                      <th className="px-2 py-1 text-right">Preț/imobil</th>
                      <th className="px-2 py-1 text-right">Total</th>
                      <th className="px-2 py-1 text-center">Predare</th>
                      <th className="px-2 py-1 text-center">Facturare</th>
                      <th className="px-2 py-1 text-center">Încasare</th>
                      <th className="px-2 py-1 text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicii.map((srv) => (
                      <tr key={srv.id} className="border-t">
                        <td className="px-2 py-2">{srv.descriere_serviciu}</td>
                        <td className="px-2 py-2 text-right">{srv.numar_imobile}</td>
                        <td className="px-2 py-2 text-right">{Number(srv.pret_per_imobil).toLocaleString("ro-RO")}</td>
                        <td className="px-2 py-2 text-right font-medium">{Number(srv.valoare_totala).toLocaleString("ro-RO")}</td>
                        <td className="px-2 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${srv.status_predare === "Predat" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {srv.status_predare}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${srv.status_facturare === "Facturat" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {srv.status_facturare}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${srv.status_incasare === "Incasat" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {srv.status_incasare}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <form action={stergeServiciu.bind(null, srv.id)} className="inline">
                            <button type="submit" className="text-red-500 hover:underline text-xs">Șterge</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer text-green-600 hover:underline font-medium">+ Adaugă serviciu</summary>
              <form action={adaugaServiciu} className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input type="hidden" name="contract_id" value={c.id} />
                <input type="hidden" name="client_id" value={client.id} />
                <input type="text" name="descriere_serviciu" placeholder="Descriere serviciu *" required className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm" />
                <input type="number" name="numar_imobile" placeholder="Nr. imobile" className="px-2 py-1 border border-gray-300 rounded text-sm" />
                <input type="number" name="pret_per_imobil" placeholder="Preț/imobil" step="0.01" className="px-2 py-1 border border-gray-300 rounded text-sm" />
                <button type="submit" className="col-span-2 sm:col-span-4 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                  Salvează serviciu
                </button>
              </form>
            </details>
          </div>
        </div>
      ))}

      {contracteData.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Niciun contract pentru acest client.{" "}
          <Link href="/contracte/adauga" className="text-blue-600 hover:underline">Adaugă un contract</Link>
        </div>
      )}
    </div>
  );
}
