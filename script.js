const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

const planner = document.querySelector("[data-planner]");

const outputIds = {
  yearsToRetirement: "years-to-retirement",
  projectedNetWorth: "projected-net-worth",
  estimatedIncome: "estimated-income",
  incomeGap: "income-gap",
  incomeGapNote: "income-gap-note",
  readinessTitle: "readiness-title",
  futureSpendingTarget: "future-spending-target",
  pensionFutureValue: "pension-future-value",
  isaFutureValue: "isa-future-value",
  homeEquityValue: "home-equity-value",
  usableEquityValue: "usable-equity-value",
  pensionShare: "pension-share",
  isaShare: "isa-share",
  homeShare: "home-share",
  pensionShareLabel: "pension-share-label",
  isaShareLabel: "isa-share-label",
  homeShareLabel: "home-share-label",
  drawdownIncome: "drawdown-income",
  guaranteedIncomeOutput: "guaranteed-income-output",
  totalIncomeOutput: "total-income-output",
  assumptionGrowth: "assumption-growth",
  assumptionInflation: "assumption-inflation",
  assumptionEquity: "assumption-equity",
  equityUsageLabel: "equity-usage-label",
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

function futureValueLumpSum(initial, annualRate, years) {
  return initial * Math.pow(1 + annualRate / 100, Math.max(0, years));
}

function formatCurrency(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function updatePlanner() {
  const currentAge = readNumber("currentAge");
  const retirementAge = readNumber("retirementAge");
  const targetSpending = readNumber("targetSpending");
  const inflationRate = readNumber("inflationRate");
  const withdrawalRate = readNumber("withdrawalRate");
  const guaranteedIncome = readNumber("guaranteedIncome");

  const pensionCurrent = readNumber("pensionCurrent");
  const pensionReturn = readNumber("pensionReturn");
  const pensionMonthlyEmployee = readNumber("pensionMonthlyEmployee");
  const pensionMonthlyEmployer = readNumber("pensionMonthlyEmployer");

  const isaCurrent = readNumber("isaCurrent");
  const isaReturn = readNumber("isaReturn");
  const isaMonthly = readNumber("isaMonthly");

  const homeValue = readNumber("homeValue");
  const homeGrowth = readNumber("homeGrowth");
  const mortgageBalance = readNumber("mortgageBalance");
  const mortgageMonthlyReduction = readNumber("mortgageMonthlyReduction");
  const equityUsageRate = readNumber("equityUsageRate");

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const pensionMonthlyTotal = pensionMonthlyEmployee + pensionMonthlyEmployer;

  const pensionFuture = futureValueWithMonthlyContributions(
    pensionCurrent,
    pensionMonthlyTotal,
    pensionReturn,
    yearsToRetirement
  );

  const isaFuture = futureValueWithMonthlyContributions(
    isaCurrent,
    isaMonthly,
    isaReturn,
    yearsToRetirement
  );

  const homeValueFuture = futureValueLumpSum(homeValue, homeGrowth, yearsToRetirement);
  const projectedMortgageBalance = Math.max(
    0,
    mortgageBalance - mortgageMonthlyReduction * 12 * yearsToRetirement
  );
  const homeEquityFuture = Math.max(0, homeValueFuture - projectedMortgageBalance);
  const usableHomeEquity = homeEquityFuture * (equityUsageRate / 100);

  const projectedNetWorth = pensionFuture + isaFuture + homeEquityFuture;
  const futureSpendingTarget =
    targetSpending * Math.pow(1 + inflationRate / 100, Math.max(0, yearsToRetirement));
  const accessibleAssets = pensionFuture + isaFuture + usableHomeEquity;
  const drawdownIncome = accessibleAssets * (withdrawalRate / 100);
  const estimatedIncome = drawdownIncome + guaranteedIncome;
  const incomeGap = estimatedIncome - futureSpendingTarget;

  const pensionShare = projectedNetWorth > 0 ? (pensionFuture / projectedNetWorth) * 100 : 0;
  const isaShare = projectedNetWorth > 0 ? (isaFuture / projectedNetWorth) * 100 : 0;
  const homeShare = projectedNetWorth > 0 ? (homeEquityFuture / projectedNetWorth) * 100 : 0;

  const readinessTitle =
    incomeGap >= 0
      ? "On track with a projected surplus"
      : "There is a projected retirement income gap";
  const gapLabel =
    incomeGap >= 0
      ? `Projected annual surplus of ${formatCurrency(Math.abs(incomeGap))}`
      : `Projected annual gap of ${formatCurrency(Math.abs(incomeGap))}`;

  setText(outputIds.yearsToRetirement, numberFormatter.format(yearsToRetirement));
  setText(outputIds.projectedNetWorth, formatCurrency(projectedNetWorth));
  setText(outputIds.estimatedIncome, formatCurrency(estimatedIncome));
  setText(outputIds.incomeGap, gapLabel);
  setText(
    outputIds.incomeGapNote,
    incomeGap >= 0
      ? "Your estimated income is above your inflation-adjusted target."
      : "Your estimated income is below your inflation-adjusted target."
  );

  setText(outputIds.readinessTitle, readinessTitle);
  setText(outputIds.futureSpendingTarget, formatCurrency(futureSpendingTarget));

  setText(outputIds.pensionFutureValue, formatCurrency(pensionFuture));
  setText(outputIds.isaFutureValue, formatCurrency(isaFuture));
  setText(outputIds.homeEquityValue, formatCurrency(homeEquityFuture));
  setText(outputIds.usableEquityValue, formatCurrency(usableHomeEquity));

  setWidth(outputIds.pensionShare, pensionShare);
  setWidth(outputIds.isaShare, isaShare);
  setWidth(outputIds.homeShare, homeShare);

  setText(outputIds.pensionShareLabel, formatPercent(pensionShare));
  setText(outputIds.isaShareLabel, formatPercent(isaShare));
  setText(outputIds.homeShareLabel, formatPercent(homeShare));

  setText(outputIds.drawdownIncome, formatCurrency(drawdownIncome));
  setText(outputIds.guaranteedIncomeOutput, formatCurrency(guaranteedIncome));
  setText(outputIds.totalIncomeOutput, formatCurrency(estimatedIncome));

  setText(
    outputIds.assumptionGrowth,
    `Monthly compounding is used for pension growth at ${pensionReturn}% and ISA growth at ${isaReturn}%.`
  );
  setText(
    outputIds.assumptionInflation,
    `Your ${formatCurrency(targetSpending)} target is inflated by ${inflationRate}% for ${yearsToRetirement} years.`
  );
  setText(
    outputIds.assumptionEquity,
    `${equityUsageRate}% of projected home equity is included in accessible retirement funding.`
  );
  setText(outputIds.equityUsageLabel, `${equityUsageRate}%`);
}

planner.addEventListener("input", updatePlanner);
planner.addEventListener("change", updatePlanner);

updatePlanner();
