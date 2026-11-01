import { Check } from 'lucide-react';

/*
 * A static preview of the visit report: header, readings, status, one photo
 * and what else the report holds. For a page's body (Clearwater's standard
 * section). The hero's VisitReportCard is the animated cousin; its markup is
 * driven by the visit-report scripts and can't take props, hence this one.
 *
 * "Serviced by Alex" mirrors the real report, which names whoever did that
 * visit. One visit's record, not a promise of a permanent tech.
 */

export type ReportPreviewProps = {
  /** e.g. "Sand Key · Tue, 10:14 AM · Serviced by Alex" */
  meta: string;
  readings: { label: string; value: string }[];
  /** The line in the green pill, after "Water balanced". */
  status: string;
  photo: { src: string; srcSet?: string; alt: string; width: number; height: number };
  tags: string[];
  className?: string;
};

export const ReportPreviewCard = ({ meta, readings, status, photo, tags, className = '' }: ReportPreviewProps) => (
  <div
    className={`rounded-[22px] bg-white p-[22px] shadow-[0_0_0_1px_rgba(36,58,85,0.08),0_30px_60px_-30px_rgba(15,23,42,0.45)] ${className}`}
  >
    <div className="flex items-center gap-3">
      <img src="/icon-mark.svg" alt="" width={34} height={22} loading="lazy" className="h-[22px] w-[34px] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold leading-tight text-sc-navy">Visit complete</p>
        <p className="mt-0.5 text-[12.5px] text-sc-muted">{meta}</p>
      </div>
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#0e9f57] text-white">
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    </div>

    <dl className="mt-4 grid grid-cols-4 divide-x divide-sc-navy/[0.07] rounded-[12px] bg-sc-mist py-3">
      {readings.map((r) => (
        <div key={r.label} className="min-w-0 px-3">
          <dt className="truncate text-[11px] text-sc-muted">{r.label}</dt>
          <dd className="mt-0.5 text-[17px] font-bold leading-tight tabular-nums text-sc-navy">{r.value}</dd>
        </div>
      ))}
    </dl>

    {/* Text a shade darker than the dot: #0e9f57 on the tint is 3.2:1. */}
    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e9f9ef] px-3 py-1 text-[12.5px] font-semibold text-[#0b7a42]">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#0e9f57]" />
      Water balanced · {status}
    </p>

    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes="(min-width: 960px) 376px, 100vw"
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      className="mt-3 h-[150px] w-full rounded-[12px] object-cover"
    />

    <ul className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li key={t} className="rounded-full px-2.5 py-1 text-[12px] font-medium text-sc-navy/80 ring-1 ring-sc-navy/[0.12]">
          {t}
        </li>
      ))}
    </ul>

    <p className="mt-4 border-t border-sc-navy/[0.08] pt-3.5 text-[12.5px] text-sc-muted">
      Sent to you before we leave your driveway
    </p>
  </div>
);
