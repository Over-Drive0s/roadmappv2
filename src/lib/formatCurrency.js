export function formatUsdBudget(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(digits));
}

export function parseUsdBudgetInput(input) {
  return formatUsdBudget(input);
}
