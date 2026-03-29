"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaHg(formData: FormData) {
  const supabase = await createClient();
  const clientId = formData.get("client_id") as string;

  const { error } = await supabase.from("hg_uri").insert({
    contract_id: Number(formData.get("contract_id")),
    numar_hg: (formData.get("numar_hg") as string).trim(),
    descriere: (formData.get("descriere") as string)?.trim() || null,
  });

  if (error) {
    redirect(`/clienti/${clientId}/detalii?message=Eroare la adăugare HG.&type=danger`);
  }
  redirect(`/clienti/${clientId}/detalii?message=HG adăugat cu succes.&type=success`);
}

export async function stergeHg(id: number) {
  const supabase = await createClient();

  const { data: hg } = await supabase
    .from("hg_uri")
    .select("contract_id, contracte(client_id)")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("hg_uri").delete().eq("id", id);

  const clientId = (hg?.contracte as unknown as { client_id: number })?.client_id;

  if (error || !clientId) {
    redirect("/clienti?message=Eroare la ștergere HG.&type=danger");
  }
  redirect(`/clienti/${clientId}/detalii?message=HG șters.&type=success`);
}
