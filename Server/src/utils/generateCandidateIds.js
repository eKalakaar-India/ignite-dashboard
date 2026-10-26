export function generateCandidateId(sequence) {
  const now = new Date();

  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `CARP-${year}${month}-${String(sequence).padStart(6, "0")}`;
}