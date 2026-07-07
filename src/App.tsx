import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  buildMaintenanceAlerts,
  buildMonthlyCsv,
  buildTripRecord,
  calculateDashboardStats,
  calculateMaintenanceCostPerKm,
  calculateTripMetrics,
  getMonthFromDate,
} from "./lib/calculations";
import {
  clearAllTripsAndSettings,
  deleteTripsForMonth,
  getAppSettings,
  getTrips,
  importSnapshot,
  saveAppSettings,
  saveTrip,
} from "./lib/storage";
import {
  AppSettings,
  AppSnapshot,
  DEFAULT_APP_SETTINGS,
  Decision,
  MONTHLY_TARGET,
  TripInput,
  TripRecord,
} from "./types";

type TabId = "dashboard" | "trip" | "vehicle" | "maintenance" | "data";

type Notice = {
  tone: "success" | "warning" | "error";
  message: string;
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "trip", label: "Ajouter une course" },
  { id: "vehicle", label: "Véhicule & frais" },
  { id: "maintenance", label: "Entretien" },
  { id: "data", label: "Données" },
];

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function getLocalIsoDate(): string {
  const now = new Date();
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function getCurrentMonthValue(): string {
  return getLocalIsoDate().slice(0, 7);
}

function createDefaultTripInput(): TripInput {
  return {
    date: getLocalIsoDate(),
    priceProposed: 0,
    approachMinutes: 0,
    waitMinutes: 0,
    tripMinutes: 0,
    approachKm: 0,
    tripKm: 0,
    note: "",
    zone: "",
    comment: "",
  };
}

function sortTripsDescending(trips: TripRecord[]): TripRecord[] {
  return [...trips].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0);
}

function formatNumber(value: number, suffix = ""): string {
  return `${numberFormatter.format(value || 0)}${suffix}`;
}

function formatInteger(value: number, suffix = ""): string {
  return `${integerFormatter.format(value || 0)}${suffix}`;
}

function formatDecisionLabel(decision: Decision): string {
  if (decision === "accepter") {
    return "Accepter";
  }

  if (decision === "limite") {
    return "Limite";
  }

  return "Refuser";
}

function formatMonthLabel(month: string): string {
  if (!month) {
    return "Mois";
  }

  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex - 1, 1));
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function isSnapshotLike(value: unknown): value is AppSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AppSnapshot>;
  return Boolean(
    candidate.settings &&
      candidate.trips &&
      Array.isArray(candidate.trips) &&
      typeof candidate.exportedAt === "string",
  );
}

