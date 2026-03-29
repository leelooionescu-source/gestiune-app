"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaProiect(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("proiecte").insert({
    nume: (formData.get("nume") as string).trim(),
    contract_id: Number(formData.get("contract_id")),
    descriere: (formData.get("descriere") as string)?.trim() || null,
    responsabil: (formData.get("responsabil") as string)?.trim() || null,
    data_start: (formData.get("data_start") as string) || null,
    data_estimata_finalizare: (formData.get("data_estimata_finalizare") as string) || null,
    status: (formData.get("status") as string) || "In lucru",
  });

  if (error) {
    redirect("/proiecte?message=Eroare la adăugare proiect.&type=danger");
  }
  redirect("/proiecte?message=Proiect adăugat cu succes.&type=success");
}

export async function editeazaProiect(id: number, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("proiecte")
    .update({
      nume: (formData.get("nume") as string).trim(),
      contract_id: Number(formData.get("contract_id")),
      descriere: (formData.get("descriere") as string)?.trim() || null,
      responsabil: (formData.get("responsabil") as string)?.trim() || null,
      data_start: (formData.get("data_start") as string) || null,
      data_estimata_finalizare: (formData.get("data_estimata_finalizare") as string) || null,
      status: (formData.get("status") as string) || "In lucru",
    })
    .eq("id", id);

  if (error) {
    redirect("/proiecte?message=Eroare la actualizare.&type=danger");
  }
  redirect("/proiecte?message=Proiect actualizat.&type=success");
}

export async function stergeProiect(id: number) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("predari")
    .select("*", { count: "exact", head: true })
    .eq("proiect_id", id);

  if (count && count > 0) {
    redirect("/proiecte?message=Nu poți șterge proiectul - are predări asociate.&type=danger");
  }

  const { error } = await supabase.from("proiecte").delete().eq("id", id);
  if (error) {
    redirect("/proiecte?message=Eroare la ștergere.&type=danger");
  }
  redirect("/proiecte?message=Proiect șters.&type=success");
}
