export function currency(num) {
  const n = parseFloat(num); // Using parseFloat to allow for decimal numbers
  return n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}