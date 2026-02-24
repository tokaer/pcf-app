// Unit conversion functions
export function convertAmount(amount: number, fromUnit: string, toUnit: string): number {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) return amount;

  // Handle specific conversions
  if (fromUnit === "t" && toUnit === "kg") {
    return amount * 1000; // 1 t = 1000 kg
  }
  if (fromUnit === "MJ" && toUnit === "kWh") {
    return amount * 0.277778; // 1 MJ = 0.277778 kWh
  }

  // Log unhandled unit conversions
  console.warn(`Unhandled unit conversion: ${fromUnit} to ${toUnit}`);
  return amount;
}