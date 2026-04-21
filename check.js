const assert = require('assert');
const { price } = require('./rentalPrice');

function norm(val) {
  if (typeof val !== 'string' || !val.startsWith('$')) return val;
  const n = parseFloat(val.slice(1));
  return isNaN(n) ? val : `$${n}`;
}

function test(name, fn) {
  try {
    fn();
    console.log('✓', name);
  } catch (error) {
    console.error('✗', name);
    console.error(error.message);
    process.exitCode = 1;
  }
}

test('supports all four car classes', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 10)), '$30');
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Electric', 30, 10)), '$30');
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Cabrio', 30, 10)), '$30');
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Racer', 30, 10)), '$30');
});

test('drivers under 18 cannot rent', () => {
  assert.equal(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 17, 10), 'Driver too young - cannot quote the price');
});

test('drivers aged 18-21 can only rent Compact', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 21, 10)), '$21');
  assert.equal(price('A', 'B', '2024-02-12', '2024-02-12', 'Electric', 21, 10), 'Drivers 21 y/o or less can only rent Compact vehicles');
});

test('racer surcharge: age 25 or less in high season gets +50%', () => {
  assert.equal(norm(price('A', 'B', '2024-06-10', '2024-06-10', 'Racer', 25, 10)), '$43.13');
});

test('racer surcharge does not apply in low season', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Racer', 25, 10)), '$25');
});

test('high season (April-October) adds 15%', () => {
  assert.equal(norm(price('A', 'B', '2024-04-15', '2024-04-15', 'Compact', 100, 10)), '$115');
  assert.equal(norm(price('A', 'B', '2024-10-15', '2024-10-15', 'Compact', 100, 10)), '$115');
});

test('low season (November-March) has no 15% increase', () => {
  assert.equal(norm(price('A', 'B', '2024-03-18', '2024-03-18', 'Compact', 100, 10)), '$100');
  assert.equal(norm(price('A', 'B', '2024-11-18', '2024-11-18', 'Compact', 100, 10)), '$100');
});

test('more than 10 days in low season gets 10% discount', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-22', 'Compact', 100, 10)), '$999');
});

test('more than 10 days in high season does not get 10% discount', () => {
  assert.equal(norm(price('A', 'B', '2024-06-10', '2024-06-20', 'Compact', 100, 10)), '$1276.5');
});

test('minimum daily price equals driver age', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 37, 10)), '$37');
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-14', 'Compact', 37, 10)), '$111');
});

test('driver with less than one year license cannot rent', () => {
  assert.equal(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 0.5), 'Driver license held for less than a year - cannot rent');
});

test('driver with one year license can rent', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 1)), '$39');
});

test('driver with less than two years license gets +30%', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 1.5)), '$39');
});

test('driver with two years license does not get +30%', () => {
  assert.equal(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 2)), '$30');
});

test('driver with less than three years license gets +15 euros/day in high season', () => {
  assert.equal(norm(price('A', 'B', '2024-06-10', '2024-06-12', 'Compact', 30, 2.5)), '$148.5');
});

test('weekday-only rental keeps regular pricing', () => {
  assert.equal(norm(price('A', 'B', '2024-01-08', '2024-01-10', 'Compact', 50, 10)), '$150');
});

test('README example: Thursday-Friday-Saturday totals $152.50', () => {
  assert.equal(norm(price('A', 'B', '2024-01-11', '2024-01-13', 'Compact', 50, 10)), '$152.5');
});

test('Friday-Saturday-Sunday applies weekend increase for two days', () => {
  assert.equal(norm(price('A', 'B', '2024-01-12', '2024-01-14', 'Compact', 50, 10)), '$155');
});
