const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

const planner = document.querySelector("[data-planner]");
const savingsAccounts = document.getElementById("savingsAccounts");
const savingsTemplate = document.getElementById("savingsAccountTemplate");
const addSavingsAccountButton = document.getElementById("addSavingsAccount");
const resetPlannerButton = document.getElementById("resetPlanner");
const withdrawalRateInput = document.getElementById("withdrawalRate");
const withdrawalPresetButtons = Array.from(document.querySelectorAll(".rate-preset"));
const chartModeButtons = Array.from(document.querySelectorAll("[data-chart-mode]"));
const interactiveChart = document.getElementById("interactiveChart");
const chartTooltip = document.getElementById("chartTooltip");
const chartStage = document.getElementById("chartStage");
const chartLegend = document.getElementById("chartLegend");
const plannerSummaryToggles = Array.from(document.querySelectorAll(".planner-summary .section-toggle"));
const optionalSections = [
  { toggleId: "includeAssetMix", containerId: "assetMixSection" },
  { toggleId: "includePension", containerId: "pensionSection" },
  { toggleId: "includeIsa", containerId: "isaSection" },
  { toggleId: "includeOtherAccounts", containerId: "otherAccountsSection" },
  { toggleId: "includeHome", containerId: "homeSection" },
];
const optionalFields = [
  {
    toggleId: "includeStatePension",
    containerId: "statePensionField",
    inputIds: ["statePensionIncome", "statePensionStartAge"],
  },
  {
    toggleId: "includePublicPension",
    containerId: "publicPensionField",
    inputIds: ["publicPensionIncome", "publicPensionStartAge", "publicPensionLumpSum"],
  },
  {
    toggleId: "includeOtherGuaranteedIncome",
    containerId: "otherGuaranteedIncomeField",
    inputIds: ["otherGuaranteedIncome"],
  },
];

const savingsTypeDefaults = {
  cash_isa: { label: "Cash ISA", rate: 3.5 },
  cash_lisa: { label: "Cash LISA", rate: 3.75 },
  premium_bonds: { label: "Premium Bonds", rate: 4.0 },
  hysa: { label: "High-yield savings", rate: 4.5 },
  fixed_bond: { label: "Fixed-rate bond", rate: 4.25 },
  notice_account: { label: "Notice account", rate: 3.75 },
  nsi_income_bonds: { label: "NS&I Income Bonds", rate: 3.6 },
  gia: { label: "GIA", rate: 5.5 },
  savings_account: { label: "Savings account", rate: 2.5 },
};

const TAX_FREE_SAVINGS_TYPES = new Set(["cash_isa", "cash_lisa", "premium_bonds"]);
const TAXABLE_INTEREST_SAVINGS_TYPES = new Set([
  "hysa",
  "fixed_bond",
  "notice_account",
  "nsi_income_bonds",
  "savings_account",
]);
const GIA_DIVIDEND_YIELD = 2;
const UK_TAX_PROFILES = {
  basic: {
    label: "basic-rate",
    savingsRate: 0.2,
    dividendRate: 0.1075,
    cgtRate: 0.18,
    personalSavingsAllowance: 1000,
    dividendAllowance: 500,
    cgtAllowance: 3000,
  },
  higher: {
    label: "higher-rate",
    savingsRate: 0.4,
    dividendRate: 0.3575,
    cgtRate: 0.24,
    personalSavingsAllowance: 500,
    dividendAllowance: 500,
    cgtAllowance: 3000,
  },
  additional: {
    label: "additional-rate",
    savingsRate: 0.45,
    dividendRate: 0.3935,
    cgtRate: 0.24,
    personalSavingsAllowance: 0,
    dividendAllowance: 500,
    cgtAllowance: 3000,
  },
};
const UK_PERSONAL_ALLOWANCE = 12570;
const UK_ALLOWANCE_TAPER_START = 100000;
const UK_BASIC_RATE_BAND = 37700;
const UK_HIGHER_RATE_BAND = 74870;

const outputIds = {
  yearsToRetirement: "years-to-retirement",
  projectedNetWorth: "projected-net-worth",
  estimatedIncome: "estimated-income",
  incomeGapLabel: "income-gap-label",
  incomeGap: "income-gap",
  incomeGapNote: "income-gap-note",
  readinessTitle: "readiness-title",
  resultExplainer: "result-explainer",
  futureSpendingTarget: "future-spending-target",
  answerIncomeOutput: "answer-income-output",
  answerDifferenceLabel: "answer-difference-label",
  answerDifference: "answer-difference",
  answerDifferenceNote: "answer-difference-note",
  laterIncomeCallout: "later-income-callout",
  laterIncomeTitle: "later-income-title",
  laterIncomeCopy: "later-income-copy",
  extraYearsTitle: "extra-years-title",
  extraYearsCopy: "extra-years-copy",
  withdrawalGuidance: "withdrawalGuidance",
  pensionFutureValue: "pension-future-value",
  isaFutureValue: "isa-future-value",
  savingsFutureValue: "savings-future-value",
  homeEquityValue: "home-equity-value",
  usableEquityValue: "usable-equity-value",
  pensionChartValue: "pension-chart-value",
  isaChartValue: "isa-chart-value",
  savingsChartValue: "savings-chart-value",
  homeChartValue: "home-chart-value",
  pensionBalanceBar: "pension-balance-bar",
  isaBalanceBar: "isa-balance-bar",
  savingsBalanceBar: "savings-balance-bar",
  homeBalanceBar: "home-balance-bar",
  targetIncomeChartValue: "target-income-chart-value",
  projectedIncomeChartValue: "projected-income-chart-value",
  targetIncomeBar: "target-income-bar",
  projectedIncomeBar: "projected-income-bar",
  resultsGapSummary: "results-gap-summary",
  pensionShare: "pension-share",
  isaShare: "isa-share",
  savingsShare: "savings-share",
  homeShare: "home-share",
  publicPensionLumpSumShare: "public-pension-lump-sum-share",
  pensionShareLabel: "pension-share-label",
  publicPensionLumpSumShareLabel: "public-pension-lump-sum-share-label",
  isaShareLabel: "isa-share-label",
  savingsShareLabel: "savings-share-label",
  homeShareLabel: "home-share-label",
  drawdownIncome: "drawdown-income",
  statePensionIncomeOutput: "state-pension-income-output",
  publicPensionIncomeOutput: "public-pension-income-output",
  publicPensionLumpSumOutput: "public-pension-lump-sum-output",
  otherGuaranteedIncomeOutput: "other-guaranteed-income-output",
  grossIncomeOutput: "gross-income-output",
  incomeTaxOutput: "income-tax-output",
  totalIncomeOutput: "total-income-output",
  assumptionGrowth: "assumption-growth",
  assumptionInflation: "assumption-inflation",
  assumptionTax: "assumption-tax",
  assumptionEquity: "assumption-equity",
  equityUsageLabel: "equity-usage-label",
  chartTitle: "chartTitle",
  chartSummary: "chartSummary",
  chartDescription: "chartDescription",
};

const chartState = {
  mode: "growth",
};
const PLANNER_STORAGE_KEY = "can-i-retire-yet-planner-state-v1";
const DEFAULT_SAVINGS_ROWS = [
  { type: "cash_isa", balance: 20000, monthly: 150, rate: 3.5, inflationLinked: false },
  { type: "premium_bonds", balance: 10000, monthly: 50, rate: 4.0, inflationLinked: false },
];

function readNumber(id) {
  const field = document.getElementById(id);
  return field ? Number(field.value) || 0 : 0;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function setWidth(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }
}

function setHidden(id, hidden) {
  const node = document.getElementById(id);
  if (node) {
    node.hidden = hidden;
  }
}

function getPlannableFields() {
  return Array.from(planner.querySelectorAll("input, select, textarea"));
}

function captureFieldState() {
  return getPlannableFields().reduce((state, field) => {
    if (!field.id) {
      return state;
    }

    state[field.id] =
      field.type === "checkbox" || field.type === "radio" ? Boolean(field.checked) : field.value;
    return state;
  }, {});
}

function applyFieldState(fieldState = {}) {
  Object.entries(fieldState).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (!field) {
      return;
    }

    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });
}

function captureDisclosureState() {
  return Array.from(planner.querySelectorAll(".planner-disclosure[id]")).reduce((state, disclosure) => {
    state[disclosure.id] = disclosure.open;
    return state;
  }, {});
}

function applyDisclosureState(disclosureState = {}) {
  Object.entries(disclosureState).forEach(([id, open]) => {
    const disclosure = document.getElementById(id);
    if (disclosure?.tagName === "DETAILS") {
      disclosure.open = Boolean(open);
    }
  });
}

