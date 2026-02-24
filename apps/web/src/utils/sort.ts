import { Dataset } from "@/db/api";

// Sort type definitions
export type SortKey = keyof Dataset | null;
export type SortDirection = "asc" | "desc" | "none";

// String comparison function using German locale with numeric sorting
export const compareStrings = (a?: string, b?: string): number => {
  // Handle undefined values
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  
  // Compare strings using locale-aware comparison
  return a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' });
};

// Number comparison function that handles undefined values
export const compareNumbers = (a?: number, b?: number): number => {
  // Handle undefined values
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  
  // Compare numbers
  return a - b;
};

// Dataset comparators for each sortable field
export const comparators: Record<keyof Dataset, (a: Dataset, b: Dataset) => number> = {
  id: (a, b) => compareNumbers(a.id, b.id),
  name: (a, b) => compareStrings(a.name, b.name),
  unit: (a, b) => compareStrings(a.unit, b.unit),
  valueCO2e: (a, b) => compareNumbers(a.valueCO2e, b.valueCO2e),
  source: (a, b) => compareStrings(a.source, b.source),
  year: (a, b) => compareNumbers(a.year, b.year),
  geo: (a, b) => compareStrings(a.geo, b.geo),
  kind: (a, b) => compareStrings(a.kind, b.kind),
  methodId: (a, b) => compareNumbers(a.methodId, b.methodId),
  method: () => 0 // Not sortable directly
};

// Get the next sort direction in the cycle: none -> asc -> desc -> none
export function getNextSortDirection(current: SortDirection): SortDirection {
  switch (current) {
    case "none": return "asc";
    case "asc": return "desc";
    case "desc": return "none";
    default: return "none";
  }
}

// Stable sort function for datasets
export function stableSort<T>(
  array: T[], 
  sortKey: keyof T | null, 
  sortDirection: SortDirection,
  compareFn: Record<keyof T, (a: T, b: T) => number>
): T[] {
  if (!sortKey || sortDirection === "none") return array;
  
  const directionMultiplier = sortDirection === "asc" ? 1 : -1;
  
  // Create array with indexes for stable sort
  const indexedArray = array.map((item, index) => ({ item, index }));
  
  // Sort with preserved original order for tie-breaks
  indexedArray.sort((a, b) => {
    const compare = compareFn[sortKey](a.item, b.item) * directionMultiplier;
    return compare !== 0 ? compare : a.index - b.index;
  });
  
  // Return just the sorted items
  return indexedArray.map(({ item }) => item);
}
