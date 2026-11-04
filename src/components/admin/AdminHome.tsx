/**
 * The /admin landing screen once unlocked: pick which document to build.
 * Each builder keeps its own autosaved draft, so switching between them here
 * never disturbs work in progress on the other one.
 */
import { Building2, ClipboardList, FileText, House, ListChecks, ArrowRight } from 'lucide-react';
import type { DocKind } from './docKinds';
import { AdminBody, AdminHeader, PageHead, cardClass } from './adminKit';

const CARDS: Array<{ kind: DocKind; title: string; blurb: string; Icon: typeof FileText }> = [
  {
    kind: 'proposal',
    title: 'Service Proposal',
    // Accepting has not been "reply APPROVED" since the quote moved to a link
    // with a typed signature — this blurb was describing a flow that no longer
    // exists, on the card you press to start it.
    blurb:
      'Quote a homeowner. Scope of work, pricing and optional add-ons — they open a link and sign to accept.',
    Icon: FileText,
  },
  {
    kind: 'commercial',
    title: 'Commercial Bid',
    blurb:
      'Quote an HOA, condo or property manager. Each body of water priced by frequency, with the scope and terms a board reads before the price.',
    Icon: Building2,
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
  {
    kind: 'leads',
    title: 'New Homeowner Leads',
    blurb:
      'Recently sold homes with a pool near an address you pick, narrowed by distance and sale price. Shows when it last ran.',
    Icon: House,
  },
];

export const AdminHome = ({
  onPick,
  onLogout,
}: {
  onPick: (kind: DocKind) => void;
  onLogout: () => void;
}) => (
  <>
    <AdminHeader onLogout={onLogout} />
    <AdminBody>
      <PageHead eyebrow="Suncoast admin" title="Documents and tools" lead="Pick what you’re working on." />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ kind, title, blurb, Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onPick(kind)}
            className={`${cardClass} group flex flex-col p-6 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sc-blue`}
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-[12px] bg-[#eef5fb] text-sc-blue">
              <Icon className="h-6 w-6" strokeWidth={2} />
            </span>
            <h2 className="text-[18px] font-[650] tracking-[-0.02em] text-sc-navy">{title}</h2>
            <p className="mt-2 flex-1 text-[14.5px] leading-[1.6] text-sc-navy/70">{blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-sc-blue">
              Open{' '}
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-[3px]" strokeWidth={2.5} />
            </span>
          </button>
        ))}
      </div>
    </AdminBody>
  </>
);
