"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("IUA UI error", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-iua-mist px-6 text-center text-iua-navy">
          <p className="text-xs uppercase tracking-[0.18em] text-iua-cyan">Erreur</p>
          <h1 className="font-display text-3xl">Une erreur est survenue</h1>
          <p className="max-w-md text-sm text-iua-muted">
            Rechargez la page. Si le problème continue, contactez le support Digital Campus.
          </p>
          <button
            type="button"
            className="rounded-md bg-iua-navy px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Recharger
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
