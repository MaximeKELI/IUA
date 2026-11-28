"use client";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { apiGet, apiSend, unwrapList } from "@/lib/api";
import type { Page } from "@/lib/api";
import { studentNav } from "@/lib/navigation";
import { useAuthToken } from "@/lib/useAuthToken";
type Q = { id: string; prompt: string; choices: {id:string;text:string}[]; points: string };
type Quiz = { id: string; title: string; subject_name?: string; duration_minutes: number; questions?: Q[] };
export default function Page() {
  const { token, ready } = useAuthToken();
  const [items, setItems] = useState<Quiz[]>([]);
  const [active, setActive] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!ready||!token) return; apiGet<Page<Quiz>>("/student/quizzes/?page_size=50", token).then(d=>setItems(unwrapList(d))).catch(e=>setError(e instanceof Error?e.message:"Erreur")); }, [ready,token]);
  async function submit() {
    if (!token || !active) return;
    try {
      const res = await apiSend<{score:string; max_score:string}>(`/student/quizzes/${active.id}/attempt/`, token, "POST", { answers });
      setResult(`Score : ${res.score}/${res.max_score}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Échec"); }
  }
  return (
    <PortalShell title="Espace étudiant" nav={studentNav}>
      <h1 className="font-display text-3xl text-iua-navy">QCM</h1>
      <p className="mt-2 text-sm text-iua-muted">Quiz auto-corrigés publiés par vos enseignants.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {result && <p className="mt-4 text-sm text-emerald-700">{result}</p>}
      {!active ? (
        <ul className="mt-8 space-y-3">{items.map(q => (
          <li key={q.id} className="flex items-center justify-between rounded-xl bg-white p-5 shadow-soft">
            <div><h2 className="font-display text-xl text-iua-navy">{q.title}</h2><p className="text-xs text-iua-muted">{q.subject_name} · {q.duration_minutes} min · {q.questions?.length||0} questions</p></div>
            <button type="button" onClick={()=>{setActive(q); setAnswers({}); setResult(null);}} className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white">Passer</button>
          </li>
        ))}</ul>
      ) : (
        <div className="mt-8 space-y-4 rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-display text-2xl text-iua-navy">{active.title}</h2>
          {(active.questions||[]).map((q,i)=>(
            <div key={q.id} className="border-t border-iua-navy/10 pt-4">
              <p className="font-medium text-iua-navy">{i+1}. {q.prompt}</p>
              <div className="mt-2 space-y-1">{(q.choices||[]).map(c=>(
                <label key={c.id} className="flex items-center gap-2 text-sm"><input type="radio" name={q.id} checked={answers[q.id]===c.id} onChange={()=>setAnswers(a=>({...a,[q.id]:c.id}))} />{c.text}</label>
              ))}</div>
            </div>
          ))}
          <div className="flex gap-3"><button type="button" onClick={()=>void submit()} className="rounded-md bg-iua-sun px-4 py-2 text-sm font-semibold text-iua-navy">Valider</button>
          <button type="button" onClick={()=>setActive(null)} className="text-sm text-iua-muted">Retour</button></div>
        </div>
      )}
    </PortalShell>
  );
}
