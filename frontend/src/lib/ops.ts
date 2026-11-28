"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { useAuthToken } from "@/lib/useAuthToken";

export type DirectionHub = {
  students: number;
  teachers: number;
  enrollments: number;
  pending_requests: number;
  avg_score: number | null;
  pass_rate: number | null;
  finance: { due_count: number; due_amount: number; paid_count: number; paid_amount: number };
  absences: number;
  evaluations_count: number;
  evaluations_avg: number | null;
  pv_count: number;
  exams_upcoming: number;
  partners: number;
  international: {
    students: number;
    share_pct: number;
    countries: number;
    alumni_abroad: number;
  };
  by_faculty: { faculty: string; total: number }[];
};

export type OpsHub = {
  pending_requests: number;
  in_progress_requests: number;
  active_enrollments: number;
  payments_due: number;
  payments_due_amount: number;
  upcoming_exams: number;
  internships_open: number;
  scholarships_active: number;
  cohorts: number;
  schedule_slots: number;
  absences: number;
  announcements: number;
  students: number;
  unread_staff_notifications: number;
};

export function useDirectionHub() {
  const { token, ready } = useAuthToken();
  const [hub, setHub] = useState<DirectionHub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!ready || !token) return;
    try {
      setHub(await apiGet<DirectionHub>("/direction/hub/", token));
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

export function useOpsHub() {
  const { token, ready } = useAuthToken();
  const [hub, setHub] = useState<OpsHub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!ready || !token) return;
    try {
      setHub(await apiGet<OpsHub>("/ops/hub/", token));
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
