import Select from "../ui/Select";
import { onboardingFieldVariant } from "./onboardingTheme";

const FIELD = onboardingFieldVariant;

export default function PhaseMemberSelect({
  members,
  value = "",
  onChange,
  label = "Assigned Team Member",
  id,
  workloadByMemberId = {},
}) {
  return (
    <Select
      variant={FIELD}
      label={label}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Unassigned</option>
      {members.map((member) => {
        const workload = workloadByMemberId[member.id];
        const suffix =
          workload != null && workload > 0 ? ` · ${workload}% workload` : "";
        return (
          <option key={member.id} value={member.id}>
            {member.name}
            {suffix}
          </option>
        );
      })}
    </Select>
  );
}
