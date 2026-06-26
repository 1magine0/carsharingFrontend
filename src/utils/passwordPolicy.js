/* Single source of truth for the client-side password policy. Mirrors the backend
   (RegisterRequest / ResetPasswordRequest: min 8 chars + at least one digit).
   Kept in a plain module (no component export) so the rules can be shared by the
   PasswordRequirements checklist and the auth forms without tripping react-refresh. */

export const PASSWORD_RULES = [
  { id: "len", test: (v) => v.length >= 8, label: "Хоча б 8 символів" },
  { id: "digit", test: (v) => /\d/.test(v), label: "Хоча б 1 цифра" },
];

/* True only when every rule passes — used by forms to gate submission. */
export function isPasswordValid(value) {
  const v = value ?? "";
  return PASSWORD_RULES.every((r) => r.test(v));
}
