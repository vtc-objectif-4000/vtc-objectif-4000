import { requireSupabase } from "@/config/supabaseClient";
import { logAuditEvent, sanitizeNotePayload } from "./rgpdService";

const NOTE_SELECT = `
  id,
  organization_id,
  beneficiary_id,
  author_id,
  note_type,
  content,
  visibility,
  is_sensitive,
  created_at,
  updated_at,
  author:profiles!follow_up_notes_author_id_fkey(id, first_name, last_name, role)
`;

export async function listNotesForBeneficiary(beneficiaryId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("follow_up_notes")
    .select(NOTE_SELECT)
    .eq("beneficiary_id", beneficiaryId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createNote({
  values,
  organizationId,
  authorId,
  canCreateSensitiveNote = false,
}) {
  const supabase = requireSupabase();
  const sanitized = sanitizeNotePayload(values, canCreateSensitiveNote);

  const { data, error } = await supabase
    .from("follow_up_notes")
    .insert({
      ...sanitized,
      organization_id: organizationId,
      author_id: authorId,
    })
    .select(NOTE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "create_note",
    targetTable: "follow_up_notes",
    targetId: data.id,
    metadata: { beneficiaryId: data.beneficiary_id, sensitive: data.is_sensitive },
  });

  return data;
}

export async function deleteNote(noteId) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("follow_up_notes").delete().eq("id", noteId);

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "delete_note",
    targetTable: "follow_up_notes",
    targetId: noteId,
  });

  return true;
}

export async function listNotesForExport() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("follow_up_notes")
    .select(
      `
        id,
        note_type,
        content,
        is_sensitive,
        created_at,
        beneficiary:beneficiaries(id, first_name, last_name),
        author:profiles!follow_up_notes_author_id_fkey(id, first_name, last_name, role)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
