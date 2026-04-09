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
const withdrawalRateInput = document.getElementById("withdrawalRate");
const withdrawalPresetButtons = Array.from(document.querySelectorAll(".rate-preset"));
const chartModeButtons = Array.from(document.querySelectorAll("[data-chart-mode]"));
const interactiveChart = document.getElementById("interactiveChart");
const chartTooltip = document.getElementById("chartTooltip");
const chartStage = document.getElementById("chartStage");
const chartLegend = document.getElementById("chartLegend");
const optionalSections = [
  { toggleId: "includePension", containerId: "pensionSection" },
  { toggleId: "includeIsa", containerId: "isaSection" },
  { toggleId: "includeOtherAccounts", containerId: "otherAccountsSection" },
  { toggleId: "includeHome", containerId: "homeSection" },
];
const optionalFields = [
  { toggleId: "includeStatePension", containerId: "statePensionField", inputId: "statePensionIncome" },
  {
    toggleId: "includeOtherGuaranteedIncome",
    containerId: "otherGuaranteedIncomeField",
    inputId: "otherGuaranteedIncome",
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
  pensionShareLabel: "pension-share-label",
  isaShareLabel: "isa-share-label",
  savingsShareLabel: "savings-share-label",
  homeShareLabel: "home-share-label",
  drawdownIncome: "drawdown-income",
  statePensionIncomeOutput: "state-pension-income-output",
  otherGuaranteedIncomeOutput: "other-guaranteed-income-output",
  totalIncomeOutput: "total-income-output",
  assumptionGrowth: "assumption-growth",
  assumptionInflation: "assumption-inflation",
  assumptionEquity: "assumption-equity",
  equityUsageLabel: "equity-usage-label",
  chartTitle: "chartTitle",
  chartSummary: "chartSummary",
  chartDescription: "chartDescription",
};

const chartState = {
  mode: "growth",
};

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

function futureValueWithMonthlyContributionsSchedule(initial, monthlyContribution, years, annualRateAtMonth) {
  const safeYears = Math.max(0, years);
  const months = Math.round(safeYears * 12);
  let balance = initial;

  for (let month = 0; month < months; month += 1) {
    const annualRate = annualRateAtMonth(month);
    const monthlyRate = annualRate / 100 / 12;
    balance = balance * (1 + monthlyRate) + monthlyContribution;
  }

  return balance;
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
  const removeButton = fragment.querySelector(".remove-button");

  const selectedType = values.type || "cash_isa";
  const defaultRate = savingsTypeDefaults[selectedType].rate;

  typeField.value = selectedType;
  balanceField.value = values.balance ?? 0;
  monthlyField.value = values.monthly ?? 0;
  rateField.value = values.rate ?? defaultRate;
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

    return total + futureValueWithMonthlyContributions(balance, monthly, rate, yearsToRetirement);
  }, 0);
}

function clampPercentage(value) {
  return Math.max(0, Math.min(100, value));
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
  const yearsElapsed = monthIndex / 12;
  const yearsRemaining = Math.max(0, totalYearsToRetirement - yearsElapsed);
  const equityAllocation = getEquityAllocationPreRetirement(yearsRemaining, inputs);
  return blendedReturn(growthReturn, inputs.defensiveReturn, equityAllocation);
}

function getDrawdownBlendedRate(growthReturn, inputs) {
  return blendedReturn(growthReturn, inputs.defensiveReturn, inputs.equityAllocationDrawdown);
}

function isGlidePathSavingsType(type) {
  return type === "gia";
}

function calculateSavingsProjection(yearsToRetirement, inputs) {
  let total = 0;
  let drawdownWeightedRate = 0;
  let weightTotal = 0;

  getSavingsRows().forEach((row) => {
    const type = row.querySelector(".savings-type")?.value || "savings_account";
    const balance = Number(row.querySelector(".savings-balance")?.value) || 0;
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    const rate = Number(row.querySelector(".savings-rate")?.value) || 0;

    let futureValue = 0;
    let postRetirementRate = rate;

    if (isGlidePathSavingsType(type)) {
      futureValue = futureValueWithMonthlyContributionsSchedule(
        balance,
        monthly,
        yearsToRetirement,
        (month) => getPreRetirementBlendedRate(rate, month, yearsToRetirement, inputs)
      );
      postRetirementRate = getDrawdownBlendedRate(rate, inputs);
    } else {
      futureValue = futureValueWithMonthlyContributions(balance, monthly, rate, yearsToRetirement);
    }

    total += futureValue;
    drawdownWeightedRate += futureValue * postRetirementRate;
    weightTotal += futureValue;
  });

  return {
    total,
    drawdownRate: weightTotal > 0 ? drawdownWeightedRate / weightTotal : 0,
  };
}

