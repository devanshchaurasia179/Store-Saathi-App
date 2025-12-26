/**
 * Format time like WhatsApp chat
 * Examples:
 * 09:05 AM
 * 6:42 PM
 */
export function formatTime(dateInput: string | Date): string {
  if (!dateInput) return "";

  const date =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) return "";

  let hours = date.getHours();
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${paddedMinutes} ${ampm}`;
}
