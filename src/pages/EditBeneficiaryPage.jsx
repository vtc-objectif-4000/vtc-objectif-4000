import { useParams } from "react-router-dom";
import NewBeneficiaryPage from "./NewBeneficiaryPage";

export default function EditBeneficiaryPage() {
  const { beneficiaryId } = useParams();

  return <NewBeneficiaryPage beneficiaryId={beneficiaryId} isEditMode />;
}
