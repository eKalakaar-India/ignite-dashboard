export function generateBatchId(stateCode, date, districtCode) {
  let dateObj = new Date(date);
  const year = dateObj.getFullYear().toString().slice(-2);
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const datetoday = dateObj.getDate().toString().padStart(2, '0');
  const state = stateCode.slice(0, 3);
  const district = districtCode.slice(0, 3);

  return `BAT-${state.toUpperCase()}${district.toUpperCase()}-${year}${month}${datetoday}`;
}