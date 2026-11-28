"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, Page, unwrapList } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";

export type TeacherAssignment = {
  id: string;
  subject: string;
  subject_name: string;
  academic_year: string;
  program_id?: string;
};

export type TeacherStudent = {
  id: string;
  student_number: string | null;
  full_name: string;
  program: string | null;
};

export function useTeacherAssignments() {
  const { token, ready } = useAuthToken();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!ready || !token) return;
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        apiGet<Page<TeacherAssignment>>("/teaching-assignments/?page_size=100", token),
        apiGet<Page<TeacherStudent>>("/students/?page_size=500", token),
      ]);
      setAssignments(unwrapList(a));
      setStudents(unwrapList(s));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [ready, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { token, ready, assignments, students, error, loading, reload };
}

export function studentsForAssignment(
  students: TeacherStudent[],
  assignment?: TeacherAssignment | null,
) {
  if (!assignment?.program_id) return students;
  return students.filter((s) => !s.program || s.program === assignment.program_id);
}

export const OFFLINE_QUEUE_KEY = "iua_teacher_offline_queue";

export type OfflineGradeOp = {
  id: string;
  at: string;
  payload: Record<string, unknown>;
  method: "POST" | "PATCH";
  path: string;
};

export function readOfflineQueue(): OfflineGradeOp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]") as OfflineGradeOp[];
  } catch {
    return [];
  }
}

export function writeOfflineQueue(ops: OfflineGradeOp[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(ops));
}

export function enqueueOffline(op: Omit<OfflineGradeOp, "id" | "at">) {
  const ops = readOfflineQueue();
  ops.push({ ...op, id: crypto.randomUUID(), at: new Date().toISOString() });
  writeOfflineQueue(ops);
}
