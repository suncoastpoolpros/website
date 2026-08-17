/**
 * The /admin landing screen once unlocked: pick which document to build.
 * Each builder keeps its own autosaved draft, so switching between them here
 * never disturbs work in progress on the other one.
 */
import { ClipboardList, FileText, ListChecks, LogOut, ArrowRight } from 'lucide-react';
import type { DocKind } from './docKinds';

const CARDS: Array<{ kind: DocKind; title: string; blurb: string; Icon: typeof FileText }> = [
  {
    kind: 'proposal',
    title: 'Service Proposal',
    blurb:
      'Quote a customer. Scope of work, pricing and optional add-on services — they reply “APPROVED” to accept.',
    Icon: FileText,
  },
  {
    kind: 'inspection',
    title: 'First Service & Inspection',
    blurb:
      'After the first visit. Water chemistry, what you did, anything broken or worn, and what you recommend next.',
    Icon: ClipboardList,
  },
  {
    kind: 'quotes',
    title: 'Sent Quotes',
    blurb:
      'Every proposal you’ve sent and what came back — who accepted, which plan they chose, and who hasn’t answered yet.',
    Icon: ListChecks,
  },
];

export const AdminHome = ({
  onPick,
  onLogout,
}: {
  onPick: (kind: DocKind) => void;
  onLogout: () => void;
}) => (
  <div className="min-h-dvh px-4 py-10 md:px-8 md:py-16">
    <div className="mx-auto max-w-5xl">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Documents</h1>
          <p className="mt-1 text-gray-400">Pick what you&apos;re sending the customer.</p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" /> Lock
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ kind, title, blurb, Icon }) => (
          <button
            key={kind}
            onClick={() => onPick(kind)}
            className="glass-panel group rounded-2xl p-6 text-left transition-colors hover:border-brand-blue-light/50"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/15 text-brand-blue-light">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="font-display text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-light">
              Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
