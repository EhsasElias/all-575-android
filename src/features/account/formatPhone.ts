const SAUDI_MOBILE = /^\+966(5\d)(\d{3})(\d{4})$/;

/** "+966512345678" becomes "+966 51 234 5678". Anything else is shown exactly as the server has it. */
export function formatPhone(phone: string): string {
  const match = SAUDI_MOBILE.exec(phone);
  return match ? `+966 ${match[1]} ${match[2]} ${match[3]}` : phone;
}
