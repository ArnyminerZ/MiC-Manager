/**
 * The duration of a day in milliseconds.
 * @type {number}
 */
const oneDay = 1000 * 60 * 60 * 24;

/**
 * Returns the current billing cycle start date.
 * @author Arnau Mora
 * @since 20221121
 * @return {Date}
 */
export const billingCycleStart = () => {
    const billingCycleDay = process.env.BILLING_CYCLE_DAY;
    const billingCycleMonth = process.env.BILLING_CYCLE_MONTH;
    const now = new Date();

    const currentYearStart = new Date(now.getFullYear(), billingCycleMonth - 1, billingCycleDay - 1);
    const currentDiff = now - currentYearStart;
    const currentDays = Math.floor(currentDiff / oneDay);
    if (currentDays <= 365) return currentYearStart;

    return new Date(now.getFullYear() - 1, billingCycleMonth - 1, billingCycleDay - 1);
};

/**
 * Returns the current billing cycle end date.
 * @author Arnau Mora
 * @since 20221121
 * @return {Date}
 */
export const billingCycleEnd = () => {
    const billingCycleDay = process.env.BILLING_CYCLE_DAY;
    const billingCycleMonth = process.env.BILLING_CYCLE_MONTH;
    const now = new Date();

    const currentYearStart = new Date(now.getFullYear() + 1, billingCycleMonth - 1, billingCycleDay - 2);
    const currentDiff = now - currentYearStart;
    const currentDays = Math.floor(currentDiff / oneDay);
    if (currentDays <= 365) return currentYearStart;

    return new Date(now.getFullYear(), billingCycleMonth - 1, billingCycleDay - 2);
};

/**
 * Returns the current billing cycle's start and end dates.
 * @author Arnau Mora
 * @since 20221121
 * @return {{start: Date, end: Date}}
 */
export const billingCycle = () => {
    return {start: billingCycleStart(), end: billingCycleEnd()};
};
