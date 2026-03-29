"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaContract(formData: FormData) {
  const supabase = await createClient();
  const valoare = formData.get("valoare") as string;
  const { error } = await supabase.from("contracte").insert({
    numar_contract: (formData.get("numar_contract") as string).trim(),
    client_id: Number(formData.get("client_id")),
    descriere: (formData.get("descriere") as string)?.trim() || null,
    valoare: valoare ? parseFloat(valoare) : null,
    data_inceput: (formData.get("data_inceput") as string) || null,
    data_sfarsit: (formData.get("data_sfarsit") as string) || null,
    status: (formData.get("status") as string) || "Activ",
  });

  if (error) {
    redirect("/contracte?message=Eroare la adăugare contract.&type=danger");
  }
  redirect("/contracte?message=Contract adăugat cu succes.&type=success");
}

export async function editeazaContract(id: number, formData: FormData) {
  const supabase = await createClient();
  const valoare = formData.get("valoare") as string;
  const { error } = await supabase
    .from("contracte")
    .update({
      numar_contract: (formData.get("numar_contract") as string).trim(),
      client_id: Number(formData.get("client_id")),
      descriere: (formData.get("descriere") as string)?.trim() || null,
      valoare: valoare ? parseFloat(valoare) : null,
      data_inceput: (formData.get("data_inceput") as string) || null,
      data_sfarsit: (formData.get("data_sfarsit") as string) || null,
      status: (formData.get("status") as string) || "Activ",
    })
    .eq("id", id);

  if (error) {
    redirect("/contracte?message=Eroare la actualizare.&type=danger");
  }
  redirect("/contracte?message=Contract actualizat.&type=success");
}

export async function stergeContract(id: number) {
  const supabase = await createClient();

  const checks = await Promise.all([
    supabase.from("proiecte").select("*", { count: "exact", head: true }).eq("contract_id", id),
    supabase.from("facturi").select("*", { count: "exact", head: true }).eq("contract_id", id),
    supabase.from("servicii").select("*", { count: "exact", head: true }).eq("contract_id", id),
    supabase.from("hg_uri").select("*", { count: "exact", head: true }).eq("contract_id", id),
  ]);

  const hasChildren = checks.some((r) => r.count && r.count > 0);
  if (hasChildren) {
    redirect("/contracte?message=Nu poți șterge contractul - are proiecte, facturi, servicii sau HG-uri asociate.&type=danger");
  }

  const { error } = await supabase.from("contracte").delete().eq("id", id);
  if (error) {
    redirect("/contracte?message=Eroare la ștergere.&type=danger");
  }
  redirect("/contracte?message=Contract șters.&type=success");
}
