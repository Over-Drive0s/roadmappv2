import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  FolderKanban,
  Mail,
  Phone,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import { onboardingFieldVariant, onboardingShell } from "../onboarding/onboardingTheme";
import {
  TEAM_DEPARTMENT_OPTIONS,
  TEAM_STATUS_OPTIONS,
  TEAM_STATUS_STYLES,
  buildMemberEmail,
  buildMemberInitials,
  getCurrentUserTeamMemberId,
  getDepartmentLabel,
  getRoadmapProfileContactFields,
  pickMemberColor,
} from "../../data/teamData";
import { resolveAssetUrl } from "../../lib/assetUrl";
import {
  PROFILE_PICTURE_ACCEPT,
  readProfilePictureFile,
} from "../../lib/roadmap/roadmapDisplay";
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  PHONE_INPUT_PLACEHOLDER,
} from "../../lib/roadmap/phoneFormat";
import { useTeam } from "../../context/TeamContext";
import { useRoadmapAuth } from "../../context/RoadmapAuthContext";
import { filterActiveProjects } from "../../lib/projectUtils";
import { lockBodyScroll } from "../../lib/modalBodyLock";

const FIELD = onboardingFieldVariant;

const STEPS = [
  { id: 1, label: "Profile", icon: User },
  { id: 2, label: "Role", icon: Briefcase },
  { id: 3, label: "Availability", icon: Users },
  { id: 4, label: "Project", icon: FolderKanban },
  { id: 5, label: "Review & Add", icon: CheckCircle2 },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const initialForm = () => ({
  profile: {
    selectedProfileId: "",
    name: "",
    email: "",
    phoneNumber: "",
    avatarUrl: "",
  },
  role: {
    title: "",
    department: "engineering",
  },
  availability: {
    status: "available",
    notes: "",
  },
  project: {
    projectId: "",
  },
});

function ReviewSection({ title, icon: Icon, children, className }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <header className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden /> : null}
        <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{title}</h4>
      </header>
      <div className="divide-y divide-slate-100 px-4">{children}</div>
    </section>
  );
}

