/** Grade helpers — averages & appreciations for teacher gradebook */

export const GRADE_COLUMNS = [
  { kind: "interro", label: "Interro", short: "INT", weight: 1, max: 20 },
  { kind: "devoir", label: "Devoir", short: "DEV", weight: 1.5, max: 20 },
  { kind: "tp", label: "TP", short: "TP", weight: 1, max: 20 },
  { kind: "exam", label: "Examen", short: "EXA", weight: 2, max: 20 },
] as const;

export type GradeKind = (typeof GRADE_COLUMNS)[number]["kind"];

export type Appreciation = {
  code: string;
  label: string;
  tone: "excellent" | "good" | "fair" | "weak" | "fail" | "empty";
};

export function scoreOn20(score: number, maxScore: number): number | null {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return null;
  return (score / maxScore) * 20;
}

export function computeWeightedAverage(
  cells: Partial<Record<GradeKind, { score: number; max: number }>>,
): number | null {
  let weighted = 0;
  let totalWeight = 0;
  for (const col of GRADE_COLUMNS) {
    const cell = cells[col.kind];
    if (!cell) continue;
    const on20 = scoreOn20(cell.score, cell.max);
    if (on20 === null) continue;
    weighted += on20 * col.weight;
    totalWeight += col.weight;
  }
  if (totalWeight === 0) return null;
  return Math.round((weighted / totalWeight) * 100) / 100;
}

export function appreciationFor(average: number | null): Appreciation {
  if (average === null) {
    return { code: "—", label: "En attente", tone: "empty" };
  }
  if (average >= 16) return { code: "A+", label: "Excellent", tone: "excellent" };
  if (average >= 14) return { code: "A", label: "Très bien", tone: "excellent" };
  if (average >= 12) return { code: "B", label: "Bien", tone: "good" };
  if (average >= 10) return { code: "C", label: "Assez bien", tone: "fair" };
  if (average >= 8) return { code: "D", label: "Passable", tone: "weak" };
  return { code: "E", label: "Insuffisant", tone: "fail" };
}

export function appreciationClass(tone: Appreciation["tone"]): string {
  switch (tone) {
    case "excellent":
      return "bg-emerald-50 text-emerald-800";
    case "good":
      return "bg-sky-50 text-sky-800";
    case "fair":
      return "bg-amber-50 text-amber-800";
    case "weak":
      return "bg-orange-50 text-orange-800";
    case "fail":
      return "bg-red-50 text-red-700";
    default:
      return "bg-iua-mist text-iua-muted";
  }
}

export const kindLabels: Record<string, string> = {
  interro: "Interrogation",
  devoir: "Devoir",
  cc: "Contrôle continu",
  exam: "Examen",
  tp: "Travaux pratiques",
  other: "Autre",
};
