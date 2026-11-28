"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";

export type StudentHub = {
  avg_score: number | null;
  ects: { earned: number; total: number; pct: number };
  finance: { due_count: number; due_amount: number; paid_count: number };
  absences: number;
  open_homeworks: number;
  unread_notifications: number;
  clubs_joined: number;
  upcoming_exams: number;
};

export function useStudentHub() {
  const { token, ready } = useAuthToken();
  const [hub, setHub] = useState<StudentHub | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!ready || !token) return;
    try {
      setHub(await apiGet<StudentHub>("/student/hub/", token));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }, [ready, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { token, ready, hub, error, reload };
}

export const STUDENT_OFFLINE_KEY = "iua_student_offline_notes";

export function readStudentOfflineNotes(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STUDENT_OFFLINE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeStudentOfflineNotes(data: unknown[]) {
  localStorage.setItem(STUDENT_OFFLINE_KEY, JSON.stringify(data));
}
