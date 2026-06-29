// ===========================================================================
// Propose-a-question screen (UGC). A signed-in user submits a question prompt +
// sport; the server generates the answer/options in the background and an admin
// approves it into the bank. The user sees only their own submissions + status.
// ===========================================================================

import { useEffect, useState } from 'react';
import { proposeQuestion, getMyProposals, type MyProposal } from '../lib/api';

interface Props {
  onHome: () => void;
}

const SPORTS = ['Basketball', 'Football', 'Baseball', 'Hockey', 'Golf', 'Soccer', 'Fighting'];

const STATUS_LABEL: Record<MyProposal['status'], string> = {
  pending: 'Pending review',
  generated: 'Awaiting approval',
  approved: 'Added to the bank ✓',
  rejected: 'Not accepted',
  failed: 'Needs another look',
};

export default function PlayPropose({ onHome }: Props) {
  const [prompt, setPrompt] = useState('');
  const [sport, setSport] = useState(SPORTS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mine, setMine] = useState<MyProposal[] | null>(null);

  async function refresh() {
    try {
      setMine(await getMyProposals());
    } catch {
      /* non-fatal for the form */
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !prompt.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await proposeQuestion(prompt.trim(), sport);
      setNotice(res.message ?? 'Submitted for review.');
      setPrompt('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <header className="brand">
        <h1 className="brand-title">
          Propose a<span className="accent"> question</span>
        </h1>
        <p className="brand-tag">Suggest a question — we'll generate the answer and review it.</p>
      </header>

      <form className="card auth-card" onSubmit={onSubmit}>
        <label className="auth-field">
          <span className="label">Your question</span>
          <textarea
            className="fib-input"
            rows={3}
            maxLength={300}
            placeholder="e.g. Which country won the first FIFA World Cup?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </label>

        <label className="auth-field">
          <span className="label">Sport</span>
          <select className="fib-input" value={sport} onChange={(e) => setSport(e.target.value)}>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit question'}
        </button>
      </form>

      {mine && mine.length > 0 && (
        <section className="group-section">
          <div className="group-section-head">Your submissions</div>
          {mine.map((p) => (
            <div key={p.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{p.prompt}</span>
                <span className="tag tag-sport" style={{ whiteSpace: 'nowrap' }}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              {p.rejection_reason && (
                <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 14 }}>
                  {p.rejection_reason}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      <button className="btn btn-ghost" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}
