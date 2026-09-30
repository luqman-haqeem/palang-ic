/** The local calendar date as yyyy-mm-dd.
 *
 *  Built from local getters, never `toISOString()`: in UTC+8 the UTC date is
 *  yesterday for the first eight hours of every day, and the palang's date is
 *  what makes SAHAJA checkable by the recipient. */
export function isoToday(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
