import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Briefcase, Mail, Pencil, Phone, Trash2, X } from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl";
import { stripPhoneDigits } from "../../lib/roadmap/phoneFormat";
import {
  TEAM_STATUS_STYLES,
  getDepartmentLabel,
  getWorkloadTone,
} from "../../data/teamData";
import { getProjectStageColor } from "../../lib/projectUtils";
import { lockBodyScroll } from "../../lib/modalBodyLock";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function MemberAvatar({ member, size = "lg" }) {
  const sizes = {
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  if (member.avatarUrl) {
    return (
      <img
        src={resolveAssetUrl(member.avatarUrl)}
        alt={member.name}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", sizes[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white",
        sizes[size]
      )}
      style={{ backgroundColor: member.color }}
    >
      {member.initials}
    </div>
  );
}

function ContactLink({ icon: Icon, href, label, tone = "emerald" }) {
  const tones = {
    emerald: "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200",
    slate: "text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200",
  };

  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
        tones[tone]
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}

export default function TeamMemberDetailModal({
  member,
  open,
  onClose,
  onEdit,
  onDelete,
  assignedProjects = [],
  workload = 0,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    return lockBodyScroll();
  }, [open]);

  if (!open || !member) return null;

  const status = TEAM_STATUS_STYLES[member.status];
  const workloadTone = getWorkloadTone(workload);
  const phoneDigits = member.phoneNumber ? stripPhoneDigits(member.phoneNumber) : "";

  return createPortal(
    <div className="fixed inset-0 z-[110] overflow-y-auto">
      <button
        type="button"
        aria-label="Close member details"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-labelledby="team-member-detail-title"
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white px-6 pb-5 pt-6">
            <div className="flex items-start gap-4">
              <MemberAvatar member={member} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="team-member-detail-title" className="text-lg font-bold text-slate-900">
                    {member.name}
                  </h2>
                  {member.isCurrentUser ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
                      You
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">{member.role}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {getDepartmentLabel(member.department)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Contact</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <ContactLink
                  icon={Mail}
                  href={`mailto:${member.email}`}
                  label={member.email}
                />
                {phoneDigits ? (
                  <ContactLink
                    icon={Phone}
                    href={`tel:${phoneDigits}`}
                    label={member.phoneNumber}
                    tone="slate"
                  />
                ) : (
                  <p className="text-sm text-slate-400">No phone number on file</p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Workload</span>
                <span className={cn("normal-case", workloadTone.label === "High load" && "text-red-600")}>
                  {workload}% · {workloadTone.label}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full transition-all", workloadTone.bar)}
                  style={{ width: `${workload}%` }}
                />
              </div>
            </div>

            {member.notes ? (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Notes</p>
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  {member.notes}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <Briefcase className="h-3.5 w-3.5" />
                Active projects ({assignedProjects.length})
              </p>
              {assignedProjects.length === 0 ? (
                <p className="text-sm italic text-slate-400">Not assigned to active projects</p>
              ) : (
                <ul className="space-y-1.5">
                  {assignedProjects.map((project) => {
                    const color = getProjectStageColor(project);
                    const isOwner = project.team?.projectOwner === member.name;

                    return (
                      <li
                        key={project.id}
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                          {project.projectName}
                        </span>
                        {isOwner ? (
                          <span className="shrink-0 text-[10px] font-semibold text-emerald-600">
                            Owner
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            {!member.isCurrentUser && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(member)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <span />
            )}
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            ) : null}
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