function ReviewRow({ label, value, multiline = false }) {
  const display = typeof value === "string" ? value.trim() : value;
  const text = display || "—";

  if (multiline) {
    return (
      <div className="py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="max-w-[58%] text-right text-xs font-semibold text-slate-900">{text}</span>
    </div>
  );
}

function ReviewContactChip({ icon: Icon, label, href }) {
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
      <span className="truncate text-xs font-semibold text-slate-800">{label}</span>
    </>
  );

  const className =
    "flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2";

  if (href) {
    return (
      <a href={href} className={cn(className, "transition hover:border-emerald-200 hover:bg-emerald-50/60")}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

function MemberPhotoPreview({ member, size = "lg" }) {
  const sizes = {
    md: "h-12 w-12 text-sm",
    lg: "h-14 w-14 text-base",
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

export default function NewTeamMemberOnboarding({ open, onClose, onAdded, projects = [] }) {
  const { isAdmin, listProfiles } = useRoadmapAuth();
  const { members, addMember } = useTeam();
  const fileInputRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [pictureError, setPictureError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [profileSelectError, setProfileSelectError] = useState("");

  const roadmapProfiles = useMemo(() => (isAdmin ? listProfiles() : []), [isAdmin, listProfiles, open]);

  const availableProfiles = useMemo(() => {
    const onTeamIds = new Set(members.map((member) => member.id));
    return roadmapProfiles.filter(
      (profile) => !onTeamIds.has(getCurrentUserTeamMemberId(profile.id))
    );
  }, [roadmapProfiles, members]);

  const assignableProjects = useMemo(() => filterActiveProjects(projects), [projects]);

  const selectedRoadmapProfile = useMemo(
    () => roadmapProfiles.find((profile) => profile.id === form.profile.selectedProfileId) ?? null,
    [roadmapProfiles, form.profile.selectedProfileId]
  );

  const isProfileLinked = Boolean(isAdmin && selectedRoadmapProfile);

  useEffect(() => {
    if (!open || !isAdmin || !form.profile.selectedProfileId) return;

    const profile = roadmapProfiles.find((item) => item.id === form.profile.selectedProfileId);
    if (!profile) return;

    const contact = getRoadmapProfileContactFields(profile);

    setForm((current) => {
      const roleTitle = contact.role || current.role.title;
      const unchanged =
        current.profile.name === contact.name &&
        current.profile.email === contact.email &&
        current.profile.phoneNumber === contact.phoneNumber &&
        current.profile.avatarUrl === contact.avatarUrl &&
        current.role.title === roleTitle;

      if (unchanged) return current;

      return {
        ...current,
        profile: {
          ...current.profile,
          selectedProfileId: profile.id,
          name: contact.name,
          email: contact.email,
          phoneNumber: contact.phoneNumber,
          avatarUrl: contact.avatarUrl,
        },
        role: {
          ...current.role,
          title: roleTitle,
        },
      };
    });
  }, [open, isAdmin, form.profile.selectedProfileId, roadmapProfiles]);

  const selectedProject = useMemo(
    () => assignableProjects.find((project) => project.id === form.project.projectId) ?? null,
    [assignableProjects, form.project.projectId]
  );

  const linkedProfileContact = useMemo(
    () => (selectedRoadmapProfile ? getRoadmapProfileContactFields(selectedRoadmapProfile) : null),
    [selectedRoadmapProfile]
  );

  useEffect(() => {
    if (!open) {
      setForm(initialForm());
      setStep(1);
      setPictureError("");
      setPhoneError("");
      setProfileSelectError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    return lockBodyScroll();
  }, [open]);

  useEffect(() => {
    bodyScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [step, open]);

  const previewMember = useMemo(() => {
    const name = form.profile.name.trim() || "New Member";
    return {
      name,
      email: buildMemberEmail(name, form.profile.email),
      role: form.role.title.trim() || "Role not set",
      department: form.role.department,
      initials: buildMemberInitials(name),
      color: pickMemberColor(members),
      status: form.availability.status,
      avatarUrl: form.profile.avatarUrl || undefined,
    };
  }, [form, members]);

  const canGoNext =
    step === 1
      ? form.profile.name.trim().length > 0 && isValidPhoneNumber(form.profile.phoneNumber)
      : step === 2
        ? form.role.title.trim().length > 0 && Boolean(form.role.department)
        : true;

  const updateProfile = (field, value) =>
    setForm((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));

  const updateRole = (field, value) =>
    setForm((current) => ({ ...current, role: { ...current.role, [field]: value } }));

  const updateAvailability = (field, value) =>
    setForm((current) => ({
      ...current,
      availability: { ...current.availability, [field]: value },
    }));

  const updateProjectAssignment = (field, value) =>
    setForm((current) => ({
      ...current,
      project: { ...current.project, [field]: value },
    }));

  const handleClose = () => onClose?.();

  const handlePictureSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPictureError("");
    const readResult = await readProfilePictureFile(file);
    if ("error" in readResult) {
      setPictureError(readResult.error);
      return;
    }

    updateProfile("avatarUrl", readResult.dataUrl);
  };

  const handleRemovePicture = () => {
    setPictureError("");
    updateProfile("avatarUrl", "");
  };

  const handlePhoneChange = (event) => {
    setPhoneError("");
    updateProfile("phoneNumber", formatPhoneNumber(event.target.value));
  };

  const handleProfileSelect = (profileId) => {
    setProfileSelectError("");

    if (!profileId) {
      setForm((current) => ({
        ...current,
        profile: {
          selectedProfileId: "",
          name: "",
          email: "",
          phoneNumber: "",
          avatarUrl: "",
        },
      }));
      return;
    }

    const profile = roadmapProfiles.find((item) => item.id === profileId);
    if (!profile) return;

    const contact = getRoadmapProfileContactFields(profile);
    setForm((current) => ({
      ...current,
      profile: {
        selectedProfileId: profileId,
        name: contact.name,
        email: contact.email,
        phoneNumber: contact.phoneNumber,
        avatarUrl: contact.avatarUrl,
      },
      role: {
        ...current.role,
        title: contact.role || current.role.title,
      },
    }));
  };

  const handleSubmit = () => {
    if (form.profile.selectedProfileId && !isAdmin) {
      setProfileSelectError("Only admin can add saved profiles to the team.");
      setStep(1);
      return;
    }

    const formattedPhone = form.profile.phoneNumber.trim()
      ? formatPhoneNumber(form.profile.phoneNumber)
      : "";

    if (!isValidPhoneNumber(formattedPhone)) {
      setPhoneError("Enter a valid phone number.");
      setStep(1);
      return;
    }

    const member = addMember({
      name: form.profile.name,
      email: form.profile.email,
      role: form.role.title,
      department: form.role.department,
      status: form.availability.status,
      notes: form.availability.notes,
      ...(form.profile.selectedProfileId
        ? { id: getCurrentUserTeamMemberId(form.profile.selectedProfileId) }
        : {}),
      ...(form.profile.avatarUrl ? { avatarUrl: form.profile.avatarUrl } : {}),
      ...(formattedPhone ? { phoneNumber: formattedPhone } : {}),
    });

    if (!member) {
      setProfileSelectError("This profile is already on the team.");
      setStep(1);
      return;
    }
    onAdded?.(member, form.project.projectId || null);
    setForm(initialForm());
    setStep(1);
    onClose?.();
  };

  const next = () => {
    if (step === 1 && !isValidPhoneNumber(form.profile.phoneNumber)) {
      setPhoneError("Enter a valid phone number.");
      return;
    }
    setStep((current) => Math.min(current + 1, 5));
  };
  const back = () => setStep((current) => Math.max(current - 1, 1));

  if (!open) return null;

  const statusStyle = TEAM_STATUS_STYLES[previewMember.status];

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className={cn("fixed inset-0", onboardingShell.backdrop)}
        onClick={handleClose}
      />

      <div className="flex min-h-[100dvh] items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
        <div
          role="dialog"
          aria-labelledby="add-team-member-title"
          aria-modal="true"
          className={cn(
            "relative grid w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border",
            "max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]",
            onboardingShell.panel
          )}
        >
          <div className={cn("px-6 py-5", onboardingShell.header)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  Over Drive OS
                </p>
                <h2 id="add-team-member-title" className="mt-0.5 text-lg font-bold text-white">
                  Add Team Member
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-300">
                  Onboard someone to your dashboard in 5 simple steps
                </p>
              </div>
              <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-1">
            {STEPS.map((item, index) => {
              const done = step > item.id;
              const active = step === item.id;
              return (
                <div key={item.id} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition",
                        done
                          ? "bg-emerald-500 text-white"
                          : active
                            ? "bg-emerald-500 text-white ring-4 ring-emerald-400/40"
                            : "bg-slate-700 text-slate-300 ring-1 ring-slate-600"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : item.id}
                    </div>
                    <span
                      className={cn(
                        "hidden text-[9px] font-semibold sm:block",
                        active ? "text-emerald-300" : "text-slate-400"
                      )}
                    >
                      {item.label.split(" ")[0]}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mb-4 h-px flex-1",
                        step > item.id ? "bg-emerald-400" : "bg-slate-600"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          </div>

          <div
            ref={bodyScrollRef}
            className={cn("min-h-0 overflow-y-auto overscroll-contain px-6 py-5", onboardingShell.body)}
          >
          {step === 1 && (
            <div className="space-y-4">
              {isAdmin ? (
                <>
                  <Select
                    variant={FIELD}
                    label="Select user profile"
                    id="memberProfileSelect"
                    value={form.profile.selectedProfileId}
                    onChange={(event) => handleProfileSelect(event.target.value)}
                  >
                    <option value="">Add manually (custom member)</option>
                    {availableProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        @{profile.username} · {profile.workspaceName}
                      </option>
                    ))}
                  </Select>
                  {availableProfiles.length === 0 ? (
                    <p className="text-xs text-slate-600">
                      All local profiles are already on the team. Use manual entry to add someone new.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Choose a saved profile to pre-fill details, or add a custom member manually.
                    </p>
                  )}
                  {profileSelectError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {profileSelectError}
                    </p>
                  ) : null}
                </>
              ) : null}
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-300 bg-white p-4 sm:flex-row sm:items-center">
                <MemberPhotoPreview member={previewMember} />
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                  {!isProfileLinked ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={PROFILE_PICTURE_ACCEPT}
                        className="hidden"
                        onChange={handlePictureSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                      >
                        {form.profile.avatarUrl ? "Change photo" : "Upload photo"}
                      </button>
                      {form.profile.avatarUrl ? (
                        <button
                          type="button"
                          onClick={handleRemovePicture}
                          className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Remove photo
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <p className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                      Photo synced from the selected account profile.
                    </p>
                  )}
                </div>
              </div>
              {isProfileLinked && linkedProfileContact ? (
                <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                  Name, email, and phone are synced from @{linkedProfileContact.username}&apos;s account
                  settings.
                </p>
              ) : null}
              {pictureError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {pictureError}
                </p>
              ) : null}
              <Input
                variant={FIELD}
                label="Full name"
                id="memberName"
                placeholder="e.g. Alex Rivera"
                value={form.profile.name}
                onChange={(e) => updateProfile("name", e.target.value)}
                readOnly={isProfileLinked}
                disabled={isProfileLinked}
                className={isProfileLinked ? "[&_input]:cursor-default [&_input]:bg-slate-100 [&_input]:text-slate-700" : undefined}
              />
              <Input
                variant={FIELD}
                label="Email"
                id="memberEmail"
                type="email"
                placeholder="alex.rivera@overdrive.os"
                value={form.profile.email}
                onChange={(e) => updateProfile("email", e.target.value)}
                readOnly={isProfileLinked}
                disabled={isProfileLinked}
                className={isProfileLinked ? "[&_input]:cursor-default [&_input]:bg-slate-100 [&_input]:text-slate-700" : undefined}
              />
              <Input
                variant={FIELD}
                label="Phone number"
                id="memberPhone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder={PHONE_INPUT_PLACEHOLDER}
                value={form.profile.phoneNumber}
                onChange={handlePhoneChange}
                readOnly={isProfileLinked}
                disabled={isProfileLinked}
                className={isProfileLinked ? "[&_input]:cursor-default [&_input]:bg-slate-100 [&_input]:text-slate-700" : undefined}
              />
              {phoneError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {phoneError}
                </p>
              ) : null}
              {!isAdmin && profileSelectError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {profileSelectError}
                </p>
              ) : null}
              <p className="text-xs text-slate-600">
                {isProfileLinked
                  ? "Update these details from the user’s Account page. They stay in sync while this profile is selected."
                  : "Leave email blank to auto-generate one from their name. Phone is optional."}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Input
                variant={FIELD}
                label="Job title"
                id="memberRole"
                placeholder="e.g. Frontend Engineer"
                value={form.role.title}
                onChange={(e) => updateRole("title", e.target.value)}
              />
              <Select
                variant={FIELD}
                label="Department"
                id="memberDepartment"
                value={form.role.department}
                onChange={(e) => updateRole("department", e.target.value)}
              >
                {TEAM_DEPARTMENT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-900">Status</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TEAM_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateAvailability("status", option.id)}
                      className={cn(
                        "rounded-xl border py-2.5 text-sm font-semibold transition",
                        form.availability.status === option.id
                          ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                          : "border-slate-400 bg-white text-slate-800 hover:bg-slate-50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                variant={FIELD}
                label="Notes (optional)"
                id="memberNotes"
                placeholder="Skills, timezone, focus areas..."
                value={form.availability.notes}
                onChange={(e) => updateAvailability("notes", e.target.value)}
              />
              <p className="text-xs text-slate-600">
                You can assign them to a project on the next step, or leave it blank for now.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Select
                variant={FIELD}
                label="Assign to project (optional)"
                id="memberProject"
                value={form.project.projectId}
                onChange={(event) => updateProjectAssignment("projectId", event.target.value)}
              >
                <option value="">No project — assign later</option>
                {assignableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName}
                  </option>
                ))}
              </Select>

              {assignableProjects.length === 0 ? (
                <p className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                  No active projects yet. Leave this blank and assign the member from a project
                  later.
                </p>
              ) : selectedProject ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                    Selected project
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedProject.projectName}
                  </p>
                  {selectedProject.team?.projectOwner ? (
                    <p className="mt-0.5 text-xs text-slate-600">
                      Owner: {selectedProject.team.projectOwner}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Leave blank if you only want to add them to the team roster for now.
                </p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-emerald-200/80 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-emerald-50 via-white to-white px-4 py-4 sm:px-5">
                  <div className="flex items-start gap-4">
                    <MemberPhotoPreview member={previewMember} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        New team member
                      </p>
                      <h3 className="mt-0.5 text-lg font-bold text-slate-900">{previewMember.name}</h3>
                      <p className="mt-0.5 text-sm font-medium text-slate-600">{previewMember.role}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                            statusStyle.className
                          )}
                        >
                          {statusStyle.label}
                        </span>
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200 ring-inset">
                          {getDepartmentLabel(form.role.department)}
                        </span>
                        {form.profile.selectedProfileId ? (
                          <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200 ring-inset">
                            @
                            {roadmapProfiles.find((p) => p.id === form.profile.selectedProfileId)
                              ?.username ?? "profile"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 border-t border-slate-100 bg-white p-4 sm:grid-cols-2">
                  <ReviewContactChip
                    icon={Mail}
                    label={previewMember.email}
                    href={`mailto:${previewMember.email}`}
                  />
                  <ReviewContactChip
                    icon={Phone}
                    label={
                      form.profile.phoneNumber.trim()
                        ? formatPhoneNumber(form.profile.phoneNumber)
                        : "No phone on file"
                    }
                    href={
                      form.profile.phoneNumber.trim()
                        ? `tel:${form.profile.phoneNumber.replace(/\D/g, "")}`
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewSection title="Role" icon={Briefcase}>
                  <ReviewRow label="Job title" value={form.role.title} />
                  <ReviewRow label="Department" value={getDepartmentLabel(form.role.department)} />
                  <ReviewRow label="Photo" value={form.profile.avatarUrl ? "Uploaded" : "Initials"} />
                </ReviewSection>

                <ReviewSection title="Availability" icon={Users}>
                  <ReviewRow label="Status" value={statusStyle.label} />
                  <ReviewRow label="Starting workload" value="0%" />
                  <ReviewRow
                    label="Notes"
                    value={form.availability.notes.trim() || "None"}
                    multiline={Boolean(form.availability.notes.trim())}
                  />
                </ReviewSection>
              </div>

              <ReviewSection title="Project assignment" icon={FolderKanban}>
                {selectedProject ? (
                  <div className="py-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedProject.projectName}
                      </p>
                      {selectedProject.team?.projectOwner ? (
                        <p className="mt-0.5 text-xs text-slate-600">
                          Owner: {selectedProject.team.projectOwner}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      This member will be added to the project team on submit.
                    </p>
                  </div>
                ) : (
                  <div className="py-3">
                    <p className="text-sm font-medium text-slate-700">No project selected</p>
                    <p className="mt-1 text-xs text-slate-500">
                      They will join the team roster only. Assign projects later from the Team or
                      Projects page.
                    </p>
                  </div>
                )}
              </ReviewSection>

              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-[11px] font-medium text-slate-600">
                Review the details above, then click <span className="font-bold text-emerald-800">Add Member</span> to
                finish.
              </p>
            </div>
          )}
          </div>

          <div className={cn("flex items-center justify-between px-6 py-4", onboardingShell.footer)}>
          <button
            type="button"
            onClick={step === 1 ? handleClose : back}
            className="flex items-center gap-1.5 rounded-xl border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canGoNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:from-emerald-800 hover:to-emerald-700 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400 disabled:opacity-70 disabled:shadow-none"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 hover:from-emerald-800 hover:to-emerald-700"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </button>
          )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
