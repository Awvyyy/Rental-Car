const {
  price,
  calculateBaseRentalPrice,
  getCarClass,
  getRentalDates,
  getSeason,
  isHighSeasonDate,
  isWeekend,
  parseDateInput
} = require("./rentalPrice");

function normalizePrice(value) {
  if (typeof value !== "string" || !value.startsWith("$")) {
    return value;
  }

  return `$${parseFloat(value.slice(1))}`;
}

describe("rental price calculator", () => {
  test("supports all four car classes", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Compact", 30, 10)
      )
    ).toBe("$30");
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Electric", 30, 10)
      )
    ).toBe("$30");
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Cabrio", 30, 10)
      )
    ).toBe("$30");
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Racer", 30, 10)
      )
    ).toBe("$30");
  });

  test("uses default license years when the argument is omitted", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Compact", 30)
      )
    ).toBe("$30");
  });

  test("drivers under 18 cannot rent", () => {
    expect(
      price("A", "B", "2024-02-12", "2024-02-12", "Compact", 17, 10)
    ).toBe("Driver too young - cannot quote the price");
  });

  test("drivers aged 18-21 can only rent compact cars", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Compact", 21, 10)
      )
    ).toBe("$21");

    expect(
      price("A", "B", "2024-02-12", "2024-02-12", "Electric", 21, 10)
    ).toBe("Drivers 21 y/o or less can only rent Compact vehicles");
  });

  test("driver with less than one year license cannot rent", () => {
    expect(
      price("A", "B", "2024-02-12", "2024-02-12", "Compact", 30, 0.5)
    ).toBe("Driver license held for less than a year - cannot rent");
  });

  test("driver with less than two years license gets a 30 percent increase", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Compact", 30, 1.5)
      )
    ).toBe("$39");
  });

  test("driver with two years license does not get the new-driver multiplier", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Compact", 30, 2)
      )
    ).toBe("$30");
  });

  test("driver with less than three years license gets the high-season daily fee", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-06-10", "2024-06-12", "Compact", 30, 2.5)
      )
    ).toBe("$148.5");
  });

  test("driver with three years license does not get the high-season daily fee", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-06-10", "2024-06-10", "Compact", 30, 3)
      )
    ).toBe("$34.5");
  });

  test("racer surcharge applies only in high season for drivers aged 25 or less", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-06-10", "2024-06-10", "Racer", 25, 10)
      )
    ).toBe("$43.13");

    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-12", "Racer", 25, 10)
      )
    ).toBe("$25");

    expect(
      normalizePrice(
        price("A", "B", "2024-06-10", "2024-06-10", "Racer", 26, 10)
      )
    ).toBe("$29.9");
  });

  test("high season runs from April through October", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-04-15", "2024-04-15", "Compact", 100, 10)
      )
    ).toBe("$115");

    expect(
      normalizePrice(
        price("A", "B", "2024-10-15", "2024-10-15", "Compact", 100, 10)
      )
    ).toBe("$115");
  });

  test("low season runs from November through March", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-03-18", "2024-03-18", "Compact", 100, 10)
      )
    ).toBe("$100");

    expect(
      normalizePrice(
        price("A", "B", "2024-11-18", "2024-11-18", "Compact", 100, 10)
      )
    ).toBe("$100");
  });

  test("more than 10 days in low season gets a 10 percent discount", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-02-12", "2024-02-22", "Compact", 100, 10)
      )
    ).toBe("$999");
  });

  test("more than 10 days in high season does not get the low-season discount", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-06-10", "2024-06-20", "Compact", 100, 10)
      )
    ).toBe("$1276.5");
  });

  test("weekend pricing increases only Saturday and Sunday", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-01-08", "2024-01-10", "Compact", 50, 10)
      )
    ).toBe("$150");

    expect(
      normalizePrice(
        price("A", "B", "2024-01-11", "2024-01-13", "Compact", 50, 10)
      )
    ).toBe("$152.5");

    expect(
      normalizePrice(
        price("A", "B", "2024-01-12", "2024-01-14", "Compact", 50, 10)
      )
    ).toBe("$155");
  });

  test("formats decimal prices without trailing zero padding", () => {
    expect(
      normalizePrice(
        price("A", "B", "2024-06-10", "2024-06-10", "Compact", 31, 10)
      )
    ).toBe("$35.65");
  });
});

describe("helper functions", () => {
  test("calculateBaseRentalPrice adds the weekend multiplier per weekend day", () => {
    const rentalDates = getRentalDates("2024-01-12", "2024-01-14");

    expect(calculateBaseRentalPrice(50, rentalDates)).toBe(155);
  });

  test("getCarClass returns Unknown for unsupported classes", () => {
    expect(getCarClass("Monster Truck")).toBe("Unknown");
  });

  test("getRentalDates is inclusive and order independent", () => {
    expect(getRentalDates("2024-01-10", "2024-01-12")).toHaveLength(3);
    expect(getRentalDates("2024-01-12", "2024-01-10")).toHaveLength(3);
  });

  test("getSeason detects high and low season", () => {
    expect(getSeason(getRentalDates("2024-02-12", "2024-02-14"))).toBe("Low");
    expect(getSeason(getRentalDates("2024-06-10", "2024-06-12"))).toBe("High");
  });

  test("isHighSeasonDate covers spring, autumn and winter boundaries", () => {
    expect(isHighSeasonDate(parseDateInput("2024-03-31"))).toBe(false);
    expect(isHighSeasonDate(parseDateInput("2024-04-01"))).toBe(true);
    expect(isHighSeasonDate(parseDateInput("2024-11-01"))).toBe(false);
  });

  test("isWeekend detects Saturday, Sunday and weekdays", () => {
    expect(isWeekend(parseDateInput("2024-01-13"))).toBe(true);
    expect(isWeekend(parseDateInput("2024-01-14"))).toBe(true);
    expect(isWeekend(parseDateInput("2024-01-15"))).toBe(false);
  });

  test(
    "parseDateInput accepts date-only strings, datetime strings, timestamps and Date inputs",
    () => {
      expect(parseDateInput("2024-02-12").toISOString()).toBe(
        "2024-02-12T00:00:00.000Z"
      );
      expect(parseDateInput("2024-02-12T10:00:00.000Z").toISOString()).toBe(
        "2024-02-12T00:00:00.000Z"
      );
      expect(parseDateInput(Date.parse("2024-02-12")).toISOString()).toBe(
        "2024-02-12T00:00:00.000Z"
      );
      expect(
        parseDateInput(new Date("2024-02-12T10:00:00.000Z")).toISOString()
      ).toBe("2024-02-12T00:00:00.000Z");
    }
  );

  test("parseDateInput throws for unsupported values", () => {
    expect(() => parseDateInput({})).toThrow("Unsupported date input");
  });
});
