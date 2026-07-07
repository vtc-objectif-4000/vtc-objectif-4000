export function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return "Non renseigne";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

export function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Non renseigne";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export function formatRoleName(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

export function fullName(person) {
  if (!person) {
    return "";
  }

  return [person.first_name, person.last_name].filter(Boolean).join(" ").trim();
}
