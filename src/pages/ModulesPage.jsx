import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import PriorityBadge from "@/components/PriorityBadge";
import { useAppContext } from "@/context/AppContext";
import { getBeneficiaryById } from "@/services/beneficiaryService";
import { listBeneficiaryModules, updateBeneficiaryModuleStatus } from "@/services/moduleService";
import { toggleBeneficiarySkill } from "@/services/skillService";
import { formatPercent } from "@/utils/formatters";

export default function ModulesPage() {
  const { beneficiaryId } = useParams();
  const { profile } = useAppContext();
  const [beneficiary, setBeneficiary] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadModules() {
    const [beneficiaryData, modulesData] = await Promise.all([
      getBeneficiaryById(beneficiaryId),
      listBeneficiaryModules(beneficiaryId),
    ]);
    setBeneficiary(beneficiaryData);
    setModules(modulesData);
  }

  useEffect(() => {
    let active = true;

    loadModules()
      .catch((loadError) => {
        if (active) {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [beneficiaryId]);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Chargement des modules...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-coral-500">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Modules par beneficiaire</h1>
        <p className="page-subtitle">
          {beneficiary?.first_name} {beneficiary?.last_name}. Les competences restent liees a cette
          fiche et la progression est recalculee automatiquement.
        </p>
      </div>

      <div className="space-y-5">
        {modules.map((moduleItem) => (
          <Card key={moduleItem.id} className="bg-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl">{moduleItem.module?.title}</h2>
                  <PriorityBadge priority={moduleItem.priority} />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {moduleItem.module?.description}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-sand-100">
                  <div
                    className="h-full rounded-full bg-pine-500"
                    style={{ width: `${moduleItem.progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {moduleItem.completedSkills}/{moduleItem.totalSkills} competences validees ·{" "}
                  {formatPercent(moduleItem.progressPercent)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await updateBeneficiaryModuleStatus(moduleItem.id, "en_cours");
                    await loadModules();
                  }}
                >
                  Demarrer
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await updateBeneficiaryModuleStatus(moduleItem.id, "termine");
                    await loadModules();
                  }}
                >
                  Marquer termine
                </Button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {moduleItem.skills.map((skill) => (
                <label
                  key={skill.id}
                  className="flex items-start gap-3 rounded-[22px] border border-sand-100 bg-sand-50 px-4 py-4 text-sm leading-7 text-slate-700"
                >
                  <input
                    checked={skill.validated}
                    type="checkbox"
                    onChange={async (event) => {
                      await toggleBeneficiarySkill({
                        beneficiaryModuleId: moduleItem.id,
                        beneficiaryId,
                        organizationId: profile.organization_id,
                        moduleId: moduleItem.module_id,
                        skillId: skill.id,
                        actorId: profile.id,
                        validated: event.target.checked,
                      });
                      await loadModules();
                    }}
                  />
                  <span>{skill.title}</span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
