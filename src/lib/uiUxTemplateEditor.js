import { UI_UX_ROADMAP_TEMPLATE } from "../data/uiUxRoadmapTemplate";

export function cloneUiUxTemplate() {
  return structuredClone(UI_UX_ROADMAP_TEMPLATE);
}

function newStepId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function countTemplateSteps(template) {
  return template.reduce(
    (sum, phase) =>
      sum + phase.sections.reduce((sectionSum, section) => sectionSum + section.questions.length, 0),
    0
  );
}

export function countFilledTemplateSteps(template) {
  return template.reduce(
    (sum, phase) =>
      sum +
      phase.sections.reduce(
        (sectionSum, section) =>
          sectionSum + section.questions.filter((question) => question.text?.trim()).length,
        0
      ),
    0
  );
}

export function addTemplateStep(template, phaseId, sectionId) {
  return template.map((phase) => {
    if (phase.phaseId !== phaseId) return phase;
    return {
      ...phase,
      sections: phase.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          questions: [
            ...section.questions,
            { id: newStepId(), text: "", suggestion: false },
          ],
        };
      }),
    };
  });
}

export function removeTemplateStep(template, phaseId, sectionId, questionId) {
  return template.map((phase) => {
    if (phase.phaseId !== phaseId) return phase;
    return {
      ...phase,
      sections: phase.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          questions: section.questions.filter((question) => question.id !== questionId),
        };
      }),
    };
  });
}

export function updateTemplateStepText(template, phaseId, sectionId, questionId, text) {
  return template.map((phase) => {
    if (phase.phaseId !== phaseId) return phase;
    return {
      ...phase,
      sections: phase.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          questions: section.questions.map((question) =>
            question.id === questionId ? { ...question, text } : question
          ),
        };
      }),
    };
  });
}
