export type CommissionSlab = {
  min_amount: number;
  max_amount: number | null;
  rate: number;
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function nonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

/**
 * Returns a new array of slabs sorted ascending by `min_amount`.
 *
 * @example
 * sortSlabs([
 *   { min_amount: 50000, max_amount: null, rate: 15 },
 *   { min_amount: 0, max_amount: 50000, rate: 10 },
 * ])
 * // → [{ min_amount: 0, max_amount: 50000, rate: 10 }, { min_amount: 50000, max_amount: null, rate: 15 }]
 */
export function sortSlabs(slabs: CommissionSlab[]): CommissionSlab[] {
  return [...slabs].sort((a, b) => a.min_amount - b.min_amount);
}

/**
 * Validates a slab set for contiguous tier coverage and sane bounds.
 *
 * @example
 * validateSlabs([
 *   { min_amount: 0, max_amount: 50000, rate: 10 },
 *   { min_amount: 50000, max_amount: null, rate: 15 },
 * ])
 * // → { valid: true }
 */
export function validateSlabs(slabs: CommissionSlab[]): {
  valid: boolean;
  error?: string;
} {
  if (slabs.length === 0) {
    return { valid: false, error: "At least one commission slab is required." };
  }

  const sorted = sortSlabs(slabs);

  if (sorted[0].min_amount !== 0) {
    return {
      valid: false,
      error: "The first slab must start at min_amount 0.",
    };
  }

  for (let i = 0; i < sorted.length; i++) {
    const slab = sorted[i];
    const isLast = i === sorted.length - 1;

    if (!Number.isFinite(slab.min_amount) || slab.min_amount < 0) {
      return {
        valid: false,
        error: `Slab ${i + 1} has an invalid min_amount.`,
      };
    }

    if (!Number.isFinite(slab.rate) || slab.rate < 0 || slab.rate > 100) {
      return {
        valid: false,
        error: `Slab ${i + 1} rate must be between 0 and 100 inclusive.`,
      };
    }

    if (slab.max_amount === null) {
      if (!isLast) {
        return {
          valid: false,
          error: "Only the last slab may have max_amount null (and above).",
        };
      }
    } else {
      if (!Number.isFinite(slab.max_amount)) {
        return {
          valid: false,
          error: `Slab ${i + 1} has an invalid max_amount.`,
        };
      }

      if (slab.max_amount <= slab.min_amount) {
        return {
          valid: false,
          error: `Slab ${i + 1} max_amount must be greater than min_amount.`,
        };
      }
    }

    if (i > 0) {
      const previous = sorted[i - 1];
      if (previous.max_amount === null) {
        return {
          valid: false,
          error: "A slab with no upper limit cannot be followed by another slab.",
        };
      }

      if (slab.min_amount !== previous.max_amount) {
        return {
          valid: false,
          error: `Slab ${i + 1} min_amount must equal the previous slab's max_amount (${previous.max_amount}).`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Computes commission earned only on a new booking, using marginal slab logic
 * against monthly revenue already accumulated.
 *
 * @example
 * // Slabs: 0–50,000 @ 10%, 50,000+ @ 15%
 * // Staff at ₹45,000 monthly revenue takes a ₹10,000 booking → range [45,000, 55,000)
 * // ₹5,000 in first slab @ 10% = ₹500; ₹5,000 in second slab @ 15% = ₹750 → ₹1,250
 * calculateMarginalCommission(45000, 10000, [
 *   { min_amount: 0, max_amount: 50000, rate: 10 },
 *   { min_amount: 50000, max_amount: null, rate: 15 },
 * ])
 * // → 1250
 */
export function calculateMarginalCommission(
  monthlyRevenueSoFar: number,
  bookingAmount: number,
  slabs: CommissionSlab[]
): number {
  if (slabs.length === 0) {
    return 0;
  }

  const validation = validateSlabs(slabs);
  if (!validation.valid) {
    return 0;
  }

  const revenueSoFar = nonNegative(monthlyRevenueSoFar);
  const amount = nonNegative(bookingAmount);

  if (amount === 0) {
    return 0;
  }

  const rangeStart = revenueSoFar;
  const rangeEnd = revenueSoFar + amount;
  const sorted = sortSlabs(slabs);

  let commission = 0;

  for (const slab of sorted) {
    const slabMax = slab.max_amount ?? Number.POSITIVE_INFINITY;
    const overlapStart = Math.max(rangeStart, slab.min_amount);
    const overlapEnd = Math.min(rangeEnd, slabMax);
    const overlap = overlapEnd - overlapStart;

    if (overlap > 0) {
      commission += overlap * (slab.rate / 100);
    }
  }

  return roundCurrency(commission);
}

/**
 * Total marginal commission on full monthly revenue from zero.
 *
 * @example
 * // Same slabs; ₹55,000 total monthly revenue from 0
 * // ₹50,000 @ 10% = ₹5,000; ₹5,000 @ 15% = ₹750 → ₹5,750
 * calculateTotalCommission(55000, [
 *   { min_amount: 0, max_amount: 50000, rate: 10 },
 *   { min_amount: 50000, max_amount: null, rate: 15 },
 * ])
 * // → 5750
 */
export function calculateTotalCommission(
  monthlyRevenue: number,
  slabs: CommissionSlab[]
): number {
  return calculateMarginalCommission(0, nonNegative(monthlyRevenue), slabs);
}
