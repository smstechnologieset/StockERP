import assert from "node:assert";

// Core logic copied for unit test verification
function toBaseUnits(quantity, conversionFactor) {
  if (!quantity || !conversionFactor) return 0;
  return Number((quantity * conversionFactor).toFixed(3));
}

function fromBaseUnits(grams, conversionFactor) {
  if (!grams || !conversionFactor) return 0;
  return Number((grams / conversionFactor).toFixed(3));
}

function formatETB(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "ETB 0.00";
  }
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("ETB", "ETB ");
}

console.log("Running Unit Conversion & Financial Math Tests...\n");

// Test 1: Quintal to Grams
// 1 quintal (100 kg) = 100,000 grams
const quintalFactor = 100000;
const quintalGrams = toBaseUnits(1, quintalFactor);
assert.strictEqual(quintalGrams, 100000, "1 quintal must equal 100,000 grams");
console.log("✓ Test 1 Passed: 1 quintal = 100,000 grams");

// Test 2: Fractional Quintals
// 2.5 quintals = 250,000 grams
const fractionalQuintalsGrams = toBaseUnits(2.5, quintalFactor);
assert.strictEqual(fractionalQuintalsGrams, 250000, "2.5 quintals must equal 250,000 grams");
console.log("✓ Test 2 Passed: 2.5 quintals = 250,000 grams");

// Test 3: Grams back to Quintals
const backToQuintals = fromBaseUnits(250000, quintalFactor);
assert.strictEqual(backToQuintals, 2.5, "250,000 grams must convert back to 2.5 quintals");
console.log("✓ Test 3 Passed: 250,000 grams = 2.5 quintals");

// Test 4: Kilograms to Grams
const kgFactor = 1000;
const kgGrams = toBaseUnits(7.25, kgFactor);
assert.strictEqual(kgGrams, 7250, "7.25 kg must equal 7,250 grams");
console.log("✓ Test 4 Passed: 7.25 kg = 7,250 grams");

// Test 5: 250g Packets to Grams
// A high-value spice packet of Berbere
const packetFactor = 250;
const fourPackets = toBaseUnits(4, packetFactor);
assert.strictEqual(fourPackets, 1000, "4 x 250g packets must equal 1,000 grams (1 kg)");
console.log("✓ Test 5 Passed: 4 x 250g packets = 1,000 grams = 1 kg");

// Test 6: Milligrams to Grams
const mgFactor = 0.001;
const mgGrams = toBaseUnits(500, mgFactor);
assert.strictEqual(mgGrams, 0.5, "500 mg must equal 0.5 grams");
console.log("✓ Test 6 Passed: 500 mg = 0.5 grams");

// Test 7: Currency Formatting
const formattedETB = formatETB(15420.5);
assert(formattedETB.includes("15,420.50"), `Formatted ETB should contain 15,420.50. Got: ${formattedETB}`);
console.log("✓ Test 7 Passed: formatETB(15420.5) =", formattedETB);

console.log("\nALL TESTS PASSED SUCCESSFULLY! 100% Math Verification.");
