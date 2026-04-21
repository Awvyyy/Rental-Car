const MIN_DRIVER_AGE = 18;
const COMPACT_ONLY_MAX_AGE = 21;
const RACER_SURCHARGE_MAX_AGE = 25;
const HIGH_SEASON_MONTH_START = 3;
const HIGH_SEASON_MONTH_END = 9;
const LONG_RENTAL_THRESHOLD_DAYS = 10;
const HIGH_SEASON_MULTIPLIER = 1.15;
const LOW_SEASON_LONG_RENTAL_DISCOUNT = 0.9;
const RACER_HIGH_SEASON_MULTIPLIER = 1.5;
const NEW_DRIVER_MULTIPLIER = 1.3;
const NEW_DRIVER_HIGH_SEASON_DAILY_FEE = 15;
const WEEKEND_MULTIPLIER = 1.05;
const DEFAULT_LICENSE_YEARS = 10;
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const CAR_CLASSES = {
  COMPACT: "Compact",
  ELECTRIC: "Electric",
  CABRIO: "Cabrio",
  RACER: "Racer"
};

const SEASONS = {
  HIGH: "High",
  LOW: "Low"
};

const ERRORS = {
  TOO_YOUNG: "Driver too young - cannot quote the price",
  COMPACT_ONLY: "Drivers 21 y/o or less can only rent Compact vehicles",
  LICENSE_TOO_NEW: "Driver license held for less than a year - cannot rent"
};

function price(
  pickup,
  dropoff,
  pickupDateInput,
  dropoffDateInput,
  type,
  age,
  licenseYears = DEFAULT_LICENSE_YEARS
) {
  const driverAge = Number(age);
  const heldLicenseYears = Number(licenseYears);
  const rentalDates = getRentalDates(pickupDateInput, dropoffDateInput);
  const rentalDays = rentalDates.length;
  const carClass = getCarClass(type);
  const season = getSeason(rentalDates);
  const eligibilityError = getEligibilityError(
    driverAge,
    heldLicenseYears,
    carClass
  );

  if (eligibilityError) {
    return eligibilityError;
  }

  let totalPrice = calculateBaseRentalPrice(driverAge, rentalDates);

  totalPrice = applyNewDriverMultiplier(totalPrice, heldLicenseYears);
  totalPrice = applyRacerSurcharge(totalPrice, carClass, driverAge, season);
  totalPrice = applySeasonalIncrease(totalPrice, season);
  totalPrice = applyLongRentalDiscount(totalPrice, rentalDays, season);
  totalPrice = applyHighSeasonExperienceFee(
    totalPrice,
    heldLicenseYears,
    rentalDays,
    season
  );

  return formatPrice(totalPrice);
}

function getEligibilityError(driverAge, heldLicenseYears, carClass) {
  if (driverAge < MIN_DRIVER_AGE) {
    return ERRORS.TOO_YOUNG;
  }

  if (heldLicenseYears < 1) {
    return ERRORS.LICENSE_TOO_NEW;
  }

  if (driverAge <= COMPACT_ONLY_MAX_AGE && carClass !== CAR_CLASSES.COMPACT) {
    return ERRORS.COMPACT_ONLY;
  }

  return null;
}

function calculateBaseRentalPrice(driverAge, rentalDates) {
  return rentalDates.reduce(
    (total, date) => total + getDailyPrice(driverAge, date),
    0
  );
}

function getDailyPrice(driverAge, date) {
  if (isWeekend(date)) {
    return driverAge * WEEKEND_MULTIPLIER;
  }

  return driverAge;
}

function applyNewDriverMultiplier(totalPrice, heldLicenseYears) {
  if (heldLicenseYears < 2) {
    return totalPrice * NEW_DRIVER_MULTIPLIER;
  }

  return totalPrice;
}

function applyRacerSurcharge(totalPrice, carClass, driverAge, season) {
  if (carClass !== CAR_CLASSES.RACER) {
    return totalPrice;
  }

  if (driverAge > RACER_SURCHARGE_MAX_AGE) {
    return totalPrice;
  }

  if (season !== SEASONS.HIGH) {
    return totalPrice;
  }

  return totalPrice * RACER_HIGH_SEASON_MULTIPLIER;
}

function applySeasonalIncrease(totalPrice, season) {
  if (season === SEASONS.HIGH) {
    return totalPrice * HIGH_SEASON_MULTIPLIER;
  }

  return totalPrice;
}

function applyLongRentalDiscount(totalPrice, rentalDays, season) {
  if (rentalDays > LONG_RENTAL_THRESHOLD_DAYS && season === SEASONS.LOW) {
    return totalPrice * LOW_SEASON_LONG_RENTAL_DISCOUNT;
  }

  return totalPrice;
}

function applyHighSeasonExperienceFee(
  totalPrice,
  heldLicenseYears,
  rentalDays,
  season
) {
  if (heldLicenseYears < 3 && season === SEASONS.HIGH) {
    return totalPrice + NEW_DRIVER_HIGH_SEASON_DAILY_FEE * rentalDays;
  }

  return totalPrice;
}

function getCarClass(type) {
  if (Object.values(CAR_CLASSES).includes(type)) {
    return type;
  }

  return "Unknown";
}

function getRentalDates(pickupDateInput, dropoffDateInput) {
  const pickupDate = parseDateInput(pickupDateInput);
  const dropoffDate = parseDateInput(dropoffDateInput);
  const startTime = Math.min(pickupDate.getTime(), dropoffDate.getTime());
  const endTime = Math.max(pickupDate.getTime(), dropoffDate.getTime());
  const dates = [];
  let currentTime = startTime;

  while (currentTime <= endTime) {
    dates.push(new Date(currentTime));
    currentTime += MILLISECONDS_IN_DAY;
  }

  return dates;
}

function parseDateInput(value) {
  if (value instanceof Date) {
    return createUtcDate(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    );
  }

  if (typeof value === "number") {
    return parseDateInput(new Date(value));
  }

  if (typeof value === "string") {
    const dateOnlyMatch = value.match(DATE_ONLY_PATTERN);

    if (dateOnlyMatch) {
      return createUtcDate(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      );
    }

    return parseDateInput(new Date(value));
  }

  throw new Error("Unsupported date input");
}

function createUtcDate(year, month, day) {
  return new Date(Date.UTC(year, month, day));
}

function getSeason(rentalDates) {
  if (rentalDates.some(isHighSeasonDate)) {
    return SEASONS.HIGH;
  }

  return SEASONS.LOW;
}

function isHighSeasonDate(date) {
  const month = date.getUTCMonth();

  if (month < HIGH_SEASON_MONTH_START) {
    return false;
  }

  if (month > HIGH_SEASON_MONTH_END) {
    return false;
  }

  return true;
}

function isWeekend(date) {
  const day = date.getUTCDay();

  if (day === 0) {
    return true;
  }

  if (day === 6) {
    return true;
  }

  return false;
}

function formatPrice(amount) {
  return `$${(Math.round(amount * 100) / 100).toString()}`;
}

module.exports = {
  price,
  calculateBaseRentalPrice,
  getCarClass,
  getRentalDates,
  getSeason,
  isHighSeasonDate,
  isWeekend,
  parseDateInput
};
