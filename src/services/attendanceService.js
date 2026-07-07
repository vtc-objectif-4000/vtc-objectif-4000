import { requireSupabase } from "@/config/supabaseClient";
import { logAuditEvent } from "./rgpdService";

export async function listWorkshopAttendance(workshopId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
        id,
        workshop_id,
        beneficiary_id,
        status,
        note,
        updated_at,
        beneficiary:beneficiaries(id, first_name, last_name),
        workshop:workshops(id, title, workshop_date, workshop_time)
      `,
    )
    .eq("workshop_id", workshopId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listBeneficiaryAttendance(beneficiaryId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
        id,
        status,
        note,
        updated_at,
        workshop:workshops(id, title, workshop_date, workshop_time, location)
      `,
    )
    .eq("beneficiary_id", beneficiaryId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateAttendanceStatus({
  attendanceId,
  status,
  note,
  actorId,
}) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("attendances")
    .update({
      status,
      note: note || null,
      recorded_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", attendanceId)
    .select("id, status, note, updated_at")
    .single();

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "update_attendance",
    targetTable: "attendances",
    targetId: attendanceId,
    metadata: { status },
  });

  return data;
}

export async function listAttendancesForExport() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("attendances")
    .select(
      `
        id,
        status,
        note,
        updated_at,
        beneficiary:beneficiaries(id, first_name, last_name),
        workshop:workshops(id, title, workshop_date, workshop_time)
      `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