export default function App() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [tripInput, setTripInput] = useState<TripInput>(createDefaultTripInput());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [storedSettings, storedTrips] = await Promise.all([getAppSettings(), getTrips()]);

        if (!active) {
          return;
        }

        setSettings(storedSettings);
        setTrips(sortTripsDescending(storedTrips));
      } catch (error) {
        if (active) {
          setNotice({
            tone: "error",
            message:
              error instanceof Error
                ? error.message
                : "Impossible de charger les données enregistrées.",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const monthTrips = trips.filter((trip) => trip.month === selectedMonth);
  const tripPreview = calculateTripMetrics(tripInput, settings.vehicle, settings.maintenance);
  const dashboard = calculateDashboardStats(
    trips,
    selectedMonth,
    settings.vehicle.workingDaysPerMonth,
  );
  const maintenanceCostPerKm = calculateMaintenanceCostPerKm(settings.maintenance);
  const maintenanceAlerts = buildMaintenanceAlerts(
    settings.vehicle.currentMileage,
    settings.maintenance,
  );

  function setNumericTripField(field: keyof TripInput, rawValue: string) {
    setTripInput((current) => ({
      ...current,
      [field]: Number(rawValue) || 0,
    }));
  }

  function setTextTripField(field: keyof TripInput, value: string) {
    setTripInput((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function setNumericVehicleField(field: keyof AppSettings["vehicle"], rawValue: string) {
    setSettings((current) => ({
      ...current,
      vehicle: {
        ...current.vehicle,
        [field]: Number(rawValue) || 0,
      },
    }));
  }

  function setNumericMaintenanceField(
    field: keyof AppSettings["maintenance"],
    rawValue: string,
  ) {
    setSettings((current) => ({
      ...current,
      maintenance: {
        ...current.maintenance,
        [field]: Number(rawValue) || 0,
      },
    }));
  }

  async function persistSettings(message: string) {
    setSaving(true);

    try {
      await saveAppSettings(settings);
      setNotice({ tone: "success", message });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "La sauvegarde des paramètres a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTrip() {
    if (tripInput.priceProposed <= 0 || tripPreview.totalMinutes <= 0) {
      setNotice({
        tone: "warning",
        message: "Renseignez au minimum un prix proposé et un temps total supérieur à zéro.",
      });
      return;
    }

    setSaving(true);

    try {
      const trip = buildTripRecord(tripInput, settings);
      await saveTrip(trip);

      const nextTrips = sortTripsDescending([trip, ...trips]);
      setTrips(nextTrips);
      setSelectedMonth(getMonthFromDate(trip.date));
      setTripInput(createDefaultTripInput());
      setActiveTab("dashboard");
      setNotice({
        tone: trip.decision === "accepter" ? "success" : trip.decision === "limite" ? "warning" : "error",
        message: `Course enregistrée : ${formatDecisionLabel(trip.decision)} à ${formatCurrency(
          trip.netHourly,
        )}/h net.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Impossible d'enregistrer la course.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleExportJson() {
    const snapshot: AppSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      trips,
    };

    downloadFile(
      `cap-4000-vtc-${selectedMonth || "sauvegarde"}.json`,
      JSON.stringify(snapshot, null, 2),
      "application/json",
    );
    setNotice({ tone: "success", message: "Export JSON généré." });
  }

  function handleExportCsv() {
    const csv = buildMonthlyCsv(trips, selectedMonth);
    downloadFile(`courses-${selectedMonth}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
    setNotice({ tone: "success", message: `Export CSV du mois ${selectedMonth} généré.` });
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText) as unknown;

      if (!isSnapshotLike(parsed)) {
        throw new Error("Le fichier JSON ne correspond pas au format attendu.");
      }

      await importSnapshot(parsed);
      setSettings(parsed.settings);
      setTrips(sortTripsDescending(parsed.trips));
      setSelectedMonth(getCurrentMonthValue());
      setNotice({ tone: "success", message: "Import JSON terminé." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "L'import JSON a échoué. Vérifiez le fichier sélectionné.",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleDeleteMonthTrips() {
    if (
      !window.confirm(
        `Supprimer toutes les courses enregistrées pour ${formatMonthLabel(selectedMonth)} ?`,
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      await deleteTripsForMonth(selectedMonth);
      setTrips((current) => current.filter((trip) => trip.month !== selectedMonth));
      setNotice({
        tone: "success",
        message: `Toutes les courses du mois ${selectedMonth} ont été supprimées.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "La suppression des courses du mois a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearAllData() {
    if (
      !window.confirm(
        "Cette action supprime toutes les courses et tous les réglages. Voulez-vous continuer ?",
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      await clearAllTripsAndSettings();
      await saveAppSettings(DEFAULT_APP_SETTINGS);
      setSettings(DEFAULT_APP_SETTINGS);
      setTrips([]);
      setTripInput(createDefaultTripInput());
      setSelectedMonth(getCurrentMonthValue());
      setNotice({
        tone: "success",
        message:
          "Toutes les données ont été supprimées et les valeurs par défaut ont été réinitialisées.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "La suppression complète a échoué.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="app-background" />
      <main className="app-content">
        <section className="hero-card">
          <div>
            <p className="eyebrow">PWA VTC mobile-first</p>
            <h1>Cap 4000 VTC</h1>
            <p className="hero-copy">
              Refusez les courses non rentables, pilotez votre objectif de {formatCurrency(MONTHLY_TARGET)} brut,
              et gardez une vision claire de votre net réel.
            </p>
          </div>
          <div className={`decision-banner ${tripPreview.decision}`}>
            <span className="decision-banner__label">Décision instantanée</span>
            <strong>{formatDecisionLabel(tripPreview.decision)}</strong>
            <span>{formatCurrency(tripPreview.netHourly)}/h net</span>
          </div>
        </section>

        <section className="rules-card">
          <div>
            <strong>Seuil net minimum</strong>
            <span>30 €/h</span>
          </div>
          <div>
            <strong>Temps pris en compte</strong>
            <span>Approche + attente + course</span>
          </div>
          <div>
            <strong>Écart instantané</strong>
            <span>{formatCurrency(tripPreview.gap)}</span>
          </div>
        </section>

        <nav className="tab-strip" aria-label="Navigation principale">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={tab.id === activeTab ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {notice ? (
          <section className={`notice ${notice.tone}`}>
            <p>{notice.message}</p>
            <button className="ghost-button" onClick={() => setNotice(null)} type="button">
              Fermer
            </button>
          </section>
        ) : null}

        {loading ? (
          <section className="panel-card">
            <p>Chargement des données enregistrées…</p>
          </section>
        ) : null}

        {!loading && activeTab === "dashboard" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Mois suivi</p>
                  <h2>{formatMonthLabel(selectedMonth)}</h2>
                </div>
                <label className="field compact">
                  <span>Mois</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  />
                </label>
              </div>

              <div className="progress-card">
                <div>
                  <span className="progress-card__label">Objectif mensuel brut</span>
                  <strong>{formatCurrency(MONTHLY_TARGET)}</strong>
                </div>
                <div>
                  <span className="progress-card__label">CA brut du mois</span>
                  <strong>{formatCurrency(dashboard.grossRevenue)}</strong>
                </div>
                <div>
                  <span className="progress-card__label">Objectif restant</span>
                  <strong>{formatCurrency(dashboard.remainingGoal)}</strong>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(dashboard.achievedPercentage, 100)}%` }}
                  />
                </div>
                <p className="progress-copy">{formatNumber(dashboard.achievedPercentage, "% atteint")}</p>
              </div>
            </article>

            <section className="metric-grid">
              <MetricCard label="Net après frais du mois" value={formatCurrency(dashboard.netIncome)} />
              <MetricCard label="Jours travaillés" value={formatInteger(dashboard.activeDays)} />
              <MetricCard label="Heures travaillées" value={formatNumber(dashboard.workedHours, " h")} />
              <MetricCard label="Km roulés" value={formatNumber(dashboard.drivenKm, " km")} />
              <MetricCard
                label="Moyenne brute €/h"
                value={`${formatCurrency(dashboard.averageGrossHourly)}/h`}
              />
              <MetricCard
                label="Moyenne nette €/h"
                value={`${formatCurrency(dashboard.averageNetHourly)}/h`}
              />
              <MetricCard
                label="CA moyen par jour actif"
                value={formatCurrency(dashboard.averageGrossPerActiveDay)}
              />
              <MetricCard
                label="Montant restant par jour prévu"
                value={
                  dashboard.remainingPerPlannedDay === null
                    ? "Planning saturé"
                    : formatCurrency(dashboard.remainingPerPlannedDay)
                }
              />
              <MetricCard
                label="Jours nécessaires à 300 €/jour"
                value={formatInteger(dashboard.daysNeededAt300)}
              />
            </section>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Courses du mois</p>
                  <h2>{formatInteger(monthTrips.length)} course(s)</h2>
                </div>
              </div>

              {monthTrips.length === 0 ? (
                <p className="empty-copy">
                  Aucune course enregistrée pour ce mois. Ajoutez une course pour voir le tableau de bord évoluer.
                </p>
              ) : (
                <div className="trip-list">
                  {monthTrips.map((trip) => (
                    <article key={trip.id} className="trip-row">
                      <div className="trip-row__top">
                        <div>
                          <strong>{trip.date}</strong>
                          <p>
                            {formatCurrency(trip.priceProposed)} • {formatNumber(trip.totalMinutes, " min")} •{" "}
                            {formatNumber(trip.totalKm, " km")}
                          </p>
                        </div>
                        <span className={`decision-chip ${trip.decision}`}>
                          {formatDecisionLabel(trip.decision)}
                        </span>
                      </div>
                      <div className="trip-row__metrics">
                        <span>Net: {formatCurrency(trip.netIncome)}</span>
                        <span>€/h net: {formatCurrency(trip.netHourly)}</span>
                        <span>Écart: {formatCurrency(trip.gap)}</span>
                      </div>
                      {trip.zone || trip.note || trip.comment ? (
                        <p className="trip-row__note">
                          {[trip.zone, trip.note, trip.comment].filter(Boolean).join(" • ")}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "trip" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Nouvelle course</p>
                  <h2>Analyse avant acceptation</h2>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={tripInput.date}
                    onChange={(event) => setTextTripField("date", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Prix proposé (€)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={tripInput.priceProposed}
                    onChange={(event) => setNumericTripField("priceProposed", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Temps approche (min)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={tripInput.approachMinutes}
                    onChange={(event) => setNumericTripField("approachMinutes", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Temps attente (min)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={tripInput.waitMinutes}
                    onChange={(event) => setNumericTripField("waitMinutes", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Temps course (min)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={tripInput.tripMinutes}
                    onChange={(event) => setNumericTripField("tripMinutes", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Km approche</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={tripInput.approachKm}
                    onChange={(event) => setNumericTripField("approachKm", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Km course</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={tripInput.tripKm}
                    onChange={(event) => setNumericTripField("tripKm", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Zone</span>
                  <input
                    type="text"
                    value={tripInput.zone}
                    onChange={(event) => setTextTripField("zone", event.target.value)}
                    placeholder="Aéroport, centre-ville, périphérie..."
                  />
                </label>
                <label className="field">
                  <span>Note</span>
                  <input
                    type="text"
                    value={tripInput.note}
                    onChange={(event) => setTextTripField("note", event.target.value)}
                    placeholder="Heure creuse, client régulier..."
                  />
                </label>
                <label className="field field--full">
                  <span>Commentaire</span>
                  <textarea
                    rows={4}
                    value={tripInput.comment}
                    onChange={(event) => setTextTripField("comment", event.target.value)}
                    placeholder="Détail libre sur la demande, la zone ou la stratégie."
                  />
                </label>
              </div>
            </article>

            <article className={`panel-card panel-card--decision ${tripPreview.decision}`}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Calcul en direct</p>
                  <h2>{formatDecisionLabel(tripPreview.decision)}</h2>
                </div>
                <span className={`decision-chip ${tripPreview.decision}`}>
                  {formatCurrency(tripPreview.netHourly)}/h net
                </span>
              </div>

              <div className="metric-grid">
                <MetricCard label="CA brut de la course" value={formatCurrency(tripPreview.grossRevenue)} />
                <MetricCard label="Temps total" value={formatNumber(tripPreview.totalMinutes, " min")} />
                <MetricCard label="Kilomètres totaux" value={formatNumber(tripPreview.totalKm, " km")} />
                <MetricCard label="Coût carburant" value={formatCurrency(tripPreview.fuelCost)} />
                <MetricCard
                  label="Assurance imputée"
                  value={formatCurrency(tripPreview.insuranceAllocated)}
                />
                <MetricCard
                  label="Entretien provisionné"
                  value={formatCurrency(tripPreview.maintenanceReserved)}
                />
                <MetricCard label="Frais totaux" value={formatCurrency(tripPreview.totalCosts)} />
                <MetricCard label="Net réel" value={formatCurrency(tripPreview.netIncome)} />
                <MetricCard label="€/h brut" value={`${formatCurrency(tripPreview.grossHourly)}/h`} />
                <MetricCard label="€/h net" value={`${formatCurrency(tripPreview.netHourly)}/h`} />
                <MetricCard
                  label="Prix minimum avec frais"
                  value={formatCurrency(tripPreview.minimumPriceWithCosts)}
                />
                <MetricCard label="Écart" value={formatCurrency(tripPreview.gap)} />
              </div>

              <button
                className={`primary-button ${tripPreview.decision}`}
                type="button"
                onClick={handleSaveTrip}
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer la course"}
              </button>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "vehicle" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Réglages véhicule</p>
                  <h2>Frais d'exploitation</h2>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Kilométrage actuel véhicule</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settings.vehicle.currentMileage}
                    onChange={(event) => setNumericVehicleField("currentMileage", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Consommation L/100 km</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings.vehicle.fuelConsumptionPer100Km}
                    onChange={(event) =>
                      setNumericVehicleField("fuelConsumptionPer100Km", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Prix carburant €/L</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.vehicle.fuelPricePerLiter}
                    onChange={(event) => setNumericVehicleField("fuelPricePerLiter", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Assurance mensuelle (€)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.vehicle.monthlyInsurance}
                    onChange={(event) => setNumericVehicleField("monthlyInsurance", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Jours travaillés par mois</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={settings.vehicle.workingDaysPerMonth}
                    onChange={(event) => setNumericVehicleField("workingDaysPerMonth", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Heures travaillées par jour</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={settings.vehicle.workingHoursPerDay}
                    onChange={(event) => setNumericVehicleField("workingHoursPerDay", event.target.value)}
                  />
                </label>
              </div>

              <div className="inline-metrics">
                <div>
                  <strong>Coût entretien actuel</strong>
                  <span>{formatCurrency(maintenanceCostPerKm)}/km</span>
                </div>
                <div>
                  <strong>Assurance par minute</strong>
                  <span>
                    {formatCurrency(
                      settings.vehicle.monthlyInsurance /
                        Math.max(
                          settings.vehicle.workingDaysPerMonth *
                            settings.vehicle.workingHoursPerDay *
                            60,
                          1,
                        ),
                    )}
                    /min
                  </span>
                </div>
              </div>

              <button
                className="primary-button neutral"
                type="button"
                onClick={() => persistSettings("Paramètres véhicule enregistrés.")}
                disabled={saving}
              >
                {saving ? "Sauvegarde..." : "Enregistrer les frais véhicule"}
              </button>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "maintenance" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Entretien véhicule</p>
                  <h2>Provision et alertes</h2>
                </div>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Dernière vidange à quel kilométrage</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settings.maintenance.lastOilChangeKm}
                    onChange={(event) => setNumericMaintenanceField("lastOilChangeKm", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Intervalle vidange</span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={settings.maintenance.oilChangeIntervalKm}
                    onChange={(event) =>
                      setNumericMaintenanceField("oilChangeIntervalKm", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Coût vidange (€)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.maintenance.oilChangeCost}
                    onChange={(event) => setNumericMaintenanceField("oilChangeCost", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Dernier contrôle/changement freins</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settings.maintenance.lastBrakesChangeKm}
                    onChange={(event) =>
                      setNumericMaintenanceField("lastBrakesChangeKm", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Intervalle freins</span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={settings.maintenance.brakesIntervalKm}
                    onChange={(event) => setNumericMaintenanceField("brakesIntervalKm", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Coût freins (€)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.maintenance.brakesCost}
                    onChange={(event) => setNumericMaintenanceField("brakesCost", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Dernier changement pneus</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={settings.maintenance.lastTiresChangeKm}
                    onChange={(event) => setNumericMaintenanceField("lastTiresChangeKm", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Intervalle pneus</span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={settings.maintenance.tiresIntervalKm}
                    onChange={(event) => setNumericMaintenanceField("tiresIntervalKm", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Coût pneus (€)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.maintenance.tiresCost}
                    onChange={(event) => setNumericMaintenanceField("tiresCost", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Entretien divers mensuel (€)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.maintenance.otherMonthlyMaintenance}
                    onChange={(event) =>
                      setNumericMaintenanceField("otherMonthlyMaintenance", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Km estimés par mois</span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={settings.maintenance.estimatedKmPerMonth}
                    onChange={(event) =>
                      setNumericMaintenanceField("estimatedKmPerMonth", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Provision manuelle supplémentaire €/km</span>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={settings.maintenance.extraManualReservePerKm}
                    onChange={(event) =>
                      setNumericMaintenanceField("extraManualReservePerKm", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="metric-grid">
                <MetricCard label="Coût entretien €/km" value={`${formatCurrency(maintenanceCostPerKm)}/km`} />
                <MetricCard
                  label="Prochaine vidange"
                  value={`${formatInteger(settings.maintenance.lastOilChangeKm + settings.maintenance.oilChangeIntervalKm)} km`}
                />
                <MetricCard
                  label="Prochains freins"
                  value={`${formatInteger(settings.maintenance.lastBrakesChangeKm + settings.maintenance.brakesIntervalKm)} km`}
                />
                <MetricCard
                  label="Prochains pneus"
                  value={`${formatInteger(settings.maintenance.lastTiresChangeKm + settings.maintenance.tiresIntervalKm)} km`}
                />
              </div>

              <div className="alerts-grid">
                {maintenanceAlerts.map((alert) => (
                  <article key={alert.label} className={`alert-card ${alert.status}`}>
                    <div>
                      <strong>{alert.label}</strong>
                      <span>{formatInteger(alert.nextKm, " km")}</span>
                    </div>
                    <span className="alert-status">
                      {alert.status === "ok"
                        ? "OK"
                        : alert.status === "bientot"
                          ? "Bientôt"
                          : "À faire maintenant"}
                    </span>
                    <p>Reste {formatInteger(alert.remainingKm, " km")} avant le prochain seuil.</p>
                  </article>
                ))}
              </div>

              <button
                className="primary-button neutral"
                type="button"
                onClick={() => persistSettings("Paramètres d'entretien enregistrés.")}
                disabled={saving}
              >
                {saving ? "Sauvegarde..." : "Enregistrer l'entretien"}
              </button>
            </article>
          </section>
        ) : null}

        {!loading && activeTab === "data" ? (
          <section className="panel-stack">
            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Sauvegarde & ménage</p>
                  <h2>Données locales</h2>
                </div>
              </div>

              <div className="metric-grid">
                <MetricCard label="Courses stockées" value={formatInteger(trips.length)} />
                <MetricCard label={`Courses ${selectedMonth}`} value={formatInteger(monthTrips.length)} />
                <MetricCard label="Mois actif" value={selectedMonth} />
              </div>

              <div className="action-stack">
                <button className="primary-button neutral" type="button" onClick={handleExportJson}>
                  Export JSON complet
                </button>
                <button className="primary-button neutral" type="button" onClick={handleExportCsv}>
                  Export CSV du mois
                </button>
                <button
                  className="primary-button neutral"
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                >
                  Import JSON
                </button>
                <button
                  className="primary-button warning"
                  type="button"
                  onClick={handleDeleteMonthTrips}
                  disabled={saving}
                >
                  Supprimer les courses du mois
                </button>
                <button
                  className="primary-button danger"
                  type="button"
                  onClick={handleClearAllData}
                  disabled={saving}
                >
                  Suppression complète
                </button>
              </div>

              <input
                ref={importInputRef}
                className="hidden-input"
                type="file"
                accept="application/json"
                onChange={handleImportFile}
              />
            </article>

            <article className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PWA & hors ligne</p>
                  <h2>Utilisation sur téléphone</h2>
                </div>
              </div>

              <div className="tips-list">
                <p>Installez l'application depuis le navigateur pour obtenir un raccourci plein écran.</p>
                <p>Le service worker met en cache l'interface après la première ouverture en ligne.</p>
                <p>Les gros boutons et la navigation scrollable sont conçus pour une utilisation rapide en mobilité.</p>
              </div>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
