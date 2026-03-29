"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaPredare(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("predari").insert({
    proiect_id: Number(formData.get("proiect_id")),
    data_predare: formData.get("data_predare") as string,
    descriere: (formData.get("descriere") as string)?.trim() || null,
    document_predare: (formData.get("document_predare") as string)?.trim() || null,
    observatii: (formData.get("observatii") as string)?.trim() || null,
  });

  if (error) {
    redirect("/predari?message=Eroare la adăugare predare.&type=danger");
  }
  redirect("/predari?message=Predare adăugată cu succes.&type=success");
}

export async function editeazaPredare(id: number, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("predari")
    .update({
      proiect_id: Number(formData.get("proiect_id")),
      data_predare: formData.get("data_predare") as string,
      descriere: (formData.get("descriere") as string)?.trim() || null,
      document_predare: (formData.get("document_predare") as string)?.trim() || null,
      observatii: (formData.get("observatii") as string)?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    redirect("/predari?message=Eroare la actualizare.&type=danger");
  }
  redirect("/predari?message=Predare actualizată.&type=success");
}

export async function stergePredare(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("predari").delete().eq("id", id);
  if (error) {
    redirect("/predari?message=Eroare la ștergere.&type=danger");
  }
  redirect("/predari?message=Predare ștearsă.&type=success");
}
