"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaFactura(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("facturi").insert({
    numar_factura: (formData.get("numar_factura") as string).trim(),
    contract_id: Number(formData.get("contract_id")),
    valoare: parseFloat(formData.get("valoare") as string),
    data_emitere: formData.get("data_emitere") as string,
    data_scadenta: (formData.get("data_scadenta") as string) || null,
    status: (formData.get("status") as string) || "Emisa",
  });

  if (error) {
    redirect("/facturi?message=Eroare la adăugare factură.&type=danger");
  }
  redirect("/facturi?message=Factură adăugată cu succes.&type=success");
}

export async function editeazaFactura(id: number, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("facturi")
    .update({
      numar_factura: (formData.get("numar_factura") as string).trim(),
      contract_id: Number(formData.get("contract_id")),
      valoare: parseFloat(formData.get("valoare") as string),
      data_emitere: formData.get("data_emitere") as string,
      data_scadenta: (formData.get("data_scadenta") as string) || null,
      status: (formData.get("status") as string) || "Emisa",
    })
    .eq("id", id);

  if (error) {
    redirect("/facturi?message=Eroare la actualizare.&type=danger");
  }
  redirect("/facturi?message=Factură actualizată.&type=success");
}

export async function stergeFactura(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("facturi").delete().eq("id", id);
  if (error) {
    redirect("/facturi?message=Eroare la ștergere.&type=danger");
  }
  redirect("/facturi?message=Factură ștearsă.&type=success");
}