function getSavingsMonthlyContribution() {
  return getSavingsRows().reduce((total, row) => {
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    return total + monthly;
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

  optionalFields.forEach(({ toggleId, containerId, inputId }) => {
    const enabled = isChecked(toggleId);
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    if (!container || !input) {
      return;
    }

    container.classList.toggle("is-disabled", !enabled);
    input.disabled = !enabled;
  });
}

function calculateProjection(inputs, yearsToRetirement) {
  const pensionFuture = futureValueWithMonthlyContributionsSchedule(
    inputs.pensionCurrent,
    inputs.pensionMonthlyTotal,
    yearsToRetirement,
    (month) => getPreRetirementBlendedRate(inputs.pensionReturn, month, yearsToRetirement, inputs)
  );

  const isaFuture = futureValueWithMonthlyContributionsSchedule(
    inputs.isaCurrent,
    inputs.isaMonthly,
    yearsToRetirement,
    (month) => getPreRetirementBlendedRate(inputs.isaReturn, month, yearsToRetirement, inputs)
  );

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

  const projectedNetWorth = pensionFuture + isaFuture + savingsFuture + homeEquityFuture;
  const futureSpendingTarget =
    inputs.targetSpending * Math.pow(1 + inputs.inflationRate / 100, Math.max(0, yearsToRetirement));
  const accessibleAssets = pensionFuture + isaFuture + savingsFuture + usableHomeEquity;
  const drawdownIncome = accessibleAssets * (inputs.withdrawalRate / 100);
  const estimatedIncome = drawdownIncome + inputs.guaranteedIncome;
  const incomeGap = estimatedIncome - futureSpendingTarget;

  return {
    pensionFuture,
    isaFuture,
    savingsFuture,
    homeEquityFuture,
    usableHomeEquity,
    projectedNetWorth,
    futureSpendingTarget,
    drawdownIncome,
    estimatedIncome,
    incomeGap,
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
  const pensionYearly = inputs.pensionMonthlyTotal * 12;
  const isaYearly = inputs.isaMonthly * 12;
  const savingsYearly = inputs.includeOtherAccounts ? getSavingsMonthlyContribution() * 12 : 0;
  const series = [];

  for (let year = 0; year <= yearsToRetirement; year += 1) {
    const pensionContrib = pensionYearly * year;
    const isaContrib = isaYearly * year;
    const savingsContrib = savingsYearly * year;
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
      retirementProjection.isaFuture +
      retirementProjection.savingsFuture +
      retirementProjection.usableHomeEquity) *
    (inputs.withdrawalRate / 100);

  let pensionBalance = retirementProjection.pensionFuture;
  let isaBalance = retirementProjection.isaFuture;
  let savingsBalance = retirementProjection.savingsFuture;
  let homeCashBalance = retirementProjection.usableHomeEquity;
  const series = [];

  for (let year = 0; year <= maxYears; year += 1) {
    const age = inputs.retirementAge + year;
    const openingBalance = pensionBalance + isaBalance + savingsBalance + homeCashBalance;
    const withdrawal = withdrawalBase * Math.pow(1 + inputs.inflationRate / 100, year);

    series.push({
      label: `Age ${age}`,
      values: [{ key: "Projected remaining pot", value: openingBalance, color: "#2768c9" }],
      total: openingBalance,
      withdrawal,
    });

    if (openingBalance <= 0) {
      continue;
    }

    const plannedWithdrawal = Math.min(openingBalance, withdrawal);
    const totalBeforeWithdrawal = Math.max(openingBalance, 1);

    pensionBalance -= plannedWithdrawal * (pensionBalance / totalBeforeWithdrawal);
    isaBalance -= plannedWithdrawal * (isaBalance / totalBeforeWithdrawal);
    savingsBalance -= plannedWithdrawal * (savingsBalance / totalBeforeWithdrawal);
    homeCashBalance -= plannedWithdrawal * (homeCashBalance / totalBeforeWithdrawal);

    pensionBalance = Math.max(0, pensionBalance * (1 + retirementProjection.pensionDrawdownRate / 100));
    isaBalance = Math.max(0, isaBalance * (1 + retirementProjection.isaDrawdownRate / 100));
    savingsBalance = Math.max(0, savingsBalance * (1 + retirementProjection.savingsDrawdownRate / 100));
    homeCashBalance = Math.max(0, homeCashBalance);
  }

  return {
    title: "Drawdown projection after retirement",
    summary: "This estimates how your accessible retirement pot changes over the first 25 years after retirement if withdrawals rise with inflation.",
    description: "Hover the bars to compare the remaining pot and the planned withdrawal each year.",
    legend: [{ label: "Projected remaining pot", color: "#2768c9" }],
    data: series,
    tooltip(point) {
      return {
        title: point.label,
        lines: [
          `Remaining pot: ${formatCurrency(point.total)}`,
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
  const x = event.clientX - stageRect.left + 12;
  const y = event.clientY - stageRect.top + 12;
  chartTooltip.hidden = false;
  chartTooltip.innerHTML = `<strong>${payload.title}</strong>${payload.lines
    .map((line) => `<span>${line}</span>`)
    .join("")}`;
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
  const equityAllocationNow = readNumber("equityAllocationNow");
  const equityAllocationRetirement = readNumber("equityAllocationRetirement");
  const equityAllocationDrawdown = readNumber("equityAllocationDrawdown");
  const deriskingStartYears = readNumber("deriskingStartYears");
  const defensiveReturn = readNumber("defensiveReturn");
  const includeStatePension = isChecked("includeStatePension");
  const includeOtherGuaranteedIncome = isChecked("includeOtherGuaranteedIncome");
  const includePension = isChecked("includePension");
  const includeIsa = isChecked("includeIsa");
  const includeOtherAccounts = isChecked("includeOtherAccounts");
  const includeHome = isChecked("includeHome");

  const statePensionIncome = includeStatePension ? readNumber("statePensionIncome") : 0;
  const otherGuaranteedIncome = includeOtherGuaranteedIncome ? readNumber("otherGuaranteedIncome") : 0;
  const guaranteedIncome = statePensionIncome + otherGuaranteedIncome;

  const pensionCurrent = includePension ? readNumber("pensionCurrent") : 0;
  const pensionReturn = includePension ? readNumber("pensionReturn") : 0;
  const pensionMonthlyEmployee = includePension ? readNumber("pensionMonthlyEmployee") : 0;
  const pensionMonthlyEmployer = includePension ? readNumber("pensionMonthlyEmployer") : 0;

  const isaCurrent = includeIsa ? readNumber("isaCurrent") : 0;
  const isaReturn = includeIsa ? readNumber("isaReturn") : 0;
  const isaMonthly = includeIsa ? readNumber("isaMonthly") : 0;

  const homeValue = includeHome ? readNumber("homeValue") : 0;
  const homeGrowth = includeHome ? readNumber("homeGrowth") : 0;
  const mortgageBalance = includeHome ? readNumber("mortgageBalance") : 0;
  const mortgageRate = includeHome ? readNumber("mortgageRate") : 0;
  const mortgageTermYears = includeHome ? readNumber("mortgageTermYears") : 0;
  const equityUsageRate = includeHome ? readNumber("equityUsageRate") : 0;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const inputs = {
    retirementAge,
    targetSpending,
    inflationRate,
    withdrawalRate,
    equityAllocationNow,
    equityAllocationRetirement,
    equityAllocationDrawdown,
    deriskingStartYears,
    defensiveReturn,
    guaranteedIncome,
    pensionCurrent,
    pensionReturn,
    pensionMonthlyTotal: pensionMonthlyEmployee + pensionMonthlyEmployer,
    isaCurrent,
    isaReturn,
    isaMonthly,
    includeOtherAccounts,
    homeValue,
    homeGrowth,
    mortgageBalance,
    mortgageRate,
    mortgageTermYears,
    equityUsageRate,
  };

  const projection = calculateProjection(inputs, yearsToRetirement);
  const {
    pensionFuture,
    isaFuture,
    savingsFuture,
    homeEquityFuture,
    usableHomeEquity,
    projectedNetWorth,
    futureSpendingTarget,
    drawdownIncome,
    estimatedIncome,
    incomeGap,
  } = projection;

  const pensionShare = projectedNetWorth > 0 ? (pensionFuture / projectedNetWorth) * 100 : 0;
  const isaShare = projectedNetWorth > 0 ? (isaFuture / projectedNetWorth) * 100 : 0;
  const savingsShare = projectedNetWorth > 0 ? (savingsFuture / projectedNetWorth) * 100 : 0;
  const homeShare = projectedNetWorth > 0 ? (homeEquityFuture / projectedNetWorth) * 100 : 0;

  const readinessTitle =
    incomeGap >= 0
      ? "On track with a projected surplus"
      : "There is a projected retirement income gap";
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
      ? "Your projected yearly income is above your target."
      : "Your projected yearly income is below your target."
  );

  setText(outputIds.readinessTitle, readinessTitle);
  setText(
    outputIds.resultExplainer,
    incomeGap >= 0
      ? "At your planned retirement age, your projected yearly income is higher than the amount you want to spend."
      : "At your planned retirement age, your projected yearly income is lower than the amount you want to spend."
  );
  setText(outputIds.futureSpendingTarget, formatCurrency(futureSpendingTarget));
  setText(outputIds.answerIncomeOutput, formatCurrency(estimatedIncome));
  setText(outputIds.answerDifferenceLabel, gapLabel);
  setText(outputIds.answerDifference, gapValue);
  setText(
    outputIds.answerDifferenceNote,
    incomeGap >= 0
      ? "This is the extra yearly income above your target."
      : "This is the extra yearly income you would still need."
  );

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
      ? `Your projected income is about ${formatCurrency(Math.abs(incomeGap))} above your target.`
      : `Your projected income is about ${formatCurrency(Math.abs(incomeGap))} below your target.`
  );

  setWidth(outputIds.pensionShare, pensionShare);
  setWidth(outputIds.isaShare, isaShare);
  setWidth(outputIds.savingsShare, savingsShare);
  setWidth(outputIds.homeShare, homeShare);

  setText(outputIds.pensionShareLabel, formatPercent(pensionShare));
  setText(outputIds.isaShareLabel, formatPercent(isaShare));
  setText(outputIds.savingsShareLabel, formatPercent(savingsShare));
  setText(outputIds.homeShareLabel, formatPercent(homeShare));

  setText(outputIds.drawdownIncome, formatCurrency(drawdownIncome));
  setText(outputIds.statePensionIncomeOutput, formatCurrency(statePensionIncome));
  setText(outputIds.otherGuaranteedIncomeOutput, formatCurrency(otherGuaranteedIncome));
  setText(outputIds.totalIncomeOutput, formatCurrency(estimatedIncome));

  setText(
    outputIds.assumptionGrowth,
    `Invested assets use a glide path from ${clampPercentage(equityAllocationNow)}% equity today to ${clampPercentage(
      equityAllocationRetirement
    )}% at retirement, then ${clampPercentage(equityAllocationDrawdown)}% in drawdown, with ${defensiveReturn}% for lower-risk assets.`
  );
  setText(
    outputIds.assumptionInflation,
    `Your ${formatCurrency(targetSpending)} target is inflated by ${inflationRate}% for ${yearsToRetirement} years.`
  );
  setText(
    outputIds.assumptionEquity,
    `Home equity uses a ${mortgageRate}% mortgage rate with ${mortgageTermYears} years remaining, and ${equityUsageRate}% of projected equity is included in retirement funding.`
  );
  setText(outputIds.equityUsageLabel, `${equityUsageRate}%`);
  updateWithdrawalGuidance(withdrawalRate);

  const chartModel = buildChartModel(inputs, currentAge, yearsToRetirement, projection);
  renderInteractiveChart(chartModel);
}

createSavingsRow({ type: "cash_isa", balance: 20000, monthly: 150, rate: 3.5 });
createSavingsRow({ type: "premium_bonds", balance: 10000, monthly: 50, rate: 4.0 });

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
    chartState.mode = button.dataset.chartMode || "growth";
    chartModeButtons.forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === button);
    });
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

updatePlanner();