function getSavingsRowState() {
  return getSavingsRows().map((row) => ({
    type: row.querySelector(".savings-type")?.value || "cash_isa",
    balance: Number(row.querySelector(".savings-balance")?.value) || 0,
    monthly: Number(row.querySelector(".savings-monthly")?.value) || 0,
    rate: Number(row.querySelector(".savings-rate")?.value) || 0,
    inflationLinked: Boolean(row.querySelector(".savings-inflation-linked")?.checked),
  }));
}

function applySavingsRowState(rows = []) {
  savingsAccounts.innerHTML = "";
  const nextRows = rows.length ? rows : DEFAULT_SAVINGS_ROWS;
  nextRows.forEach((row) => createSavingsRow(row));
}

function setChartMode(mode) {
  chartState.mode = mode || "growth";
  chartModeButtons.forEach((candidate) => {
    candidate.classList.toggle("is-active", candidate.dataset.chartMode === chartState.mode);
  });
}

function savePlannerState() {
  try {
    const payload = {
      fields: captureFieldState(),
      savingsRows: getSavingsRowState(),
      disclosures: captureDisclosureState(),
      chartMode: chartState.mode,
    };

    window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Ignore localStorage failures and keep the planner usable.
  }
}

function loadPlannerState() {
  try {
    const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const payload = JSON.parse(raw);
    applyFieldState(payload.fields);
    applySavingsRowState(payload.savingsRows);
    applyDisclosureState(payload.disclosures);
    setChartMode(payload.chartMode);
    return true;
  } catch (error) {
    return false;
  }
}

function getMonthlyContributionForMonth(baseMonthly, monthIndex, inflationRate, increaseWithInflation) {
  if (!increaseWithInflation) {
    return baseMonthly;
  }

  const annualStep = Math.floor(Math.max(0, monthIndex) / 12);
  return baseMonthly * Math.pow(1 + inflationRate / 100, annualStep);
}

function futureValueWithMonthlyContributions(initial, monthlyContribution, annualRate, years) {
  const safeYears = Math.max(0, years);
  const months = Math.round(safeYears * 12);
  const monthlyRate = annualRate / 100 / 12;

  if (months === 0) {
    return initial;
  }

  if (monthlyRate === 0) {
    return initial + monthlyContribution * months;
  }

  const growthFactor = Math.pow(1 + monthlyRate, months);
  const contributionValue = monthlyContribution * ((growthFactor - 1) / monthlyRate);

  return initial * growthFactor + contributionValue;
}

function futureValueWithMonthlyContributionsSchedule(
  initial,
  monthlyContribution,
  years,
  annualRateAtMonth,
  monthlyContributionAtMonth = () => monthlyContribution
) {
  const safeYears = Math.max(0, years);
  const months = Math.round(safeYears * 12);
  let balance = initial;

  for (let month = 0; month < months; month += 1) {
    const annualRate = annualRateAtMonth(month);
    const monthlyRate = annualRate / 100 / 12;
    balance = balance * (1 + monthlyRate) + monthlyContributionAtMonth(month);
  }

  return balance;
}

function cumulativeContributionsOverYears(baseMonthly, years, inflationRate, increaseWithInflation) {
  const safeYears = Math.max(0, years);
  let total = 0;

  for (let year = 0; year < safeYears; year += 1) {
    const monthlyContribution = increaseWithInflation
      ? baseMonthly * Math.pow(1 + inflationRate / 100, year)
      : baseMonthly;
    total += monthlyContribution * 12;
  }

  return total;
}

function futureValueLumpSum(initial, annualRate, years) {
  return initial * Math.pow(1 + annualRate / 100, Math.max(0, years));
}

function calculateMortgageBalanceAtRetirement(balance, annualRate, termYears, yearsToRetirement) {
  const startingBalance = Math.max(0, balance);
  const totalMonthsRemaining = Math.max(0, Math.round(termYears * 12));
  const monthsUntilRetirement = Math.max(0, Math.round(yearsToRetirement * 12));

  if (startingBalance === 0 || totalMonthsRemaining === 0) {
    return 0;
  }

  if (monthsUntilRetirement >= totalMonthsRemaining) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    const monthlyPayment = startingBalance / totalMonthsRemaining;
    return Math.max(0, startingBalance - monthlyPayment * monthsUntilRetirement);
  }

  const monthlyPayment =
    startingBalance *
    (monthlyRate / (1 - Math.pow(1 + monthlyRate, -totalMonthsRemaining)));

  const remainingBalance =
    startingBalance * Math.pow(1 + monthlyRate, monthsUntilRetirement) -
    monthlyPayment * ((Math.pow(1 + monthlyRate, monthsUntilRetirement) - 1) / monthlyRate);

  return Math.max(0, remainingBalance);
}

