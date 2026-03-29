"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaClient(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("clienti").insert({
    nume: (formData.get("nume") as string).trim(),
    telefon: (formData.get("telefon") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    notite: (formData.get("notite") as string)?.trim() || null,
  });

  if (error) {
    redirect("/clienti?message=Eroare la adăugare client.&type=danger");
  }
  redirect("/clienti?message=Client adăugat cu succes.&type=success");
}

export async function editeazaClient(id: number, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clienti")
    .update({
      nume: (formData.get("nume") as string).trim(),
      telefon: (formData.get("telefon") as string)?.trim() || null,
      email: (formData.get("email") as string)?.trim() || null,
      notite: (formData.get("notite") as string)?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    redirect(`/clienti?message=Eroare la actualizare.&type=danger`);
  }
  redirect("/clienti?message=Client actualizat.&type=success");
}

export async function stergeClient(id: number) {
  const supabase = await createClient();

  // Check for associated contracts
  const { count } = await supabase
    .from("contracte")
    .select("*", { count: "exact", head: true })
    .eq("client_id", id);

  if (count && count > 0) {
    redirect("/clienti?message=Nu poți șterge clientul - are contracte asociate.&type=danger");
  }

  const { error } = await supabase.from("clienti").delete().eq("id", id);
  if (error) {
    redirect("/clienti?message=Eroare la ștergere.&type=danger");
  }
  redirect("/clienti?message=Client șters.&type=success");
}
