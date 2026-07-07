import { describe, expect, it } from "vitest";
import { generatePathwayPlan } from "@/services/pathwayService";

describe("generatePathwayPlan", () => {
  it("regroupe plusieurs axes dans un meme module en gardant la priorite la plus forte", () => {
    const result = generatePathwayPlan({
      french_oral: 2,
      reading: 3,
      writing: 4,
      work: 2,
      smartphone_email: 3,
    });

    expect(result.assignedModules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleCode: "francais-quotidien",
          priority: "prioritaire",
        }),
        expect.objectContaining({
          moduleCode: "travail-insertion",
          priority: "prioritaire",
        }),
        expect.objectContaining({
          moduleCode: "numerique-demarches",
          priority: "recommande",
        }),
      ]),
    );

    const frenchModule = result.assignedModules.find(
      (item) => item.moduleCode === "francais-quotidien",
    );
    expect(frenchModule.sourceAxes).toEqual(
      expect.arrayContaining(["Francais oral", "Lecture"]),
    );
  });

  it("range les scores 4 et 5 dans les modules deja acquis", () => {
    const result = generatePathwayPlan({
      public_services: 5,
      children_school: 4,
    });

    expect(result.assignedModules).toHaveLength(0);
    expect(result.acquiredModules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moduleCode: "autonomie-administrative" }),
        expect.objectContaining({ moduleCode: "parents-ecole" }),
      ]),
    );
  });
});
