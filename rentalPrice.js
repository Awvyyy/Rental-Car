const MIN_DRIVER_AGE = 18;
const COMPACT_ONLY_MAX_AGE = 21;
const RACER_SURCHARGE_MAX_AGE = 25;
const HIGH_SEASON_MONTH_START = 3; // April (0-based)
const HIGH_SEASON_MONTH_END = 9; // October (0-based)
const LONG_RENTAL_THRESHOLD_DAYS = 10;
const HIGH_SEASON_MULTIPLIER = 1.15;
const LOW_SEASON_LONG_RENTAL_DISCOUNT = 0.9;
const RACER_HIGH_SEASON_MULTIPLIER = 1.5;
const NEW_DRIVER_MULTIPLIER = 1.3;
const NEW_DRIVER_HIGH_SEASON_DAILY_FEE = 15;
const WEEKEND_MULTIPLIER = 1.05;
const DEFAULT_LICENSE_YEARS = 10;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

const CAR_CLASSES = {
  COMPACT: 'Compact',
  ELECTRIC: 'Electric',
  CABRIO: 'Cabrio',
  RACER: 'Racer',
};

const SEASONS = {
  HIGH: 'High',
  LOW: 'Low',
};

const ERRORS = {
  TOO_YOUNG: 'Driver too young - cannot quote the price',
  COMPACT_ONLY: 'Drivers 21 y/o or less can only rent Compact vehicles',
  LICENSE_TOO_NEW: 'Driver license held for less than a year - cannot rent',
};

function price(
  pickup,
  dropoff,
  pickupDateInput,
  dropoffDateInput,
  type,
  age,
  licenseYears = DEFAULT_LICENSE_YEARS,
) {
  const driverAge = Number(age);
  const heldLicenseYears = Number(licenseYears);
  const carClass = getCarClass(type);
  const rentalDates = getRentalDates(pickupDateInput, dropoffDateInput);
  const rentalDays = rentalDates.length;
  const season = getSeason(rentalDates);

  if (driverAge < MIN_DRIVER_AGE) {
    return ERRORS.TOO_YOUNG;
  }

  if (heldLicenseYears < 1) {
    return ERRORS.LICENSE_TOO_NEW;
  }

  if (driverAge <= COMPACT_ONLY_MAX_AGE && carClass !== CAR_CLASSES.COMPACT) {
    return ERRORS.COMPACT_ONLY;
  }

  let rentalPrice = calculateBaseRentalPrice(driverAge, rentalDates);

  if (heldLicenseYears < 2) {
    rentalPrice *= NEW_DRIVER_MULTIPLIER;
  }

  if (
    carClass === CAR_CLASSES.RACER &&
    driverAge <= RACER_SURCHARGE_MAX_AGE &&
    season === SEASONS.HIGH
  ) {
    rentalPrice *= RACER_HIGH_SEASON_MULTIPLIER;
  }

  if (season === SEASONS.HIGH) {
    rentalPrice *= HIGH_SEASON_MULTIPLIER;
  }

  if (rentalDays > LONG_RENTAL_THRESHOLD_DAYS && season === SEASONS.LOW) {
    rentalPrice *= LOW_SEASON_LONG_RENTAL_DISCOUNT;
  }

  if (heldLicenseYears < 3 && season === SEASONS.HIGH) {
    rentalPrice += NEW_DRIVER_HIGH_SEASON_DAILY_FEE * rentalDays;
  }

  return formatPrice(rentalPrice);
}

function calculateBaseRentalPrice(driverAge, rentalDates) {
  return rentalDates.reduce((total, date) => {
    const dailyPrice = isWeekend(date)
      ? driverAge * WEEKEND_MULTIPLIER
      : driverAge;

    return total + dailyPrice;
  }, 0);
}

function getCarClass(type) {
  return Object.values(CAR_CLASSES).includes(type) ? type : 'Unknown';
}

function getRentalDates(pickupDateInput, dropoffDateInput) {
  const pickupDate = parseDateInput(pickupDateInput);
  const dropoffDate = parseDateInput(dropoffDateInput);
  const startTime = Math.min(pickupDate.getTime(), dropoffDate.getTime());
  const endTime = Math.max(pickupDate.getTime(), dropoffDate.getTime());
  const dates = [];

  for (let currentTime = startTime; currentTime <= endTime; currentTime += MS_IN_DAY) {
    dates.push(new Date(currentTime));
  }

  return dates;
}

function parseDateInput(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }

    const parsed = new Date(value);
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }

  throw new Error('Unsupported date input');
}

function getSeason(rentalDates) {
  return rentalDates.some(isHighSeasonDate) ? SEASONS.HIGH : SEASONS.LOW;
}

function isHighSeasonDate(date) {
  const month = date.getUTCMonth();
  return month >= HIGH_SEASON_MONTH_START && month <= HIGH_SEASON_MONTH_END;
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function formatPrice(amount) {
  return `$${Number((Math.round(amount * 100) / 100).toString())}`;
}

module.exports = {
  price,
  calculateBaseRentalPrice,
  getCarClass,
  getRentalDates,
  getSeason,
  isHighSeasonDate,
  isWeekend,
  parseDateInput,
};
