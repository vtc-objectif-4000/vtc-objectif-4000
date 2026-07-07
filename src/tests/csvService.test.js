import { describe, expect, it } from "vitest";
import { serializeCsv } from "@/services/csvService";

describe("serializeCsv", () => {
  it("ajoute le BOM UTF-8, le separateur francais et echappe guillemets et retours ligne", () => {
    const csv = serializeCsv(
      ["Nom", "Note"],
      [["Kone", 'Ligne 1\n"Ligne 2"']],
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Nom";"Note"');
    expect(csv).toContain('"Kone";"Ligne 1\n""Ligne 2"""');
  });
});
