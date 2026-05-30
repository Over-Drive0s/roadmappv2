import { Plus, Sparkles, Trash2 } from "lucide-react";
import Input from "../ui/Input";
import PhaseMemberSelect from "./PhaseMemberSelect";
import { onboardingFieldVariant } from "./onboardingTheme";

const FIELD = onboardingFieldVariant;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function UiUxTemplateForm({
  template,
  activePhaseId,
  onPhaseChange,
  onAddStep,
  onRemoveStep,
  onUpdateStepText,
  onGenerate,
  generateError,
  isGenerating,
  members = [],
  phaseAssignees = {},
  onPhaseAssigneeChange,
  workloadByMemberId = {},
}) {
  const activePhase =
    template.find((phase) => phase.phaseId === activePhaseId) ?? template[0];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
        <p className="text-xs font-semibold text-indigo-900">
          OverDrive OS — 4 Phase Development Roadmap
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-indigo-800/80">
          Add, edit, or remove steps in each phase. Assign a team member per phase, then click
          Generate to build your project roadmap with tasks pre-filled across all four phases.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {template.map((phase) => {
          const active = phase.phaseId === activePhase.phaseId;
          const total = phase.sections.reduce((sum, section) => sum + section.questions.length, 0);

          return (
            <button
              key={phase.phaseId}
              type="button"
              onClick={() => onPhaseChange(phase.phaseId)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition",
                active
                  ? "border-indigo-700 bg-indigo-100 text-indigo-950"
                  : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
              )}
            >
              <p className="text-[11px] font-bold">{phase.phaseLabel}</p>
              <p className="text-[10px] text-slate-500">
                {total} step{total !== 1 ? "s" : ""}
              </p>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">{activePhase.phaseLabel}</h4>
          <p className="mt-0.5 text-xs text-slate-600">{activePhase.phaseSummary}</p>
        </div>

        <PhaseMemberSelect
          id={`${activePhase.phaseId}-assignee`}
          label="Phase Team Member"
          members={members}
          value={phaseAssignees[activePhase.phaseId] ?? ""}
          onChange={(memberId) => onPhaseAssigneeChange(activePhase.phaseId, memberId)}
          workloadByMemberId={workloadByMemberId}
        />

        {activePhase.sections.map((section) => (
          <div
            key={section.id}
            className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm"
          >
            <h5 className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-800">
              {section.title}
            </h5>

            {section.questions.length > 0 ? (
              <ul className="space-y-2">
                {section.questions.map((question, index) => (
                  <li key={question.id} className="flex items-start gap-2">
                    <span className="pt-2.5 text-xs font-bold text-slate-500">{index + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <Input
                        variant={FIELD}
                        id={question.id}
                        value={question.text}
                        onChange={(e) =>
                          onUpdateStepText(
                            activePhase.phaseId,
                            section.id,
                            question.id,
                            e.target.value
                          )
                        }
                        placeholder="Step title…"
                        aria-label={`Step ${index + 1}`}
                      />
                      {question.suggestion ? (
                        <p className="mt-1 text-[10px] font-medium text-violet-600">Suggested</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onRemoveStep(activePhase.phaseId, section.id, question.id)
                      }
                      className="mt-1.5 rounded-lg border border-slate-300 p-2 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove step ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No steps yet. Add one below.</p>
            )}

            <button
              type="button"
              onClick={() => onAddStep(activePhase.phaseId, section.id)}
              className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 px-3 py-2 text-xs font-semibold text-indigo-800 transition hover:border-indigo-400 hover:bg-indigo-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </button>
          </div>
        ))}
      </div>

      {generateError ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {generateError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/20 transition hover:from-violet-800 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        Generate project from template
      </button>
    </div>
  );
}
