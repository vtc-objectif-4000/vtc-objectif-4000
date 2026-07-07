import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listBeneficiaryOptions } from "@/services/beneficiaryService";

export default function BeneficiarySelector() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const nextOptions = await listBeneficiaryOptions();
        if (!active) {
          return;
        }
        setOptions(nextOptions);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-w-[240px]">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Selection rapide
      </label>
      <select
        className="w-full rounded-2xl border-none bg-white/90 text-sm font-medium text-pine-900 shadow-sm ring-1 ring-pine-100"
        value={selectedId}
        disabled={loading}
        onChange={(event) => {
          const beneficiaryId = event.target.value;
          setSelectedId(beneficiaryId);
          if (beneficiaryId) {
            navigate(`/app/beneficiaries/${beneficiaryId}`);
          }
        }}
      >
        <option value="">{loading ? "Chargement..." : "Ouvrir une fiche beneficiaire"}</option>
        {options.map((beneficiary) => (
          <option key={beneficiary.id} value={beneficiary.id}>
            {beneficiary.last_name} {beneficiary.first_name}
          </option>
        ))}
      </select>
    </div>
  );
}
