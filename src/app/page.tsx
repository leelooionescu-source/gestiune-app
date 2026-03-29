import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalClienti },
    { count: contracteActive },
    { count: proiecteInLucru },
    { count: facturiNeincasate },
    { data: facturiEmise },
    { count: serviciiNepredate },
    { count: serviciiNefacturate },
    { count: serviciiNeincasate },
    { data: serviciiNeincasateVal },
  ] = await Promise.all([
    supabase.from("clienti").select("*", { count: "exact", head: true }),
    supabase.from("contracte").select("*", { count: "exact", head: true }).eq("status", "Activ"),
    supabase.from("proiecte").select("*", { count: "exact", head: true }).eq("status", "In lucru"),
    supabase.from("facturi").select("*", { count: "exact", head: true }).eq("status", "Emisa"),
    supabase.from("facturi").select("valoare").eq("status", "Emisa"),
    supabase.from("servicii").select("*", { count: "exact", head: true }).eq("status_predare", "Nepredat"),
    supabase.from("servicii").select("*", { count: "exact", head: true }).eq("status_facturare", "Nefacturat"),
    supabase.from("servicii").select("*", { count: "exact", head: true }).eq("status_incasare", "Neincasat"),
    supabase.from("servicii").select("valoare_totala").eq("status_incasare", "Neincasat"),
  ]);

  const valoareNeincasata = facturiEmise?.reduce((s, f) => s + (Number(f.valoare) || 0), 0) || 0;
  const valoareServiciiNeincasate = serviciiNeincasateVal?.reduce((s, f) => s + (Number(f.valoare_totala) || 0), 0) || 0;

  // Contracts expiring in 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const { data: contracteExpira } = await supabase
    .from("contracte")
    .select("*, clienti(nume)")
    .eq("status", "Activ")
    .not("data_sfarsit", "is", null)
    .lte("data_sfarsit", thirtyDaysFromNow.toISOString().split("T")[0])
    .order("data_sfarsit")
    .limit(5);

  // Latest invoices
  const { data: ultimeleFacturi } = await supabase
    .from("facturi")
    .select("*, contracte(numar_contract)")
    .order("creat_la", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Clienți", value: totalClienti || 0, href: "/clienti", color: "bg-blue-500" },
    { label: "Contracte active", value: contracteActive || 0, href: "/contracte", color: "bg-green-500" },
    { label: "Proiecte în lucru", value: proiecteInLucru || 0, href: "/proiecte", color: "bg-yellow-500" },
    { label: "Facturi neîncasate", value: facturiNeincasate || 0, href: "/facturi", color: "bg-red-500" },
    { label: "Valoare neîncasată", value: `${valoareNeincasata.toLocaleString("ro-RO")} RON`, href: "/facturi", color: "bg-red-600" },
    { label: "Servicii nepredate", value: serviciiNepredate || 0, color: "bg-orange-500" },
    { label: "Servicii nefacturate", value: serviciiNefacturate || 0, color: "bg-orange-600" },
    { label: "Servicii neîncasate", value: serviciiNeincasate || 0, color: "bg-purple-500" },
    { label: "Val. servicii neîncasate", value: `${valoareServiciiNeincasate.toLocaleString("ro-RO")} RON`, color: "bg-purple-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} w-3 h-12 rounded-full`} />
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stat.href ? (
                    <Link href={stat.href} className="hover:text-blue-600">{stat.value}</Link>
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contracts expiring soon */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contracte care expiră în 30 zile</h2>
          {contracteExpira && contracteExpira.length > 0 ? (
            <div className="space-y-2">
              {contracteExpira.map((c) => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{c.numar_contract}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {(c.clienti as unknown as { nume: string })?.nume}
                    </span>
                  </div>
                  <span className="text-red-600 text-sm font-medium">{c.data_sfarsit}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Niciun contract nu expiră în curând.</p>
          )}
        </div>

        {/* Latest invoices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ultimele facturi</h2>
          {ultimeleFacturi && ultimeleFacturi.length > 0 ? (
            <div className="space-y-2">
              {ultimeleFacturi.map((f) => (
                <div key={f.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{f.numar_factura}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {(f.contracte as unknown as { numar_contract: string })?.numar_contract}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{Number(f.valoare).toLocaleString("ro-RO")} RON</span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      f.status === "Emisa" ? "bg-yellow-100 text-yellow-700" :
                      f.status === "Incasata" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>{f.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nicio factură încă.</p>
          )}
        </div>
      </div>
    </div>
  );
}