function formatCurrency(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function formatCurrencyShortLabel(value) {
  const absolute = Math.abs(value);

  if (absolute >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  }

  if (absolute >= 1000) {
    return `£${Math.round(value / 1000)}k`;
  }

  return formatCurrency(value);
}

function formatCurrencyShort(value) {
  const absolute = Math.abs(value);

  if (absolute >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}m`;
  }

  if (absolute >= 1000) {
    return `£${Math.round(value / 1000)}k`;
  }

  return formatCurrency(value);
}

function updateWithdrawalGuidance(withdrawalRate) {
  let message = "A common planning starting point is around 4%. Lower numbers are more cautious.";

  if (withdrawalRate <= 3.2) {
    message = `${withdrawalRate}% is fairly cautious. It assumes you draw less each year, which can make the plan more resilient but requires a bigger pot.`;
  } else if (withdrawalRate <= 4.2) {
    message = `${withdrawalRate}% is in the range many people use as a planning starting point. It is not a guarantee, but it is a common baseline.`;
  } else {
    message = `${withdrawalRate}% is more aggressive. It boosts projected income, but it also assumes your investments can support larger withdrawals.`;
  }

  setText(outputIds.withdrawalGuidance, message);

  withdrawalPresetButtons.forEach((button) => {
    const presetRate = Number(button.dataset.rate) || 0;
    button.classList.toggle("is-active", Math.abs(presetRate - withdrawalRate) < 0.05);
  });
}

function createSavingsRow(values = {}) {
  const fragment = savingsTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".savings-row");
  const typeField = fragment.querySelector(".savings-type");
  const balanceField = fragment.querySelector(".savings-balance");
  const monthlyField = fragment.querySelector(".savings-monthly");
  const rateField = fragment.querySelector(".savings-rate");
  const inflationLinkedField = fragment.querySelector(".savings-inflation-linked");
  const removeButton = fragment.querySelector(".remove-button");

  const selectedType = values.type || "cash_isa";
  const defaultRate = savingsTypeDefaults[selectedType].rate;

  typeField.value = selectedType;
  balanceField.value = values.balance ?? 0;
  monthlyField.value = values.monthly ?? 0;
  rateField.value = values.rate ?? defaultRate;
  inflationLinkedField.checked = Boolean(values.inflationLinked);
  rateField.dataset.suggestedRate = String(defaultRate);

  typeField.addEventListener("change", () => {
    const nextDefault = savingsTypeDefaults[typeField.value].rate;
    const currentValue = Number(rateField.value) || 0;
    const suggestedRate = Number(rateField.dataset.suggestedRate) || 0;

    if (currentValue === 0 || currentValue === suggestedRate) {
      rateField.value = nextDefault;
    }

    rateField.dataset.suggestedRate = String(nextDefault);

    updatePlanner();
  });

  removeButton.addEventListener("click", () => {
    row.remove();
    if (!savingsAccounts.children.length) {
      createSavingsRow();
    }
    updatePlanner();
  });

  savingsAccounts.appendChild(fragment);
}

function getSavingsRows() {
  return Array.from(savingsAccounts.querySelectorAll(".savings-row"));
}

function calculateSavingsFutureValue(yearsToRetirement) {
  return getSavingsRows().reduce((total, row) => {
    const balance = Number(row.querySelector(".savings-balance")?.value) || 0;
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    const rate = Number(row.querySelector(".savings-rate")?.value) || 0;
    const inflationLinked = Boolean(row.querySelector(".savings-inflation-linked")?.checked);

    return (
      total +
      futureValueWithMonthlyContributionsSchedule(
        balance,
        monthly,
        yearsToRetirement,
        () => rate,
        (month) => getMonthlyContributionForMonth(monthly, month, readNumber("inflationRate"), inflationLinked)
      )
    );
  }, 0);
}

function clampPercentage(value) {
  return Math.max(0, Math.min(100, value));
}

function isTaxFreeSavingsType(type) {
  return TAX_FREE_SAVINGS_TYPES.has(type);
}

function isTaxableInterestSavingsType(type) {
  return TAXABLE_INTEREST_SAVINGS_TYPES.has(type);
}

function isGiaSavingsType(type) {
  return type === "gia";
}

function getGiaDividendRate(rate) {
  return Math.max(0, Math.min(GIA_DIVIDEND_YIELD, rate));
}

function getUkTaxProfile(taxBand) {
  return UK_TAX_PROFILES[taxBand] || UK_TAX_PROFILES.basic;
}

function getEstimatedNetSavingsRate(type, rate, taxProfile, includeTaxEstimate) {
  if (!includeTaxEstimate || isTaxFreeSavingsType(type)) {
    return rate;
  }

  if (isTaxableInterestSavingsType(type)) {
    return rate * (1 - taxProfile.savingsRate);
  }

  if (isGiaSavingsType(type)) {
    const dividendRate = getGiaDividendRate(rate);
    const capitalRate = Math.max(0, rate - dividendRate);
    return capitalRate * (1 - taxProfile.cgtRate) + dividendRate * (1 - taxProfile.dividendRate);
  }

  return rate;
}

function calculateUkIncomeTax(taxableIncome) {
  const income = Math.max(0, taxableIncome);
  const taperedAllowanceReduction = Math.max(0, income - UK_ALLOWANCE_TAPER_START) / 2;
  const personalAllowance = Math.max(0, UK_PERSONAL_ALLOWANCE - taperedAllowanceReduction);
  let taxableAfterAllowance = Math.max(0, income - personalAllowance);
  let tax = 0;

  const basicSlice = Math.min(taxableAfterAllowance, UK_BASIC_RATE_BAND);
  tax += basicSlice * 0.2;
  taxableAfterAllowance -= basicSlice;

  const higherSlice = Math.min(taxableAfterAllowance, UK_HIGHER_RATE_BAND);
  tax += higherSlice * 0.4;
  taxableAfterAllowance -= higherSlice;

  if (taxableAfterAllowance > 0) {
    tax += taxableAfterAllowance * 0.45;
  }

  return tax;
}

function blendedReturn(growthReturn, defensiveReturn, equityAllocation) {
  const equityShare = clampPercentage(equityAllocation) / 100;
  return growthReturn * equityShare + defensiveReturn * (1 - equityShare);
}

function getEquityAllocationPreRetirement(yearsRemaining, inputs) {
  const currentEquity = clampPercentage(inputs.equityAllocationNow);
  const retirementEquity = clampPercentage(inputs.equityAllocationRetirement);
  const deriskingStartYears = Math.max(0, inputs.deriskingStartYears);

  if (deriskingStartYears === 0) {
    return retirementEquity;
  }

  if (yearsRemaining >= deriskingStartYears) {
    return currentEquity;
  }

  const progress = (deriskingStartYears - yearsRemaining) / deriskingStartYears;
  return currentEquity + (retirementEquity - currentEquity) * progress;
}

function getPreRetirementBlendedRate(growthReturn, monthIndex, totalYearsToRetirement, inputs) {
  if (!inputs.includeAssetMix) {
    return growthReturn;
  }

  const yearsElapsed = monthIndex / 12;
  const yearsRemaining = Math.max(0, totalYearsToRetirement - yearsElapsed);
  const equityAllocation = getEquityAllocationPreRetirement(yearsRemaining, inputs);
  return blendedReturn(growthReturn, inputs.defensiveReturn, equityAllocation);
}

function getDrawdownBlendedRate(growthReturn, inputs) {
  if (!inputs.includeAssetMix) {
    return growthReturn;
  }

  return blendedReturn(growthReturn, inputs.defensiveReturn, inputs.equityAllocationRetirement);
}

function calculateSavingsProjection(yearsToRetirement, inputs) {
  const taxProfile = getUkTaxProfile(inputs.taxBand);
  const accountStates = getSavingsRows().map((row) => {
    const type = row.querySelector(".savings-type")?.value || "savings_account";
    const balance = Number(row.querySelector(".savings-balance")?.value) || 0;
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    const rate = Number(row.querySelector(".savings-rate")?.value) || 0;
    const inflationLinked = Boolean(row.querySelector(".savings-inflation-linked")?.checked);

    return {
      type,
      balance,
      monthly,
      rate,
      inflationLinked,
      basis: balance,
      yearlyInterest: 0,
      yearlyDividends: 0,
    };
  });

  const totalMonths = Math.max(0, Math.round(yearsToRetirement * 12));

  for (let month = 0; month < totalMonths; month += 1) {
    accountStates.forEach((account) => {
      const monthlyContribution = getMonthlyContributionForMonth(
        account.monthly,
        month,
        inputs.inflationRate,
        account.inflationLinked
      );

      account.balance += monthlyContribution;
      account.basis += monthlyContribution;

      if (isTaxFreeSavingsType(account.type)) {
        account.balance *= 1 + account.rate / 100 / 12;
        return;
      }

      if (isTaxableInterestSavingsType(account.type)) {
        const grossInterest = account.balance * (account.rate / 100 / 12);
        account.balance += grossInterest;
        account.yearlyInterest += grossInterest;
        return;
      }

      if (isGiaSavingsType(account.type)) {
        const dividendRate = getGiaDividendRate(account.rate);
        const capitalRate = Math.max(0, account.rate - dividendRate);
        const dividendAmount = account.balance * (dividendRate / 100 / 12);
        const capitalGrowth = account.balance * (capitalRate / 100 / 12);

        account.balance += dividendAmount + capitalGrowth;
        account.yearlyDividends += dividendAmount;
        return;
      }

      account.balance *= 1 + account.rate / 100 / 12;
    });

    if ((month + 1) % 12 === 0 && inputs.includeTaxEstimate) {
      const totalInterest = accountStates.reduce((sum, account) => sum + account.yearlyInterest, 0);
      const taxableInterestRatio =
        totalInterest > 0
          ? Math.max(0, totalInterest - taxProfile.personalSavingsAllowance) / totalInterest
          : 0;

      const totalDividends = accountStates.reduce((sum, account) => sum + account.yearlyDividends, 0);
      const taxableDividendRatio =
        totalDividends > 0
          ? Math.max(0, totalDividends - taxProfile.dividendAllowance) / totalDividends
          : 0;

      accountStates.forEach((account) => {
        if (account.yearlyInterest > 0) {
          account.balance -= account.yearlyInterest * taxableInterestRatio * taxProfile.savingsRate;
        }

        if (account.yearlyDividends > 0) {
          account.balance -= account.yearlyDividends * taxableDividendRatio * taxProfile.dividendRate;
        }

        account.yearlyInterest = 0;
        account.yearlyDividends = 0;
      });
    } else if ((month + 1) % 12 === 0) {
      accountStates.forEach((account) => {
        account.yearlyInterest = 0;
        account.yearlyDividends = 0;
      });
    }
  }

  if (inputs.includeTaxEstimate) {
    const totalGiaGains = accountStates.reduce((sum, account) => {
      if (!isGiaSavingsType(account.type)) {
        return sum;
      }

      return sum + Math.max(0, account.balance - account.basis);
    }, 0);

    const taxableGainRatio =
      totalGiaGains > 0 ? Math.max(0, totalGiaGains - taxProfile.cgtAllowance) / totalGiaGains : 0;

    accountStates.forEach((account) => {
      if (!isGiaSavingsType(account.type)) {
        return;
      }

      const gain = Math.max(0, account.balance - account.basis);
      account.balance -= gain * taxableGainRatio * taxProfile.cgtRate;
    });
  }

  const total = accountStates.reduce((sum, account) => sum + account.balance, 0);
  const drawdownWeightedRate = accountStates.reduce((sum, account) => {
    const growthRate = isGiaSavingsType(account.type)
      ? getDrawdownBlendedRate(account.rate, inputs)
      : account.rate;
    const netRate = getEstimatedNetSavingsRate(
      account.type,
      growthRate,
      taxProfile,
      inputs.includeTaxEstimate
    );
    return sum + account.balance * netRate;
  }, 0);

  return {
    total,
    drawdownRate: total > 0 ? drawdownWeightedRate / total : 0,
  };
}

function getSavingsMonthlyContribution() {
  return getSavingsRows().reduce((total, row) => {
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    return total + monthly;
  }, 0);
}

function getSavingsContributionTotalOverYears(years, inflationRate) {
  return getSavingsRows().reduce((total, row) => {
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    const inflationLinked = Boolean(row.querySelector(".savings-inflation-linked")?.checked);
    return total + cumulativeContributionsOverYears(monthly, years, inflationRate, inflationLinked);
  }, 0);
}

function getSavingsAverageRate() {
  const rows = getSavingsRows();
  if (!rows.length) {
    return 0;
  }

  let weightedRateTotal = 0;
  let weightTotal = 0;

  rows.forEach((row) => {
    const balance = Number(row.querySelector(".savings-balance")?.value) || 0;
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    const rate = Number(row.querySelector(".savings-rate")?.value) || 0;
    const weight = Math.max(1, balance + monthly * 12);
    weightedRateTotal += rate * weight;
    weightTotal += weight;
  });

  return weightTotal > 0 ? weightedRateTotal / weightTotal : 0;
}

function isChecked(id) {
  const field = document.getElementById(id);
  return Boolean(field?.checked);
}

function getRetirementAgeAtProjection(inputs, yearsToRetirement) {
  return inputs.currentAge + Math.max(0, yearsToRetirement);
}

function getGuaranteedBenefits(inputs, yearsToRetirement) {
  const retirementAgeAtProjection = getRetirementAgeAtProjection(inputs, yearsToRetirement);
  const statePensionIncome =
    inputs.includeStatePension && retirementAgeAtProjection >= inputs.statePensionStartAge
      ? inputs.statePensionIncome
      : 0;
  const publicPensionIncome =
    inputs.includePublicPension && retirementAgeAtProjection >= inputs.publicPensionStartAge
      ? inputs.publicPensionIncome
      : 0;
  const publicPensionLumpSum =
    inputs.includePublicPension && retirementAgeAtProjection >= inputs.publicPensionStartAge
      ? inputs.publicPensionLumpSum
      : 0;
  const otherGuaranteedIncome = inputs.otherGuaranteedIncome;

  return {
    statePensionIncome,
    publicPensionIncome,
    publicPensionLumpSum,
    otherGuaranteedIncome,
    guaranteedIncomeTotal: statePensionIncome + publicPensionIncome + otherGuaranteedIncome,
  };
}

function getNextDelayedIncomeStart(inputs) {
  const candidates = [];

  if (inputs.includeStatePension && inputs.statePensionStartAge > inputs.retirementAge) {
    candidates.push({ age: inputs.statePensionStartAge, label: "state pension" });
  }

  if (inputs.includePublicPension && inputs.publicPensionStartAge > inputs.retirementAge) {
    candidates.push({ age: inputs.publicPensionStartAge, label: "public/DB pension" });
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => a.age - b.age);
  const nextAge = candidates[0].age;
  const labels = candidates.filter((item) => item.age === nextAge).map((item) => item.label);

  return { age: nextAge, labels };
}

function simulateBalancesToAge(inputs, retirementProjection, targetAge) {
  const yearsAfterRetirement = Math.max(0, targetAge - inputs.retirementAge);
  const withdrawalBase =
    (retirementProjection.pensionFuture +
      retirementProjection.publicPensionLumpSum +
      retirementProjection.isaFuture +
      retirementProjection.savingsFuture +
      retirementProjection.usableHomeEquity) *
    (inputs.withdrawalRate / 100);

  let pensionBalance = retirementProjection.pensionFuture;
  let publicPensionLumpSumBalance = retirementProjection.publicPensionLumpSum;
  let isaBalance = retirementProjection.isaFuture;
  let savingsBalance = retirementProjection.savingsFuture;
  let homeCashBalance = retirementProjection.usableHomeEquity;

  for (let year = 0; year < yearsAfterRetirement; year += 1) {
    const openingBalance = pensionBalance + publicPensionLumpSumBalance + isaBalance + savingsBalance + homeCashBalance;
    if (openingBalance > 0) {
      const withdrawal = withdrawalBase * Math.pow(1 + inputs.inflationRate / 100, year);
      const plannedWithdrawal = Math.min(openingBalance, withdrawal);
      const totalBeforeWithdrawal = Math.max(openingBalance, 1);

      pensionBalance -= plannedWithdrawal * (pensionBalance / totalBeforeWithdrawal);
      publicPensionLumpSumBalance -= plannedWithdrawal * (publicPensionLumpSumBalance / totalBeforeWithdrawal);
      isaBalance -= plannedWithdrawal * (isaBalance / totalBeforeWithdrawal);
      savingsBalance -= plannedWithdrawal * (savingsBalance / totalBeforeWithdrawal);
      homeCashBalance -= plannedWithdrawal * (homeCashBalance / totalBeforeWithdrawal);
    }

    pensionBalance = Math.max(0, pensionBalance * (1 + retirementProjection.pensionDrawdownRate / 100));
    isaBalance = Math.max(0, isaBalance * (1 + retirementProjection.isaDrawdownRate / 100));
    savingsBalance = Math.max(0, savingsBalance * (1 + retirementProjection.savingsDrawdownRate / 100));
    publicPensionLumpSumBalance = Math.max(0, publicPensionLumpSumBalance);
    homeCashBalance = Math.max(0, homeCashBalance);

    const nextAge = inputs.retirementAge + year + 1;
    if (
      inputs.includePublicPension &&
      nextAge === inputs.publicPensionStartAge &&
      retirementProjection.publicPensionLumpSum === 0
    ) {
      publicPensionLumpSumBalance += inputs.publicPensionLumpSum;
    }
  }

  return {
    pensionBalance,
    publicPensionLumpSumBalance,
    isaBalance,
    savingsBalance,
    homeCashBalance,
    accessibleAssets:
      pensionBalance + publicPensionLumpSumBalance + isaBalance + savingsBalance + homeCashBalance,
  };
}

function calculateIncomeAtAge(inputs, retirementProjection, targetAge) {
  const balances = simulateBalancesToAge(inputs, retirementProjection, targetAge);
  const guaranteedBenefits = getGuaranteedBenefits(inputs, Math.max(0, targetAge - inputs.currentAge));
  const pensionDrawdownIncome = balances.pensionBalance * (inputs.withdrawalRate / 100);
  const publicPensionLumpSumDrawdownIncome = balances.publicPensionLumpSumBalance * (inputs.withdrawalRate / 100);
  const isaDrawdownIncome = balances.isaBalance * (inputs.withdrawalRate / 100);
  const savingsDrawdownIncome = balances.savingsBalance * (inputs.withdrawalRate / 100);
  const homeEquityDrawdownIncome = balances.homeCashBalance * (inputs.withdrawalRate / 100);
  const drawdownIncome =
    pensionDrawdownIncome +
    publicPensionLumpSumDrawdownIncome +
    isaDrawdownIncome +
    savingsDrawdownIncome +
    homeEquityDrawdownIncome;
  const grossEstimatedIncome = drawdownIncome + guaranteedBenefits.guaranteedIncomeTotal;
  const taxablePensionDrawdownIncome = pensionDrawdownIncome * (1 - inputs.pensionTaxFreePercent / 100);
  const taxableRetirementIncome =
    taxablePensionDrawdownIncome +
    guaranteedBenefits.statePensionIncome +
    guaranteedBenefits.publicPensionIncome +
    guaranteedBenefits.otherGuaranteedIncome;
  const retirementIncomeTax = inputs.includeTaxEstimate ? calculateUkIncomeTax(taxableRetirementIncome) : 0;
  const estimatedIncome = grossEstimatedIncome - retirementIncomeTax;
  const futureSpendingTarget =
    inputs.targetSpending * Math.pow(1 + inputs.inflationRate / 100, Math.max(0, targetAge - inputs.currentAge));

  return {
    drawdownIncome,
    grossEstimatedIncome,
    retirementIncomeTax,
    estimatedIncome,
    accessibleAssets: balances.accessibleAssets,
    guaranteedIncomeTotal: guaranteedBenefits.guaranteedIncomeTotal,
    futureSpendingTarget,
    incomeGap: estimatedIncome - futureSpendingTarget,
  };
}

function syncOptionalUi() {
  optionalSections.forEach(({ toggleId, containerId }) => {
    const enabled = isChecked(toggleId);
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    container.classList.toggle("is-disabled", !enabled);
    container.querySelectorAll("input, select, button").forEach((field) => {
      if (field.id === toggleId) {
        field.disabled = false;
      } else {
        field.disabled = !enabled;
      }
    });
  });

  optionalFields.forEach(({ toggleId, containerId, inputIds }) => {
    const enabled = isChecked(toggleId);
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    container.classList.toggle("is-disabled", !enabled);
    inputIds.forEach((inputId) => {
      const input = document.getElementById(inputId);
      if (input) {
        input.disabled = !enabled;
      }
    });
  });
}

function calculateProjection(inputs, yearsToRetirement) {
  const pensionFuture = futureValueWithMonthlyContributionsSchedule(
    inputs.pensionCurrent,
    inputs.pensionMonthlyTotal,
    yearsToRetirement,
    (month) => getPreRetirementBlendedRate(inputs.pensionReturn, month, yearsToRetirement, inputs),
    (month) =>
      getMonthlyContributionForMonth(
        inputs.pensionMonthlyTotal,
        month,
        inputs.inflationRate,
        inputs.pensionContributionInflation
      )
  );

  const isaFuture = futureValueWithMonthlyContributionsSchedule(
    inputs.isaCurrent,
    inputs.isaMonthly,
    yearsToRetirement,
    (month) => getPreRetirementBlendedRate(inputs.isaReturn, month, yearsToRetirement, inputs),
    (month) =>
      getMonthlyContributionForMonth(
        inputs.isaMonthly,
        month,
        inputs.inflationRate,
        inputs.isaContributionInflation
      )
  );

  const guaranteedBenefits = getGuaranteedBenefits(inputs, yearsToRetirement);
  const savingsProjection = inputs.includeOtherAccounts
    ? calculateSavingsProjection(yearsToRetirement, inputs)
    : { total: 0, drawdownRate: 0 };
  const savingsFuture = savingsProjection.total;
  const homeValueFuture = futureValueLumpSum(inputs.homeValue, inputs.homeGrowth, yearsToRetirement);
  const projectedMortgageBalance = calculateMortgageBalanceAtRetirement(
    inputs.mortgageBalance,
    inputs.mortgageRate,
    inputs.mortgageTermYears,
    yearsToRetirement
  );
  const homeEquityFuture = Math.max(0, homeValueFuture - projectedMortgageBalance);
  const usableHomeEquity = homeEquityFuture * (inputs.equityUsageRate / 100);

  const projectedNetWorth =
    guaranteedBenefits.publicPensionLumpSum + pensionFuture + isaFuture + savingsFuture + homeEquityFuture;
  const futureSpendingTarget =
    inputs.targetSpending * Math.pow(1 + inputs.inflationRate / 100, Math.max(0, yearsToRetirement));
  const accessibleAssets =
    pensionFuture + guaranteedBenefits.publicPensionLumpSum + isaFuture + savingsFuture + usableHomeEquity;
  const pensionDrawdownIncome = pensionFuture * (inputs.withdrawalRate / 100);
  const publicPensionLumpSumDrawdownIncome = guaranteedBenefits.publicPensionLumpSum * (inputs.withdrawalRate / 100);
  const isaDrawdownIncome = isaFuture * (inputs.withdrawalRate / 100);
  const savingsDrawdownIncome = savingsFuture * (inputs.withdrawalRate / 100);
  const homeEquityDrawdownIncome = usableHomeEquity * (inputs.withdrawalRate / 100);
  const drawdownIncome =
    pensionDrawdownIncome +
    publicPensionLumpSumDrawdownIncome +
    isaDrawdownIncome +
    savingsDrawdownIncome +
    homeEquityDrawdownIncome;
  const grossEstimatedIncome = drawdownIncome + guaranteedBenefits.guaranteedIncomeTotal;
  const taxablePensionDrawdownIncome = pensionDrawdownIncome * (1 - inputs.pensionTaxFreePercent / 100);
  const taxableRetirementIncome =
    taxablePensionDrawdownIncome +
    guaranteedBenefits.statePensionIncome +
    guaranteedBenefits.publicPensionIncome +
    guaranteedBenefits.otherGuaranteedIncome;
  const retirementIncomeTax = inputs.includeTaxEstimate ? calculateUkIncomeTax(taxableRetirementIncome) : 0;
  const estimatedIncome = grossEstimatedIncome - retirementIncomeTax;
  const incomeGap = estimatedIncome - futureSpendingTarget;

  return {
    publicPensionLumpSum: guaranteedBenefits.publicPensionLumpSum,
    statePensionIncome: guaranteedBenefits.statePensionIncome,
    publicPensionIncome: guaranteedBenefits.publicPensionIncome,
    otherGuaranteedIncome: guaranteedBenefits.otherGuaranteedIncome,
    pensionFuture,
    isaFuture,
    savingsFuture,
    homeEquityFuture,
    usableHomeEquity,
    projectedNetWorth,
    futureSpendingTarget,
    accessibleAssets,
    drawdownIncome,
    grossEstimatedIncome,
    retirementIncomeTax,
    estimatedIncome,
    incomeGap,
    guaranteedIncomeTotal: guaranteedBenefits.guaranteedIncomeTotal,
    pensionDrawdownRate: getDrawdownBlendedRate(inputs.pensionReturn, inputs),
    isaDrawdownRate: getDrawdownBlendedRate(inputs.isaReturn, inputs),
    savingsDrawdownRate: savingsProjection.drawdownRate,
  };
}

function findAdditionalYearsNeeded(inputs, baseYearsToRetirement) {
  const maxExtraYears = 40;

  for (let extraYears = 0; extraYears <= maxExtraYears; extraYears += 1) {
    const projection = calculateProjection(inputs, baseYearsToRetirement + extraYears);
    if (projection.incomeGap >= 0) {
      return {
        extraYears,
        achievableAge: inputs.retirementAge + extraYears,
        projection,
      };
    }
  }

  return null;
}

function buildGrowthChartData(inputs, currentAge, yearsToRetirement) {
  const series = [];

  for (let year = 0; year <= yearsToRetirement; year += 1) {
    const projection = calculateProjection(inputs, year);
    series.push({
      label: `Age ${currentAge + year}`,
      values: [
        { key: "Public/DB lump sum", value: projection.publicPensionLumpSum, color: "#8f67d8" },
        { key: "Pension", value: projection.pensionFuture, color: "#3e82f7" },
        { key: "S&S ISA", value: projection.isaFuture, color: "#f0a13a" },
        { key: "Other accounts", value: projection.savingsFuture, color: "#7f8cf6" },
        { key: "Home equity", value: projection.homeEquityFuture, color: "#2fa67f" },
      ],
      total: projection.projectedNetWorth,
    });
  }

  return {
    title: "Net worth growth to retirement",
    summary: "Stacked bars show how each part of your net worth builds up between now and retirement.",
    description: "Hover the bars to inspect how your plan grows between now and retirement.",
    legend: [
      { label: "Public/DB lump sum", color: "#8f67d8" },
      { label: "Pension", color: "#3e82f7" },
      { label: "S&S ISA", color: "#f0a13a" },
      { label: "Other accounts", color: "#7f8cf6" },
      { label: "Home equity", color: "#2fa67f" },
    ],
    data: series,
    tooltip(point) {
      const lines = point.values.map((item) => `${item.key}: ${formatCurrency(item.value)}`);
      return {
        title: point.label,
        lines: [...lines, `Total net worth: ${formatCurrency(point.total)}`],
      };
    },
  };
}

function buildContributionChartData(inputs, currentAge, yearsToRetirement) {
  const series = [];

  for (let year = 0; year <= yearsToRetirement; year += 1) {
    const pensionContrib = cumulativeContributionsOverYears(
      inputs.pensionMonthlyTotal,
      year,
      inputs.inflationRate,
      inputs.pensionContributionInflation
    );
    const isaContrib = cumulativeContributionsOverYears(
      inputs.isaMonthly,
      year,
      inputs.inflationRate,
      inputs.isaContributionInflation
    );
    const savingsContrib = inputs.includeOtherAccounts
      ? getSavingsContributionTotalOverYears(year, inputs.inflationRate)
      : 0;
    const total = pensionContrib + isaContrib + savingsContrib;

    series.push({
      label: `Age ${currentAge + year}`,
      values: [
        { key: "Pension contributions", value: pensionContrib, color: "#3e82f7" },
        { key: "ISA contributions", value: isaContrib, color: "#f0a13a" },
        { key: "Other account contributions", value: savingsContrib, color: "#7f8cf6" },
      ],
      total,
    });
  }

  return {
    title: "Cumulative contributions before retirement",
    summary: "These bars focus on how much new money you add over time, separate from investment growth.",
    description: "Hover the bars to see how much you have contributed by each age.",
    legend: [
      { label: "Pension contributions", color: "#3e82f7" },
      { label: "ISA contributions", color: "#f0a13a" },
      { label: "Other accounts", color: "#7f8cf6" },
    ],
    data: series,
    tooltip(point) {
      const lines = point.values.map((item) => `${item.key}: ${formatCurrency(item.value)}`);
      return {
        title: point.label,
        lines: [...lines, `Total contributions: ${formatCurrency(point.total)}`],
      };
    },
  };
}

function buildDrawdownChartData(inputs, retirementProjection, yearsToRetirement) {
  const maxYears = 25;
  const withdrawalBase =
    (retirementProjection.pensionFuture +
      retirementProjection.publicPensionLumpSum +
      retirementProjection.isaFuture +
      retirementProjection.savingsFuture +
      retirementProjection.usableHomeEquity) *
    (inputs.withdrawalRate / 100);

  let pensionBalance = retirementProjection.pensionFuture;
  let publicPensionLumpSumBalance = retirementProjection.publicPensionLumpSum;
  let isaBalance = retirementProjection.isaFuture;
  let savingsBalance = retirementProjection.savingsFuture;
  let homeCashBalance = retirementProjection.usableHomeEquity;
  const series = [];

  for (let year = 0; year <= maxYears; year += 1) {
    const age = inputs.retirementAge + year;
    const openingBalance = pensionBalance + publicPensionLumpSumBalance + isaBalance + savingsBalance + homeCashBalance;
    const withdrawal = withdrawalBase * Math.pow(1 + inputs.inflationRate / 100, year);

    series.push({
      label: `Age ${age}`,
      values: [{ key: "Projected remaining drawdown pot", value: openingBalance, color: "#2768c9" }],
      total: openingBalance,
      withdrawal,
    });

    if (openingBalance <= 0) {
      continue;
    }

    const plannedWithdrawal = Math.min(openingBalance, withdrawal);
    const totalBeforeWithdrawal = Math.max(openingBalance, 1);

    pensionBalance -= plannedWithdrawal * (pensionBalance / totalBeforeWithdrawal);
    publicPensionLumpSumBalance -= plannedWithdrawal * (publicPensionLumpSumBalance / totalBeforeWithdrawal);
    isaBalance -= plannedWithdrawal * (isaBalance / totalBeforeWithdrawal);
    savingsBalance -= plannedWithdrawal * (savingsBalance / totalBeforeWithdrawal);
    homeCashBalance -= plannedWithdrawal * (homeCashBalance / totalBeforeWithdrawal);

    pensionBalance = Math.max(0, pensionBalance * (1 + retirementProjection.pensionDrawdownRate / 100));
    publicPensionLumpSumBalance = Math.max(0, publicPensionLumpSumBalance);
    isaBalance = Math.max(0, isaBalance * (1 + retirementProjection.isaDrawdownRate / 100));
    savingsBalance = Math.max(0, savingsBalance * (1 + retirementProjection.savingsDrawdownRate / 100));
    homeCashBalance = Math.max(0, homeCashBalance);
  }

  return {
    title: "Drawdown projection after retirement",
    summary: "This estimates how your pension pot, ISA, other accounts, and chosen home equity change over the first 25 years after retirement if withdrawals rise with inflation.",
    description: "Hover the bars to compare the remaining drawdown pot and the planned withdrawal each year.",
    legend: [{ label: "Projected remaining drawdown pot", color: "#2768c9" }],
    data: series,
    tooltip(point) {
      return {
        title: point.label,
        lines: [
          `Remaining drawdown pot: ${formatCurrency(point.total)}`,
          `Planned withdrawal that year: ${formatCurrency(point.withdrawal)}`,
        ],
      };
    },
  };
}

function buildChartModel(inputs, currentAge, yearsToRetirement, retirementProjection) {
  if (chartState.mode === "contributions") {
    return buildContributionChartData(inputs, currentAge, yearsToRetirement);
  }

  if (chartState.mode === "drawdown") {
    return buildDrawdownChartData(inputs, retirementProjection, yearsToRetirement);
  }

  return buildGrowthChartData(inputs, currentAge, yearsToRetirement);
}

function renderChartLegend(legend) {
  chartLegend.innerHTML = legend
    .map(
      (item) =>
        `<span class="legend-item"><span class="legend-swatch" style="background:${item.color}"></span>${item.label}</span>`
    )
    .join("");
}

function showChartTooltip(event, payload) {
  const stageRect = chartStage.getBoundingClientRect();
  chartTooltip.hidden = false;
  chartTooltip.innerHTML = `<strong>${payload.title}</strong>${payload.lines
    .map((line) => `<span>${line}</span>`)
    .join("")}`;

  const tooltipWidth = chartTooltip.offsetWidth;
  const tooltipHeight = chartTooltip.offsetHeight;
  const stageWidth = chartStage.clientWidth;
  const stageHeight = chartStage.clientHeight;
  const gap = 12;

  let x = event.clientX - stageRect.left + gap;
  let y = event.clientY - stageRect.top + gap;

  if (x + tooltipWidth > stageWidth - gap) {
    x = stageWidth - tooltipWidth - gap;
  }

  if (y + tooltipHeight > stageHeight - gap) {
    y = event.clientY - stageRect.top - tooltipHeight - gap;
  }

  x = Math.max(gap, x);
  y = Math.max(gap, y);

  chartTooltip.style.left = `${x}px`;
  chartTooltip.style.top = `${y}px`;
}

function hideChartTooltip() {
  chartTooltip.hidden = true;
}

function buildSvgChartMarkup(model) {
  const width = 960;
  const height = 380;
  const margin = { top: 18, right: 18, bottom: 42, left: 62 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const series = model.data;
  const maxTotal = Math.max(...series.map((point) => point.total), 1);
  const step = chartWidth / Math.max(series.length, 1);
  const barWidth = Math.max(14, Math.min(40, step * 0.62));
  const yTicks = 4;

  let svg = "";

  for (let tick = 0; tick <= yTicks; tick += 1) {
    const value = (maxTotal / yTicks) * tick;
    const y = margin.top + chartHeight - (value / maxTotal) * chartHeight;
    svg += `<line class="chart-gridline" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line>`;
    svg += `<text class="chart-ylabel" x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${formatCurrencyShortLabel(
      value
    )}</text>`;
  }

  svg += `<line class="chart-axis" x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${
    width - margin.right
  }" y2="${margin.top + chartHeight}"></line>`;

  series.forEach((point, index) => {
    const x = margin.left + index * step + (step - barWidth) / 2;
    let runningHeight = 0;

    point.values.forEach((segment) => {
      const segmentHeight = maxTotal > 0 ? (segment.value / maxTotal) * chartHeight : 0;
      const y = margin.top + chartHeight - runningHeight - segmentHeight;
      svg += `<rect class="chart-bar" data-point-index="${index}" x="${x}" y="${y}" width="${barWidth}" height="${Math.max(
        0,
        segmentHeight
      )}" rx="6" fill="${segment.color}"></rect>`;
      runningHeight += segmentHeight;
    });

    if (series.length <= 14 || index % Math.ceil(series.length / 8) === 0 || index === series.length - 1) {
      svg += `<text class="chart-xlabel" x="${x + barWidth / 2}" y="${height - 14}" text-anchor="middle">${point.label.replace(
        "Age ",
        ""
      )}</text>`;
    }
  });

  return { svg, series };
}

function renderInteractiveChart(model) {
  setText(outputIds.chartTitle, model.title);
  setText(outputIds.chartSummary, model.summary);
  setText(outputIds.chartDescription, model.description);
  renderChartLegend(model.legend);

  const { svg, series } = buildSvgChartMarkup(model);
  interactiveChart.innerHTML = svg;

  const bars = Array.from(interactiveChart.querySelectorAll(".chart-bar"));
  bars.forEach((bar) => {
    const pointIndex = Number(bar.getAttribute("data-point-index")) || 0;
    const point = series[pointIndex];

    bar.addEventListener("mouseenter", (event) => {
      bars
        .filter((candidate) => candidate.getAttribute("data-point-index") === String(pointIndex))
        .forEach((candidate) => candidate.classList.add("is-hovered"));
      showChartTooltip(event, model.tooltip(point));
    });

    bar.addEventListener("mousemove", (event) => {
      showChartTooltip(event, model.tooltip(point));
    });

    bar.addEventListener("mouseleave", () => {
      bars
        .filter((candidate) => candidate.getAttribute("data-point-index") === String(pointIndex))
        .forEach((candidate) => candidate.classList.remove("is-hovered"));
      hideChartTooltip();
    });
  });
}

function updatePlanner() {
  syncOptionalUi();

  const currentAge = readNumber("currentAge");
  const retirementAge = readNumber("retirementAge");
  const targetSpending = readNumber("targetSpending");
  const inflationRate = readNumber("inflationRate");
  const withdrawalRate = readNumber("withdrawalRate");
  const includeAssetMix = isChecked("includeAssetMix");
  const equityAllocationNow = readNumber("equityAllocationNow");
  const equityAllocationRetirement = readNumber("equityAllocationRetirement");
  const deriskingStartYears = readNumber("deriskingStartYears");
  const defensiveReturn = readNumber("defensiveReturn");
  const includeStatePension = isChecked("includeStatePension");
  const includePublicPension = isChecked("includePublicPension");
  const includeOtherGuaranteedIncome = isChecked("includeOtherGuaranteedIncome");
  const includePension = isChecked("includePension");
  const includeIsa = isChecked("includeIsa");
  const includeOtherAccounts = isChecked("includeOtherAccounts");
  const includeHome = isChecked("includeHome");
  const includeTaxEstimate = isChecked("includeTaxEstimate");
  const taxBand = document.getElementById("taxBand")?.value || "basic";

  const statePensionIncome = includeStatePension ? readNumber("statePensionIncome") : 0;
  const statePensionStartAge = includeStatePension ? readNumber("statePensionStartAge") : 67;
  const publicPensionIncome = includePublicPension ? readNumber("publicPensionIncome") : 0;
  const publicPensionStartAge = includePublicPension ? readNumber("publicPensionStartAge") : retirementAge;
  const publicPensionLumpSumInput = includePublicPension ? readNumber("publicPensionLumpSum") : 0;
  const otherGuaranteedIncome = includeOtherGuaranteedIncome ? readNumber("otherGuaranteedIncome") : 0;

  const pensionCurrent = includePension ? readNumber("pensionCurrent") : 0;
  const pensionReturn = includePension ? readNumber("pensionReturn") : 0;
  const pensionMonthlyEmployee = includePension ? readNumber("pensionMonthlyEmployee") : 0;
  const pensionMonthlyEmployer = includePension ? readNumber("pensionMonthlyEmployer") : 0;
  const pensionContributionInflation = includePension && isChecked("pensionContributionInflation");
  const pensionTaxFreePercent = includePension ? readNumber("pensionTaxFreePercent") : 25;

  const isaCurrent = includeIsa ? readNumber("isaCurrent") : 0;
  const isaReturn = includeIsa ? readNumber("isaReturn") : 0;
  const isaMonthly = includeIsa ? readNumber("isaMonthly") : 0;
  const isaContributionInflation = includeIsa && isChecked("isaContributionInflation");

  const homeValue = includeHome ? readNumber("homeValue") : 0;
  const homeGrowth = includeHome ? readNumber("homeGrowth") : 0;
  const mortgageBalance = includeHome ? readNumber("mortgageBalance") : 0;
  const mortgageRate = includeHome ? readNumber("mortgageRate") : 0;
  const mortgageTermYears = includeHome ? readNumber("mortgageTermYears") : 0;
  const equityUsageRate = includeHome ? readNumber("equityUsageRate") : 0;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const inputs = {
    currentAge,
    retirementAge,
    targetSpending,
    inflationRate,
    withdrawalRate,
    includeAssetMix,
    equityAllocationNow,
    equityAllocationRetirement,
    deriskingStartYears,
    defensiveReturn,
    includeStatePension,
    statePensionIncome,
    statePensionStartAge,
    includePublicPension,
    publicPensionIncome,
    publicPensionStartAge,
    publicPensionLumpSum: publicPensionLumpSumInput,
    otherGuaranteedIncome,
    pensionCurrent,
    pensionReturn,
    pensionMonthlyTotal: pensionMonthlyEmployee + pensionMonthlyEmployer,
    pensionContributionInflation,
    pensionTaxFreePercent,
    isaCurrent,
    isaReturn,
    isaMonthly,
    isaContributionInflation,
    includeOtherAccounts,
    includeTaxEstimate,
    taxBand,
    homeValue,
    homeGrowth,
    mortgageBalance,
    mortgageRate,
    mortgageTermYears,
    equityUsageRate,
  };

  const projection = calculateProjection(inputs, yearsToRetirement);
  const {
    publicPensionLumpSum,
    statePensionIncome: statePensionIncomeAtRetirement,
    publicPensionIncome: publicPensionIncomeAtRetirement,
    otherGuaranteedIncome: otherGuaranteedIncomeAtRetirement,
    pensionFuture,
    isaFuture,
    savingsFuture,
    homeEquityFuture,
    usableHomeEquity,
    projectedNetWorth,
    futureSpendingTarget,
    drawdownIncome,
    grossEstimatedIncome,
    retirementIncomeTax,
    estimatedIncome,
    incomeGap,
  } = projection;

  const publicPensionLumpSumShare =
    projectedNetWorth > 0 ? (publicPensionLumpSum / projectedNetWorth) * 100 : 0;
  const pensionShare = projectedNetWorth > 0 ? (pensionFuture / projectedNetWorth) * 100 : 0;
  const isaShare = projectedNetWorth > 0 ? (isaFuture / projectedNetWorth) * 100 : 0;
  const savingsShare = projectedNetWorth > 0 ? (savingsFuture / projectedNetWorth) * 100 : 0;
  const homeShare = projectedNetWorth > 0 ? (homeEquityFuture / projectedNetWorth) * 100 : 0;

  const readinessTitle =
    incomeGap >= 0
      ? "On track with a projected surplus"
      : `There is a projected retirement income gap at age ${retirementAge}`;
  const gapLabel = incomeGap >= 0 ? "Expected surplus" : "Expected shortfall";
  const gapValue = formatCurrency(Math.abs(incomeGap));

  setText(outputIds.yearsToRetirement, numberFormatter.format(yearsToRetirement));
  setText(outputIds.projectedNetWorth, formatCurrency(projectedNetWorth));
  setText(outputIds.estimatedIncome, formatCurrency(estimatedIncome));
  setText(outputIds.incomeGapLabel, gapLabel);
  setText(outputIds.incomeGap, gapValue);
  setText(
    outputIds.incomeGapNote,
    incomeGap >= 0
      ? "Your projected after-tax yearly income is above your target."
      : "Your projected after-tax yearly income is below your target."
  );

  setText(outputIds.readinessTitle, readinessTitle);
  let resultExplainer =
    incomeGap >= 0
      ? "At your planned retirement age, your projected after-tax yearly income is higher than the amount you want to spend."
      : "At your planned retirement age, your projected after-tax yearly income is lower than the amount you want to spend.";
  setText(outputIds.futureSpendingTarget, formatCurrency(futureSpendingTarget));
  setText(outputIds.answerIncomeOutput, formatCurrency(estimatedIncome));
  setText(outputIds.answerDifferenceLabel, gapLabel);
  setText(outputIds.answerDifference, gapValue);
  setText(
    outputIds.answerDifferenceNote,
    incomeGap >= 0
      ? "This is the extra after-tax yearly income above your target."
      : "This is the extra after-tax yearly income you would still need."
  );
  const nextDelayedIncome = getNextDelayedIncomeStart(inputs);
  const laterIncomeCallout = document.getElementById(outputIds.laterIncomeCallout);
  if (nextDelayedIncome) {
    const laterIncome = calculateIncomeAtAge(inputs, projection, nextDelayedIncome.age);
    const sourceList = nextDelayedIncome.labels.join(" and ");
    const laterGap = laterIncome.incomeGap;

    if (incomeGap < 0 && laterGap >= 0) {
      resultExplainer = `At age ${retirementAge} there is still an after-tax income gap, but the plan looks on track from age ${nextDelayedIncome.age} once ${sourceList} starts.`;
    }

    setHidden(outputIds.laterIncomeCallout, false);
    laterIncomeCallout?.classList.toggle("is-positive", laterGap >= 0);
    setText(
      outputIds.laterIncomeTitle,
      laterGap >= 0
        ? `On track from age ${nextDelayedIncome.age} once ${sourceList} starts`
        : `Still below target at age ${nextDelayedIncome.age} even after ${sourceList} starts`
    );
    setText(
      outputIds.laterIncomeCopy,
      `After-tax income at age ${retirementAge}: ${formatCurrency(estimatedIncome)} a year against a target of ${formatCurrency(
        futureSpendingTarget
      )}. After-tax income from age ${nextDelayedIncome.age}: about ${formatCurrency(
        laterIncome.estimatedIncome
      )} a year against a target of ${formatCurrency(laterIncome.futureSpendingTarget)}.`
    );
  } else {
    setHidden(outputIds.laterIncomeCallout, true);
    laterIncomeCallout?.classList.remove("is-positive");
  }
  setText(outputIds.resultExplainer, resultExplainer);

  const additionalYears = findAdditionalYearsNeeded(inputs, yearsToRetirement);
  if (!additionalYears) {
    setText(outputIds.extraYearsTitle, "This plan does not become achievable within 40 extra years");
    setText(
      outputIds.extraYearsCopy,
      "Using the same contributions, growth rates, and income assumptions, delaying retirement alone does not close the gap within the next 40 years."
    );
  } else if (additionalYears.extraYears === 0) {
    setText(outputIds.extraYearsTitle, "You do not need extra years beyond your chosen age");
    setText(
      outputIds.extraYearsCopy,
      `Based on these assumptions, the plan is already achievable at age ${retirementAge}.`
    );
  } else {
    const yearLabel = additionalYears.extraYears === 1 ? "year" : "years";
    setText(
      outputIds.extraYearsTitle,
      `You may need to work ${additionalYears.extraYears} extra ${yearLabel}`
    );
    setText(
      outputIds.extraYearsCopy,
      `Keeping the same contributions and assumptions, the plan first becomes achievable at about age ${additionalYears.achievableAge}.`
    );
  }

  setText(outputIds.publicPensionLumpSumOutput, formatCurrency(publicPensionLumpSum));
  setText(outputIds.pensionFutureValue, formatCurrency(pensionFuture));
  setText(outputIds.isaFutureValue, formatCurrency(isaFuture));
  setText(outputIds.savingsFutureValue, formatCurrency(savingsFuture));
  setText(outputIds.homeEquityValue, formatCurrency(homeEquityFuture));
  setText(outputIds.usableEquityValue, formatCurrency(usableHomeEquity));
  setText(outputIds.pensionChartValue, formatCurrency(pensionFuture));
  setText(outputIds.isaChartValue, formatCurrency(isaFuture));
  setText(outputIds.savingsChartValue, formatCurrency(savingsFuture));
  setText(outputIds.homeChartValue, formatCurrency(homeEquityFuture));

  const maxAssetValue = Math.max(pensionFuture, isaFuture, savingsFuture, homeEquityFuture, 1);
  setWidth(outputIds.pensionBalanceBar, (pensionFuture / maxAssetValue) * 100);
  setWidth(outputIds.isaBalanceBar, (isaFuture / maxAssetValue) * 100);
  setWidth(outputIds.savingsBalanceBar, (savingsFuture / maxAssetValue) * 100);
  setWidth(outputIds.homeBalanceBar, (homeEquityFuture / maxAssetValue) * 100);

  const maxIncomeValue = Math.max(futureSpendingTarget, estimatedIncome, 1);
  setText(outputIds.targetIncomeChartValue, formatCurrency(futureSpendingTarget));
  setText(outputIds.projectedIncomeChartValue, formatCurrency(estimatedIncome));
  setWidth(outputIds.targetIncomeBar, (futureSpendingTarget / maxIncomeValue) * 100);
  setWidth(outputIds.projectedIncomeBar, (estimatedIncome / maxIncomeValue) * 100);
  setText(
    outputIds.resultsGapSummary,
    incomeGap >= 0
      ? `Your projected after-tax income is about ${formatCurrency(Math.abs(incomeGap))} above your target.`
      : `Your projected after-tax income is about ${formatCurrency(Math.abs(incomeGap))} below your target.`
  );

  setWidth(outputIds.publicPensionLumpSumShare, publicPensionLumpSumShare);
  setWidth(outputIds.pensionShare, pensionShare);
  setWidth(outputIds.isaShare, isaShare);
  setWidth(outputIds.savingsShare, savingsShare);
  setWidth(outputIds.homeShare, homeShare);

  setText(outputIds.publicPensionLumpSumShareLabel, formatPercent(publicPensionLumpSumShare));
  setText(outputIds.pensionShareLabel, formatPercent(pensionShare));
  setText(outputIds.isaShareLabel, formatPercent(isaShare));
  setText(outputIds.savingsShareLabel, formatPercent(savingsShare));
  setText(outputIds.homeShareLabel, formatPercent(homeShare));

  setText(outputIds.drawdownIncome, formatCurrency(drawdownIncome));
  setText(outputIds.statePensionIncomeOutput, formatCurrency(statePensionIncomeAtRetirement));
  setText(outputIds.publicPensionIncomeOutput, formatCurrency(publicPensionIncomeAtRetirement));
  setText(outputIds.otherGuaranteedIncomeOutput, formatCurrency(otherGuaranteedIncomeAtRetirement));
  setText(outputIds.grossIncomeOutput, formatCurrency(grossEstimatedIncome));
  setText(outputIds.incomeTaxOutput, formatCurrency(retirementIncomeTax));
  setText(outputIds.totalIncomeOutput, formatCurrency(estimatedIncome));

  if (includeAssetMix) {
    setText(
      outputIds.assumptionGrowth,
      `Invested assets use a glide path from ${clampPercentage(equityAllocationNow)}% equity today to ${clampPercentage(
        equityAllocationRetirement
      )}% at retirement, with ${defensiveReturn}% for lower-risk assets.`
    );
  } else {
    setText(
      outputIds.assumptionGrowth,
      "Invested assets use the return you enter for each section directly, with no automatic derisking or rebalance glide path."
    );
  }
  setText(
    outputIds.assumptionInflation,
    `Your ${formatCurrency(targetSpending)} target is inflated by ${inflationRate}% for ${yearsToRetirement} years. Any contribution options switched to inflation-linked also step up once a year at the same rate. State pension starts at ${statePensionStartAge}, and public/DB pension starts at ${publicPensionStartAge}.`
  );
  if (includeTaxEstimate) {
    const taxProfile = getUkTaxProfile(taxBand);
    setText(
      outputIds.assumptionTax,
      `A simple ${taxProfile.label} UK tax estimate is applied to taxable savings, GIA returns, and retirement income. Private pension withdrawals are assumed to be ${pensionTaxFreePercent}% tax-free, while state and DB/public pension income are treated as taxable.`
    );
  } else {
    setText(
      outputIds.assumptionTax,
      "Tax is not being estimated on retirement income or taxable accounts, so GIA, taxable savings, and pension income may look optimistic."
    );
  }
  setText(
    outputIds.assumptionEquity,
    `Home equity uses a ${mortgageRate}% mortgage rate with ${mortgageTermYears} years remaining, and ${equityUsageRate}% of projected equity is included in retirement funding.`
  );
  setText(outputIds.equityUsageLabel, `${equityUsageRate}%`);
  updateWithdrawalGuidance(withdrawalRate);

  const chartModel = buildChartModel(inputs, currentAge, yearsToRetirement, projection);
  renderInteractiveChart(chartModel);
  savePlannerState();
}

applySavingsRowState(DEFAULT_SAVINGS_ROWS);
const defaultPlannerState = {
  fields: captureFieldState(),
  savingsRows: getSavingsRowState(),
  disclosures: captureDisclosureState(),
  chartMode: chartState.mode,
};
loadPlannerState();

addSavingsAccountButton.addEventListener("click", () => {
  createSavingsRow();
  updatePlanner();
});

withdrawalPresetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    withdrawalRateInput.value = button.dataset.rate || "4";
    updatePlanner();
  });
});

chartModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setChartMode(button.dataset.chartMode || "growth");
    updatePlanner();
  });
});

optionalSections.forEach(({ toggleId }) => {
  document.getElementById(toggleId)?.addEventListener("change", updatePlanner);
});

optionalFields.forEach(({ toggleId }) => {
  document.getElementById(toggleId)?.addEventListener("change", updatePlanner);
});

planner.addEventListener("input", updatePlanner);
planner.addEventListener("change", updatePlanner);

plannerSummaryToggles.forEach((toggle) => {
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

resetPlannerButton?.addEventListener("click", () => {
  try {
    window.localStorage.removeItem(PLANNER_STORAGE_KEY);
  } catch (error) {
    // Ignore localStorage failures and still restore defaults in-memory.
  }

  applyFieldState(defaultPlannerState.fields);
  applySavingsRowState(defaultPlannerState.savingsRows);
  applyDisclosureState(defaultPlannerState.disclosures);
  setChartMode(defaultPlannerState.chartMode);
  updatePlanner();
});

updatePlanner();
