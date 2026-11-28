/** Grade helpers — averages, appreciations, CSV, configurable columns */

export type GradeKind = "interro" | "devoir" | "tp" | "exam" | "cc" | "other";

export type ColumnDef = {
  key: string;
  kind: GradeKind;
  label: string;
  short: string;
  weight: number;
  max: number;
  sequence: number;
};

export const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "interro-1", kind: "interro", label: "Interro 1", short: "INT1", weight: 1, max: 20, sequence: 1 },
  { key: "devoir-1", kind: "devoir", label: "Devoir 1", short: "DEV1", weight: 1.5, max: 20, sequence: 1 },
  { key: "tp-1", kind: "tp", label: "TP", short: "TP", weight: 1, max: 20, sequence: 1 },
  { key: "exam-1", kind: "exam", label: "Examen", short: "EXA", weight: 2, max: 20, sequence: 1 },
];

/** Keep legacy export name used by older imports */
export const GRADE_COLUMNS = DEFAULT_COLUMNS;

export type EntryStatus = "scored" | "absent" | "excused" | "dispensed" | "ungraded";

export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
  scored: "Noté",
  absent: "Absent",
  excused: "Excusé",
  dispensed: "Dispensé",
  ungraded: "Non noté",
};

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
  cells: Partial<Record<string, { score: number; max: number; weight?: number; status?: EntryStatus }>>,
  columns: ColumnDef[] = DEFAULT_COLUMNS,
): number | null {
  let weighted = 0;
  let totalWeight = 0;
  for (const col of columns) {
    const cell = cells[col.key] || cells[col.kind];
    if (!cell) continue;
    if (cell.status && cell.status !== "scored") continue;
    const on20 = scoreOn20(cell.score, cell.max);
    if (on20 === null) continue;
    const w = cell.weight ?? col.weight;
    weighted += on20 * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return null;
  return Math.round((weighted / totalWeight) * 100) / 100;
}

export function appreciationFor(average: number | null): Appreciation {
  if (average === null) return { code: "—", label: "En attente", tone: "empty" };
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

export function buildColumnsFromScheme(scheme?: {
  interro_weight?: number | string;
  devoir_weight?: number | string;
  tp_weight?: number | string;
  exam_weight?: number | string;
  max_score_default?: number | string;
  interro_count?: number;
  devoir_count?: number;
} | null): ColumnDef[] {
  if (!scheme) return DEFAULT_COLUMNS;
  const max = Number(scheme.max_score_default ?? 20);
  const cols: ColumnDef[] = [];
  const interroN = Math.max(1, Number(scheme.interro_count ?? 1));
  const devoirN = Math.max(1, Number(scheme.devoir_count ?? 1));
  for (let i = 1; i <= interroN; i += 1) {
    cols.push({
      key: `interro-${i}`,
      kind: "interro",
      label: interroN > 1 ? `Interro ${i}` : "Interro",
      short: `INT${i}`,
      weight: Number(scheme.interro_weight ?? 1),
      max,
      sequence: i,
    });
  }
  for (let i = 1; i <= devoirN; i += 1) {
    cols.push({
      key: `devoir-${i}`,
      kind: "devoir",
      label: devoirN > 1 ? `Devoir ${i}` : "Devoir",
      short: `DEV${i}`,
      weight: Number(scheme.devoir_weight ?? 1.5),
      max,
      sequence: i,
    });
  }
  cols.push({
    key: "tp-1",
    kind: "tp",
    label: "TP",
    short: "TP",
    weight: Number(scheme.tp_weight ?? 1),
    max,
    sequence: 1,
  });
  cols.push({
    key: "exam-1",
    kind: "exam",
    label: "Examen",
    short: "EXA",
    weight: Number(scheme.exam_weight ?? 2),
    max,
    sequence: 1,
  });
  return cols;
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function gradesToCsv(
  rows: {
    number: string;
    name: string;
    cells: Record<string, string>;
    average: string;
    appreciation: string;
  }[],
  columns: ColumnDef[],
): string {
  const header = ["Matricule", "Nom", ...columns.map((c) => c.label), "Moyenne", "Appreciation"];
  const lines = [header.join(";")];
  for (const row of rows) {
    lines.push(
      [
        row.number,
        `"${row.name.replace(/"/g, '""')}"`,
        ...columns.map((c) => row.cells[c.key] ?? ""),
        row.average,
        row.appreciation,
      ].join(";"),
    );
  }
  return "\uFEFF" + lines.join("\n");
}

export function parseGradesCsv(text: string): { number: string; scores: Record<string, string> }[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(";").map((h) => h.trim().toLowerCase());
  const matIdx = header.findIndex((h) => h.includes("matricule") || h === "number");
  const result: { number: string; scores: Record<string, string> }[] = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(";");
    const number = (parts[matIdx >= 0 ? matIdx : 0] || "").replace(/"/g, "").trim();
    if (!number) continue;
    const scores: Record<string, string> = {};
    header.forEach((h, i) => {
      if (i === matIdx || h.includes("nom") || h.includes("moyenne") || h.includes("appreciation")) return;
      scores[h] = (parts[i] || "").trim();
    });
    result.push({ number, scores });
  }
  return result;
}
