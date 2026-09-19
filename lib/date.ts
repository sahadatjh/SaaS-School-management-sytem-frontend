/**
 * Universal date formatting utility for the whole application.
 * Formats dates strictly as dd/mm/yyyy (e.g. 01/01/2024).
 */
export function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "—";

  if (typeof dateInput === "string") {
    // If it's a date string starting with YYYY-MM-DD
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${d}/${m}/${y}`;
    }
  }

  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Converts ISO date (YYYY-MM-DD) to dd/mm/yyyy.
 */
export function isoToDmy(isoDate?: string | null): string {
  if (!isoDate) return "";
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  return "";
}

/**
 * Converts dd/mm/yyyy to ISO date (YYYY-MM-DD).
 */
export function dmyToIso(dmyDate?: string | null): string {
  if (!dmyDate) return "";
  const match = dmyDate.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m}-${d}`;
  }
  return "";
}
