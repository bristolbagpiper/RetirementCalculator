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
    const include = row.querySelector(".savings-include")?.checked ?? true;
    if (!include) {
      return total;
    }

    const balance = Number(row.querySelector(".savings-balance")?.value) || 0;
    const monthly = Number(row.querySelector(".savings-monthly")?.value) || 0;
    const rate = Number(row.querySelector(".savings-rate")?.value) || 0;

    return total + futureValueWithMonthlyContributions(balance, monthly, rate, yearsToRetirement);
  }, 0);
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
  const pensionFuture = futureValueWithMonthlyContributions(
    inputs.pensionCurrent,
    inputs.pensionMonthlyTotal,
    inputs.pensionReturn,
    yearsToRetirement
  );

  const isaFuture = futureValueWithMonthlyContributions(
    inputs.isaCurrent,
    inputs.isaMonthly,
    inputs.isaReturn,
    yearsToRetirement
  );

  const savingsFuture = inputs.includeOtherAccounts
    ? calculateSavingsFutureValue(yearsToRetirement)
    : 0;
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

function updatePlanner() {
  syncOptionalUi();

  const currentAge = readNumber("currentAge");
  const retirementAge = readNumber("retirementAge");
  const targetSpending = readNumber("targetSpending");
  const inflationRate = readNumber("inflationRate");
  const withdrawalRate = readNumber("withdrawalRate");
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
    `Monthly compounding is used for each section you leave turned on, and any extra account row marked to count for retirement.`
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

optionalSections.forEach(({ toggleId }) => {
  document.getElementById(toggleId)?.addEventListener("change", updatePlanner);
});

optionalFields.forEach(({ toggleId }) => {
  document.getElementById(toggleId)?.addEventListener("change", updatePlanner);
});

planner.addEventListener("input", updatePlanner);
planner.addEventListener("change", updatePlanner);

updatePlanner();
