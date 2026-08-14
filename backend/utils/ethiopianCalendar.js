const ETHIOPIAN_EPOCH_JDN = 1723856;

const isEthiopianLeapYear = (year) => Number(year) % 4 === 3;

const getEthiopianMonthDays = (year, month) => {
    if (month >= 1 && month <= 12) return 30;
    if (month === 13) return isEthiopianLeapYear(year) ? 6 : 5;
    return 0;
};

const validateEthiopianDate = (value) => {
    const year = Number(value?.year);
    const month = Number(value?.month);
    const day = Number(value?.day);
    if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    return day >= 1 && day <= getEthiopianMonthDays(year, month);
};

const ethiopianToJdn = (year, month, day) => (
    ETHIOPIAN_EPOCH_JDN + (365 * year) + Math.floor(year / 4) + (30 * month) + day - 31
);

const jdnToGregorianParts = (jdn) => {
    let l = jdn + 68569;
    const n = Math.floor((4 * l) / 146097);
    l -= Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (l + 1)) / 1461001);
    l = l - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * l) / 2447);
    const day = l - Math.floor((2447 * j) / 80);
    l = Math.floor(j / 11);
    const month = j + 2 - (12 * l);
    const year = 100 * (n - 49) + i + l;
    return { year, month, day };
};

const ethiopianToGregorianDate = (value) => {
    if (!validateEthiopianDate(value)) return null;
    const parts = jdnToGregorianParts(ethiopianToJdn(Number(value.year), Number(value.month), Number(value.day)));
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

module.exports = {
    ethiopianToGregorianDate,
    getEthiopianMonthDays,
    isEthiopianLeapYear,
    validateEthiopianDate,
};
