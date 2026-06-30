import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types/database";

export type SavedSearch = {
  id: string;
  query: string;
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export async function listSavedSearches(userId: string, limit = 20): Promise<SavedSearch[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    return ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
      id: String(row.id),
      query: String(row.query),
      filters: (row.filters as Record<string, unknown>) ?? {},
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  } catch {
    return [];
  }
}

export async function saveSearch(
  userId: string,
  query: string,
  filters: Record<string, unknown> = {},
): Promise<SavedSearch | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("saved_searches")
      .insert({ user_id: userId, query, filters: filters as Json })
      .select("*")
      .single();

    if (!data) return null;
    return {
      id: String(data.id),
      query: String(data.query),
      filters: (data.filters as Record<string, unknown>) ?? {},
      createdAt: String(data.created_at),
      updatedAt: String(data.updated_at),
    };
  } catch {
    return null;
  }
}

export async function deleteSavedSearch(userId: string, searchId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("saved_searches").delete().eq("user_id", userId).eq("id", searchId);
    return !error;
  } catch {
    return false;
  }
}
