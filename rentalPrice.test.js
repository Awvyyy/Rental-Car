const {
  price,
  getCarClass,
  getRentalDates,
  getSeason,
  isHighSeasonDate,
  isWeekend,
  parseDateInput,
} = require('./rentalPrice');

function norm(value) {
  if (typeof value !== 'string' || !value.startsWith('$')) {
    return value;
  }

  return `$${parseFloat(value.slice(1))}`;
}

describe('Rental price calculator', () => {
  describe('current business requirements', () => {
    test('supports all four car classes', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 10))).toBe('$30');
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Electric', 30, 10))).toBe('$30');
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Cabrio', 30, 10))).toBe('$30');
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Racer', 30, 10))).toBe('$30');
    });

    test('drivers under 18 cannot rent', () => {
      expect(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 17, 10)).toBe(
        'Driver too young - cannot quote the price',
      );
    });

    test('drivers aged 18-21 can only rent Compact', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 21, 10))).toBe('$21');
      expect(price('A', 'B', '2024-02-12', '2024-02-12', 'Electric', 21, 10)).toBe(
        'Drivers 21 y/o or less can only rent Compact vehicles',
      );
    });

    test('racer surcharge in high season is 50%', () => {
      expect(norm(price('A', 'B', '2024-06-10', '2024-06-10', 'Racer', 25, 10))).toBe('$43.13');
    });

    test('racer surcharge does not apply in low season', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Racer', 25, 10))).toBe('$25');
    });

    test('high season runs from April through October', () => {
      expect(norm(price('A', 'B', '2024-04-15', '2024-04-15', 'Compact', 100, 10))).toBe('$115');
      expect(norm(price('A', 'B', '2024-10-15', '2024-10-15', 'Compact', 100, 10))).toBe('$115');
    });

    test('low season runs from November through March', () => {
      expect(norm(price('A', 'B', '2024-03-18', '2024-03-18', 'Compact', 100, 10))).toBe('$100');
      expect(norm(price('A', 'B', '2024-11-18', '2024-11-18', 'Compact', 100, 10))).toBe('$100');
    });

    test('more than 10 days in low season gets 10% discount', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-22', 'Compact', 100, 10))).toBe('$999');
    });

    test('more than 10 days in high season does not get low season discount', () => {
      expect(norm(price('A', 'B', '2024-06-10', '2024-06-20', 'Compact', 100, 10))).toBe('$1276.5');
    });

    test('minimum daily price equals driver age', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 37, 10))).toBe('$37');
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-14', 'Compact', 37, 10))).toBe('$111');
    });
  });

  describe('task 1 new requirements', () => {
    test('driver with less than one year license cannot rent', () => {
      expect(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 0.5)).toBe(
        'Driver license held for less than a year - cannot rent',
      );
    });

    test('driver with one year license can rent', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 1))).toBe('$39');
    });

    test('driver with less than two years license gets 30% increase', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 1.5))).toBe('$39');
    });

    test('driver with two years license does not get 30% increase', () => {
      expect(norm(price('A', 'B', '2024-02-12', '2024-02-12', 'Compact', 30, 2))).toBe('$30');
    });

    test('driver with less than three years license gets 15 euros per day in high season', () => {
      expect(norm(price('A', 'B', '2024-06-10', '2024-06-12', 'Compact', 30, 2.5))).toBe('$148.5');
    });
  });

  describe('task 3 weekday and weekend pricing', () => {
    test('weekday-only rental keeps regular pricing', () => {
      expect(norm(price('A', 'B', '2024-01-08', '2024-01-10', 'Compact', 50, 10))).toBe('$150');
    });

    test('README example Thursday-Friday-Saturday totals 152.5', () => {
      expect(norm(price('A', 'B', '2024-01-11', '2024-01-13', 'Compact', 50, 10))).toBe('$152.5');
    });

    test('Friday-Saturday-Sunday applies weekend increase for two days', () => {
      expect(norm(price('A', 'B', '2024-01-12', '2024-01-14', 'Compact', 50, 10))).toBe('$155');
    });
  });

  describe('helper functions', () => {
    test('unknown car class is marked as Unknown', () => {
      expect(getCarClass('Monster Truck')).toBe('Unknown');
    });

    test('rental dates are inclusive and order independent', () => {
      expect(getRentalDates('2024-01-10', '2024-01-12')).toHaveLength(3);
      expect(getRentalDates('2024-01-12', '2024-01-10')).toHaveLength(3);
    });

    test('season helper detects low and high season correctly', () => {
      expect(getSeason(getRentalDates('2024-02-12', '2024-02-14'))).toBe('Low');
      expect(getSeason(getRentalDates('2024-06-10', '2024-06-12'))).toBe('High');
    });

    test('high season helper treats April as high season', () => {
      expect(isHighSeasonDate(parseDateInput('2024-04-01'))).toBe(true);
      expect(isHighSeasonDate(parseDateInput('2024-03-31'))).toBe(false);
    });

    test('weekend helper detects Saturday and Sunday', () => {
      expect(isWeekend(parseDateInput('2024-01-13'))).toBe(true);
      expect(isWeekend(parseDateInput('2024-01-14'))).toBe(true);
      expect(isWeekend(parseDateInput('2024-01-15'))).toBe(false);
    });

    test('parser accepts timestamp input from Date.parse', () => {
      const parsedDate = parseDateInput(Date.parse('2024-02-12'));
      expect(parsedDate.toISOString()).toBe('2024-02-12T00:00:00.000Z');
    });
  });
});
