"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaServiciu(formData: FormData) {
  const supabase = await createClient();
  const clientId = formData.get("client_id") as string;
  const numarImobile = parseInt((formData.get("numar_imobile") as string) || "0");
  const pretPerImobil = parseFloat((formData.get("pret_per_imobil") as string) || "0");
  const valoareTotala = numarImobile * pretPerImobil;

  const { error } = await supabase.from("servicii").insert({
    contract_id: Number(formData.get("contract_id")),
    descriere_serviciu: (formData.get("descriere_serviciu") as string).trim(),
    numar_imobile: numarImobile,
    pret_per_imobil: pretPerImobil,
    valoare_totala: valoareTotala,
    status_predare: "Nepredat",
    status_facturare: "Nefacturat",
    status_incasare: "Neincasat",
  });

  if (error) {
    redirect(`/clienti/${clientId}/detalii?message=Eroare la adăugare serviciu.&type=danger`);
  }
  redirect(`/clienti/${clientId}/detalii?message=Serviciu adăugat cu succes.&type=success`);
}

export async function editeazaServiciu(id: number, formData: FormData) {
  const supabase = await createClient();
  const clientId = formData.get("client_id") as string;
  const numarImobile = parseInt((formData.get("numar_imobile") as string) || "0");
  const pretPerImobil = parseFloat((formData.get("pret_per_imobil") as string) || "0");
  const valoareTotala = numarImobile * pretPerImobil;

  const { error } = await supabase
    .from("servicii")
    .update({
      descriere_serviciu: (formData.get("descriere_serviciu") as string)?.trim(),
      numar_imobile: numarImobile,
      pret_per_imobil: pretPerImobil,
      valoare_totala: valoareTotala,
      data_predare: (formData.get("data_predare") as string) || null,
      status_predare: (formData.get("status_predare") as string) || "Nepredat",
      numar_factura: (formData.get("numar_factura") as string)?.trim() || null,
      data_factura: (formData.get("data_factura") as string) || null,
      status_facturare: (formData.get("status_facturare") as string) || "Nefacturat",
      data_incasare: (formData.get("data_incasare") as string) || null,
      status_incasare: (formData.get("status_incasare") as string) || "Neincasat",
      observatii: (formData.get("observatii") as string)?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    redirect(`/clienti/${clientId}/detalii?message=Eroare la actualizare serviciu.&type=danger`);
  }
  redirect(`/clienti/${clientId}/detalii?message=Serviciu actualizat.&type=success`);
}

export async function stergeServiciu(id: number) {
  const supabase = await createClient();

  // Get client_id for redirect
  const { data: srv } = await supabase
    .from("servicii")
    .select("contract_id, contracte(client_id)")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("servicii").delete().eq("id", id);

  const clientId = (srv?.contracte as unknown as { client_id: number })?.client_id;

  if (error || !clientId) {
    redirect("/clienti?message=Eroare la ștergere serviciu.&type=danger");
  }
  redirect(`/clienti/${clientId}/detalii?message=Serviciu șters.&type=success`);
}
