import { differenceInMonths, addMonths } from "date-fns";
import type { Investment, BudgetState, Expense } from "../state/types";
import { monthlySpend } from "./finance";

export const calculateSIPFutureValue = (
  monthlyInvestment: number,
  annualReturnRate: number,
  tenureMonths: number,
  compounding: "monthly" | "quarterly" | "yearly" = "monthly"
) => {
  if (tenureMonths <= 0 || monthlyInvestment <= 0) return 0;
  // standard SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
  const r = annualReturnRate / 100 / 12; 
  if (r === 0) return monthlyInvestment * tenureMonths;
  const fv = monthlyInvestment * ( (Math.pow(1 + r, tenureMonths) - 1) / r ) * (1 + r);
  return fv;
};

export const calculateStepUpSIPFutureValue = (
  initialMonthly: number,
  annualReturnRate: number,
  tenureMonths: number,
  stepUpRate: number,
  stepUpFrequencyMonths: number
) => {
  if (tenureMonths <= 0 || initialMonthly <= 0) return { totalInvested: 0, fv: 0 };
  let totalInvested = 0;
  let fv = 0;
  const r = annualReturnRate / 100 / 12;

  let currentMonthly = initialMonthly;
  let monthsLeft = tenureMonths;

  while (monthsLeft > 0) {
    const periodMonths = Math.min(monthsLeft, stepUpFrequencyMonths);
    let periodFv = 0;
    if (r === 0) {
      periodFv = currentMonthly * periodMonths;
    } else {
      periodFv = currentMonthly * ( (Math.pow(1 + r, periodMonths) - 1) / r ) * (1 + r);
    }
    
    totalInvested += currentMonthly * periodMonths;
    monthsLeft -= periodMonths;
    
    fv += periodFv * Math.pow(1 + r, monthsLeft);
    currentMonthly = currentMonthly * (1 + stepUpRate / 100);
  }

  return { totalInvested, fv };
};

export const calculateInvestmentProjections = (inv: any) => {
  const start = inv.startDate ? new Date(inv.startDate) : new Date();
  const now = new Date();
  const sip_day = Number(inv.sip_day ?? inv.sipDate ?? 1);
  const tenureMonths = Number(inv.tenureMonths) || 0;

  let monthsElapsed = 0;
  if (start <= now) {
    const startYear = start.getFullYear();
    const startMonth = start.getMonth();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();

    if (startYear === nowYear && startMonth === nowMonth) {
      monthsElapsed = 1; // Initial installment paid this month
    } else {
      monthsElapsed = (nowYear - startYear) * 12 + (nowMonth - startMonth);
      if (now.getDate() >= sip_day) {
        monthsElapsed += 1;
      }
      // Guarantee at least 1 installment if started in the past
      monthsElapsed = Math.max(1, monthsElapsed);
    }
  }

  // Cap at tenure if tenure is defined
  if (tenureMonths > 0) {
    monthsElapsed = Math.min(monthsElapsed, tenureMonths);
  }

  const remainingMonths = Math.max(0, tenureMonths - monthsElapsed);
  const isMatured = remainingMonths === 0;

  const monthly_amount = Number(inv.monthly_amount ?? inv.amount ?? 0);
  const expected_annual_return = Number(inv.expected_annual_return ?? 12);
  const step_up_rate = Number(inv.step_up_rate ?? 0);
  const step_up_frequency = Number(inv.step_up_frequency ?? 12);
  const compounding_frequency = inv.compounding_frequency || "monthly";

  let projectedInvested = 0;
  let projectedFv = 0;

  if (inv.step_up_enabled) {
    const res = calculateStepUpSIPFutureValue(
      monthly_amount, 
      expected_annual_return, 
      tenureMonths, 
      step_up_rate, 
      step_up_frequency
    );
    projectedInvested = res.totalInvested;
    projectedFv = res.fv;
  } else {
    projectedInvested = monthly_amount * tenureMonths;
    projectedFv = calculateSIPFutureValue(monthly_amount, expected_annual_return, tenureMonths, compounding_frequency);
  }

  let currentInvested = 0;
  let currentFv = 0;
  if (inv.step_up_enabled) {
     const currentRes = calculateStepUpSIPFutureValue(
        monthly_amount,
        expected_annual_return,
        monthsElapsed,
        step_up_rate,
        step_up_frequency
     );
     currentInvested = currentRes.totalInvested;
     currentFv = currentRes.fv;
  } else {
     currentInvested = monthly_amount * monthsElapsed;
     currentFv = calculateSIPFutureValue(monthly_amount, expected_annual_return, monthsElapsed, compounding_frequency);
  }

  const maturityDate = addMonths(start, tenureMonths);

  return {
    ...inv,
    name: inv.name || inv.instrument || "Investment",
    monthly_amount,
    expected_annual_return,
    sip_day,
    monthsElapsed,
    remainingMonths,
    isMatured,
    maturityDate,
    projectedInvested,
    projectedFv,
    projectedReturns: projectedFv - projectedInvested,
    currentInvested,
    currentFv,
    currentReturns: currentFv - currentInvested,
    progressPercentage: tenureMonths ? Math.min(100, (monthsElapsed / tenureMonths) * 100) : 0
  };
};

export const getInvestableSurplus = (budget: BudgetState, expenses: Expense[]) => {
  const income = budget.monthlyIncome || 0;
  const currentSpend = monthlySpend(expenses);
  return Math.max(0, income - currentSpend);
};
