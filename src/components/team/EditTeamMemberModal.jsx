import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Save, X } from "lucide-react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import { onboardingFieldVariant } from "../onboarding/onboardingTheme";
import { resolveAssetUrl } from "../../lib/assetUrl";
import {
  TEAM_DEPARTMENT_OPTIONS,
  TEAM_STATUS_OPTIONS,
  buildMemberInitials,
  pickMemberColor,
} from "../../data/teamData";
import {
  PROFILE_PICTURE_ACCEPT,
  readProfilePictureFile,
} from "../../lib/roadmap/roadmapDisplay";
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  PHONE_INPUT_PLACEHOLDER,
} from "../../lib/roadmap/phoneFormat";
import { lockBodyScroll } from "../../lib/modalBodyLock";
import { useTeam } from "../../context/TeamContext";

const FIELD = onboardingFieldVariant;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function memberToForm(member) {
  return {
    name: member?.name ?? "",
    email: member?.email ?? "",
    phoneNumber: member?.phoneNumber ? formatPhoneNumber(member.phoneNumber) : "",
    avatarUrl: member?.avatarUrl ?? "",
    role: member?.role ?? "",
    department: member?.department ?? "engineering",
    status: member?.status ?? "available",
    notes: member?.notes ?? "",
  };
}

function MemberPhotoPreview({ member, avatarUrl }) {
  const preview = {
    name: member?.name ?? "Member",
    initials: buildMemberInitials(member?.name ?? "Member"),
    color: member?.color ?? pickMemberColor([]),
    avatarUrl,
  };

  if (preview.avatarUrl) {
    return (
      <img
        src={resolveAssetUrl(preview.avatarUrl)}
        alt={preview.name}
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ring-2 ring-white"
      style={{ backgroundColor: preview.color }}
    >
      {preview.initials}
    </div>
  );
}

export default function EditTeamMemberModal({ member, open, onClose, onSaved }) {
  const { updateMember } = useTeam();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => memberToForm(member));
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pictureError, setPictureError] = useState("");

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

  useEffect(() => {
    if (open && member) {
      setForm(memberToForm(member));
      setError("");
      setPhoneError("");
      setPictureError("");
    }
  }, [open, member]);

  if (!open || !member) return null;

  const isCurrentUser = Boolean(member.isCurrentUser);
  const canEditIdentity = !isCurrentUser;

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

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

    updateField("avatarUrl", readResult.dataUrl);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setPhoneError("");

    const formattedPhone = form.phoneNumber.trim() ? formatPhoneNumber(form.phoneNumber) : "";
    if (!isValidPhoneNumber(formattedPhone)) {
      setPhoneError("Enter a valid phone number.");
      return;
    }

    if (!form.role.trim()) {
      setError("Job title is required.");
      return;
    }

    if (canEditIdentity && !form.name.trim()) {
      setError("Full name is required.");
      return;
    }

    const updated = updateMember(member.id, {
      ...(canEditIdentity
        ? {
            name: form.name,
            email: form.email,
            avatarUrl: form.avatarUrl,
          }
        : {}),
      role: form.role,
      department: form.department,
      status: form.status,
      notes: form.notes,
      phoneNumber: formattedPhone,
    });

    if (!updated) {
      setError("Could not save changes.");
      return;
    }

    onSaved?.(updated);
    onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] overflow-y-auto">
      <button
        type="button"
        aria-label="Close edit member"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <form
          role="dialog"
          aria-labelledby="edit-team-member-title"
          onSubmit={handleSubmit}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 id="edit-team-member-title" className="text-lg font-bold text-slate-900">
                Edit team member
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {isCurrentUser
                  ? "Update your team profile. Name and photo sync from Account settings."
                  : "Update member details for your workspace team."}
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
          </header>

          <div className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto px-6 py-5">
            {canEditIdentity ? (
              <>
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <MemberPhotoPreview member={member} avatarUrl={form.avatarUrl} />
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row">
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
                      {form.avatarUrl ? "Change photo" : "Upload photo"}
                    </button>
                    {form.avatarUrl ? (
                      <button
                        type="button"
                        onClick={() => updateField("avatarUrl", "")}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                </div>
                {pictureError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {pictureError}
                  </p>
                ) : null}
                <Input
                  variant={FIELD}
                  label="Full name"
                  id="editMemberName"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
                <Input
                  variant={FIELD}
                  label="Email"
                  id="editMemberEmail"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <MemberPhotoPreview member={member} avatarUrl={member.avatarUrl} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
            )}

            <Input
              variant={FIELD}
              label="Phone number"
              id="editMemberPhone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder={PHONE_INPUT_PLACEHOLDER}
              value={form.phoneNumber}
              onChange={(event) => {
                setPhoneError("");
                updateField("phoneNumber", formatPhoneNumber(event.target.value));
              }}
            />
            {phoneError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {phoneError}
              </p>
            ) : null}

            <Input
              variant={FIELD}
              label="Job title"
              id="editMemberRole"
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
            />

            <Select
              variant={FIELD}
              label="Department"
              id="editMemberDepartment"
              value={form.department}
              onChange={(event) => updateField("department", event.target.value)}
            >
              {TEAM_DEPARTMENT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-900">Status</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {TEAM_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateField("status", option.id)}
                    className={cn(
                      "rounded-xl border py-2.5 text-sm font-semibold transition",
                      form.status === option.id
                        ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
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
              id="editMemberNotes"
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Save className="h-4 w-4" />
              Save changes
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
