import { requireSupabase } from "@/config/supabaseClient";
import { logAuditEvent } from "./rgpdService";

const WORKSHOP_SELECT = `
  id,
  organization_id,
  title,
  module_id,
  module_code,
  facilitator_id,
  workshop_date,
  workshop_time,
  location,
  capacity,
  notes,
  created_at,
  updated_at,
  facilitator:profiles!workshops_facilitator_id_fkey(id, first_name, last_name),
  module:modules(id, code, title),
  workshop_participants(
    id,
    beneficiary_id,
    registered_at,
    beneficiary:beneficiaries(id, first_name, last_name, status),
    attendances(id, status, note, updated_at)
  )
`;

export async function listWorkshops() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("workshops")
    .select(WORKSHOP_SELECT)
    .order("workshop_date", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getWorkshopById(workshopId) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("workshops")
    .select(WORKSHOP_SELECT)
    .eq("id", workshopId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createWorkshop({
  values,
  organizationId,
  facilitatorId,
}) {
  const supabase = requireSupabase();
  const beneficiaryIds = values.beneficiaryIds || [];

  const { data: workshop, error: workshopError } = await supabase
    .from("workshops")
    .insert({
      organization_id: organizationId,
      title: values.title,
      module_id: values.module_id || null,
      module_code: values.module_code || null,
      facilitator_id: facilitatorId,
      workshop_date: values.workshop_date,
      workshop_time: values.workshop_time,
      location: values.location || null,
      capacity: values.capacity ? Number(values.capacity) : null,
      notes: values.notes || null,
    })
    .select("id, title")
    .single();

  if (workshopError) {
    throw workshopError;
  }

  if (beneficiaryIds.length > 0) {
    const { data: participants, error: participantsError } = await supabase
      .from("workshop_participants")
      .insert(
        beneficiaryIds.map((beneficiaryId) => ({
          organization_id: organizationId,
          workshop_id: workshop.id,
          beneficiary_id: beneficiaryId,
        })),
      )
      .select("id, beneficiary_id");

    if (participantsError) {
      throw participantsError;
    }

    const { error: attendanceError } = await supabase.from("attendances").insert(
      (participants ?? []).map((participant) => ({
        organization_id: organizationId,
        workshop_id: workshop.id,
        participant_id: participant.id,
        beneficiary_id: participant.beneficiary_id,
        status: "inscrit",
        recorded_by: facilitatorId,
      })),
    );

    if (attendanceError) {
      throw attendanceError;
    }
  }

  await logAuditEvent({
    action: "create_workshop",
    targetTable: "workshops",
    targetId: workshop.id,
    metadata: { participants: beneficiaryIds.length },
  });

  return workshop;
}

export async function deleteWorkshop(workshopId) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("workshops").delete().eq("id", workshopId);

  if (error) {
    throw error;
  }

  await logAuditEvent({
    action: "delete_workshop",
    targetTable: "workshops",
    targetId: workshopId,
  });

  return true;
}
