"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function adaugaUtilizator(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;
  const nume = (formData.get("nume") as string).trim();
  const isAdmin = formData.get("is_admin") === "on";

  if (!email || !password || !nume) {
    redirect("/utilizatori?message=Toate câmpurile sunt obligatorii.&type=danger");
  }

  // Create auth user via Supabase Admin (using service role from server)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    redirect(`/utilizatori?message=${encodeURIComponent(authError.message)}&type=danger`);
  }

  // Create profile entry
  const { error: profileError } = await supabase.from("utilizatori").insert({
    auth_user_id: authData.user.id,
    username: email,
    nume,
    is_admin: isAdmin,
  });

  if (profileError) {
    redirect(`/utilizatori?message=Utilizator creat dar profilul nu a putut fi salvat.&type=warning`);
  }

  redirect(`/utilizatori?message=Utilizatorul ${nume} a fost adăugat.&type=success`);
}

export async function stergeUtilizator(id: number, authUserId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser?.id === authUserId) {
    redirect("/utilizatori?message=Nu te poți șterge pe tine.&type=danger");
  }

  // Delete auth user (cascades to utilizatori via FK)
  const { error } = await supabase.auth.admin.deleteUser(authUserId);
  if (error) {
    // Fallback: delete just the profile
    await supabase.from("utilizatori").delete().eq("id", id);
  }

  redirect("/utilizatori?message=Utilizator șters.&type=success");
}
