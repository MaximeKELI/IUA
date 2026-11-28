"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, clearApiMemoryCache, Page, unwrapList } from "@/lib/api";
import { teacherNav } from "@/lib/navigation";
import { useTeacherAssignments } from "@/lib/teacher";

type Quiz = {
  id: string;
  title: string;
  subject: string;
  subject_name?: string;
  is_published: boolean;
  duration_minutes: number;
  attempts_count?: number;
  questions?: { id: string; prompt: string }[];
};

export default function QcmPage() {
  const { token, ready, assignments } = useTeacherAssignments();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [form, setForm] = useState({
    subject: "",
    title: "",
    description: "",
    duration_minutes: 15,
    passing_score: "10",
    is_published: true,
  });
  const [question, setQuestion] = useState({
    quizId: "",
    prompt: "",
    a: "",
    b: "",
    c: "",
    d: "",
    correct: "a",
    points: "1",
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function reload() {
    if (!token) return;
    setQuizzes(unwrapList(await apiGet<Page<Quiz>>("/quizzes/?page_size=50", token)));
  }

  useEffect(() => {
    if (ready && token) void reload().catch((e) => setError(String(e.message || e)));
    if (!form.subject && assignments[0]) setForm((f) => ({ ...f, subject: assignments[0].subject }));
  }, [ready, token, assignments]);

  async function createQuiz(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const created = await apiSend<Quiz>("/quizzes/", token, "POST", form);
      clearApiMemoryCache();
      setOk("QCM créé.");
      setQuestion((q) => ({ ...q, quizId: created.id }));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  async function addQuestion(e: FormEvent) {
    e.preventDefault();
    if (!token || !question.quizId) return;
    try {
      await apiSend(`/quizzes/${question.quizId}/add_question/`, token, "POST", {
        prompt: question.prompt,
        choices: [
          { id: "a", text: question.a },
          { id: "b", text: question.b },
          { id: "c", text: question.c },
          { id: "d", text: question.d },
        ],
        correct_choice_id: question.correct,
        points: question.points,
      });
      setOk("Question ajoutée (correction automatique).");
      setQuestion((q) => ({ ...q, prompt: "", a: "", b: "", c: "", d: "" }));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    }
  }

  return (
    <PortalShell title="Espace enseignant" nav={teacherNav}>
      <h1 className="font-display text-3xl text-iua-navy">QCM / Quiz auto-corrigés</h1>
      <p className="mt-2 text-sm text-iua-muted">Créez des questionnaires à choix multiples avec score automatique.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-4 text-sm text-emerald-700">{ok}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={createQuiz} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Nouveau quiz</h2>
          <select
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.subject}>
                {a.subject_name}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Titre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            rows={3}
          />
          <button type="submit" className="rounded-md bg-iua-navy px-4 py-2.5 text-sm font-semibold text-white">
            Créer
          </button>
        </form>

        <form onSubmit={addQuestion} className="space-y-3 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-xl text-iua-navy">Ajouter une question</h2>
          <select
            required
            value={question.quizId}
            onChange={(e) => setQuestion({ ...question, quizId: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="">Choisir un quiz…</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
          <textarea
            required
            placeholder="Énoncé"
            value={question.prompt}
            onChange={(e) => setQuestion({ ...question, prompt: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            rows={2}
          />
          {(["a", "b", "c", "d"] as const).map((k) => (
            <input
              key={k}
              required
              placeholder={`Choix ${k.toUpperCase()}`}
              value={question[k]}
              onChange={(e) => setQuestion({ ...question, [k]: e.target.value })}
              className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
            />
          ))}
          <select
            value={question.correct}
            onChange={(e) => setQuestion({ ...question, correct: e.target.value })}
            className="w-full rounded-md border border-iua-navy/15 px-3 py-2 text-sm"
          >
            <option value="a">Bonne réponse : A</option>
            <option value="b">Bonne réponse : B</option>
            <option value="c">Bonne réponse : C</option>
            <option value="d">Bonne réponse : D</option>
          </select>
          <button type="submit" className="rounded-md bg-iua-sun px-4 py-2.5 text-sm font-semibold text-iua-navy">
            Ajouter la question
          </button>
        </form>
      </div>

      <ul className="mt-8 space-y-3">
        {quizzes.map((q) => (
          <li key={q.id} className="rounded-xl bg-white p-5 shadow-soft">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-iua-navy">{q.title}</h2>
                <p className="text-xs text-iua-muted">
                  {q.subject_name} · {q.duration_minutes} min · {q.questions?.length ?? 0} question(s)
                </p>
              </div>
              <p className="text-sm text-iua-muted">{q.attempts_count ?? 0} tentative(s)</p>
            </div>
          </li>
        ))}
      </ul>
    </PortalShell>
  );
}
