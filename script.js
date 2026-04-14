// Elementos do DOM
const form = {
    deviceCount: document.getElementById('deviceCount'),
    basePrice: document.getElementById('basePrice'),
    tierDiscount: document.getElementById('tierDiscount'),
    annualDiscount: document.getElementById('annualDiscount'),
    targetFinalPrice: document.getElementById('targetFinalPrice')
};

const pricingModeToggle = document.getElementById('pricingModeToggle');
const configModeTitle = document.getElementById('configModeTitle');
const configModeDescription = document.getElementById('configModeDescription');
const targetFinalPriceGroup = document.getElementById('targetFinalPriceGroup');
const basePriceGroup = document.getElementById('basePriceGroup');
const tierDiscountGroup = document.getElementById('tierDiscountGroup');
const annualDiscountGroup = document.getElementById('annualDiscountGroup');

const calculateBtn = document.getElementById('calculateBtn');
const summarySection = document.getElementById('summarySection');
const copyBtn = document.getElementById('copyBtn');

const FINAL_PRICE_MODE_DEFAULTS = {
    tierDiscount: 2,
    annualDiscount: 2
};

// Estado da aplicação
let calculationResults = null;

function getTierDeviceDistribution(deviceCount) {
    if (deviceCount <= 50) {
        return { tier1: deviceCount, tier2: 0, tier3: 0 };
    }

    if (deviceCount <= 100) {
        return { tier1: 50, tier2: deviceCount - 50, tier3: 0 };
    }

    return { tier1: 50, tier2: 50, tier3: deviceCount - 100 };
}

function deriveBasePriceFromTargetMonthly(targetMonthlyValue, deviceCount, tierDiscount) {
    const tiers = getTierDeviceDistribution(deviceCount);
    const weightedDiscount = (tiers.tier2 * tierDiscount) + (tiers.tier3 * (2 * tierDiscount));

    return (targetMonthlyValue + weightedDiscount) / deviceCount;
}

function setPricingModeUI(isFinalPriceMode) {
    targetFinalPriceGroup.classList.toggle('is-hidden', !isFinalPriceMode);
    basePriceGroup.classList.toggle('is-hidden', isFinalPriceMode);
    tierDiscountGroup.classList.toggle('is-hidden', isFinalPriceMode);
    annualDiscountGroup.classList.toggle('is-hidden', isFinalPriceMode);

    form.targetFinalPrice.required = isFinalPriceMode;
    form.basePrice.required = !isFinalPriceMode;
    form.tierDiscount.required = !isFinalPriceMode;
    form.annualDiscount.required = !isFinalPriceMode;

    form.basePrice.disabled = isFinalPriceMode;
    form.tierDiscount.disabled = isFinalPriceMode;
    form.annualDiscount.disabled = isFinalPriceMode;
    form.targetFinalPrice.disabled = !isFinalPriceMode;

    if (isFinalPriceMode) {
        configModeTitle.textContent = 'Modo: Calcular por preço final';
        configModeDescription.textContent = 'Informe o valor mensal desejado. O cálculo usa R$ 2 por faixa e 2% anual como padrão.';
    } else {
        configModeTitle.textContent = 'Modo: Configuração manual';
        configModeDescription.textContent = 'Você define preço base, desconto por faixa e desconto anual.';
    }
}

// Função principal de cálculo
function calculateBudget() {
    const deviceCount = parseInt(form.deviceCount.value);
    const isFinalPriceMode = Boolean(pricingModeToggle?.checked);

    let targetFinalPrice = null;
    let basePrice = parseFloat(form.basePrice.value);
    let tierDiscount = parseFloat(form.tierDiscount.value);
    let annualDiscountBase = parseFloat(form.annualDiscount.value);

    if (isFinalPriceMode) {
        targetFinalPrice = parseFloat(form.targetFinalPrice.value);
        tierDiscount = FINAL_PRICE_MODE_DEFAULTS.tierDiscount;
        annualDiscountBase = FINAL_PRICE_MODE_DEFAULTS.annualDiscount;

        if (!Number.isFinite(targetFinalPrice) || targetFinalPrice <= 0) {
            alert('Por favor, informe um preço final mensal válido.');
            return;
        }

        basePrice = deriveBasePriceFromTargetMonthly(targetFinalPrice, deviceCount, tierDiscount);

        form.basePrice.value = basePrice.toFixed(2);
        form.tierDiscount.value = String(tierDiscount);
        form.annualDiscount.value = String(annualDiscountBase);
    }

    // Validações básicas
    if (deviceCount <= 0 || basePrice <= 0 || !Number.isFinite(basePrice)) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    // Calcular preços por faixa
    const prices = {
        tier1: basePrice, // até 50
        tier2: basePrice - tierDiscount, // 51-100
        tier3: basePrice - (2 * tierDiscount) // >100
    };

    // Distribuir dispositivos por faixa
    const tierDistribution = getTierDeviceDistribution(deviceCount);
    const tier1Devices = tierDistribution.tier1;
    const tier2Devices = tierDistribution.tier2;
    const tier3Devices = tierDistribution.tier3;

    // Calcular custo mensal base por faixa
    const tier1Cost = tier1Devices * prices.tier1;
    const tier2Cost = tier2Devices * prices.tier2;
    const tier3Cost = tier3Devices * prices.tier3;
    const baseMonthlyCost = tier1Cost + tier2Cost + tier3Cost;

    // Calcular totais por anos com descontos
    const year1Total = baseMonthlyCost * 12;
    
    // Ano 2: primeiro ano normal + segundo ano com desconto
    const year2Discount = annualDiscountBase;
    const year2Total = (baseMonthlyCost * 12) + (baseMonthlyCost * 12 * (1 - year2Discount / 100));
    
    // Ano 3: primeiro ano normal + segundo com desconto base + terceiro com desconto progressivo (base * 2)
    const year3Discount2 = annualDiscountBase;
    const year3Discount3 = annualDiscountBase * 2;
    const year3Total = (baseMonthlyCost * 12) + 
                       (baseMonthlyCost * 12 * (1 - year3Discount2 / 100)) + 
                       (baseMonthlyCost * 12 * (1 - year3Discount3 / 100));

    // Calcular mensais equivalentes
    const year1Monthly = year1Total / 12;
    const year2Monthly = year2Total / 24;
    const year3Monthly = year3Total / 36;

    // Calcular implementação
    const implementationCost = deviceCount * 10;

    // Armazenar resultados
    calculationResults = {
        deviceCount,
        basePrice,
        tierDiscount,
        annualDiscountBase,
    targetFinalPrice,
    pricingMode: isFinalPriceMode ? 'final-price' : 'manual',
        prices,
        tiers: {
            tier1: { devices: tier1Devices, price: prices.tier1, cost: tier1Cost },
            tier2: { devices: tier2Devices, price: prices.tier2, cost: tier2Cost },
            tier3: { devices: tier3Devices, price: prices.tier3, cost: tier3Cost }
        },
        baseMonthlyCost,
        plans: {
            year1: { total: year1Total, monthly: year1Monthly, months: 12 },
            year2: { total: year2Total, monthly: year2Monthly, months: 24 },
            year3: { total: year3Total, monthly: year3Monthly, months: 36 }
        },
        implementationCost,
        selectedPlan: calculationResults?.selectedPlan ?? 'year3'
    };

    calculationResults.contractYears = parseInt(calculationResults.selectedPlan.replace('year', ''), 10);

    renderResults();
}

// Renderizar resultados
function renderResults() {
    const r = calculationResults;
    const selectedPlan = r.plans[r.selectedPlan];
    const year1Plan = r.plans.year1;

    // KPIs principais
    document.getElementById('kpiTotal').textContent = formatCurrency(selectedPlan.total);
    document.getElementById('kpiSubtitle').textContent = `Plano de ${r.contractYears} ${r.contractYears === 1 ? 'ano' : 'anos'}`;
    document.getElementById('kpiMonthly').textContent = formatCurrency(selectedPlan.monthly);
    
    // Economia vs 1 ano
    const fullPrice = year1Plan.total * r.contractYears;
    const savings = fullPrice - selectedPlan.total;
    const savingsPercent = fullPrice > 0 ? (savings / fullPrice) * 100 : 0;
    document.getElementById('kpiSavings').textContent = formatCurrency(savings);
    document.getElementById('kpiSavingsPercent').textContent = `${savingsPercent.toFixed(1)}% de economia`;
    
    // Total com implementação
    const totalWithImpl = selectedPlan.total + r.implementationCost;
    document.getElementById('kpiWithImpl').textContent = formatCurrency(totalWithImpl);
    document.getElementById('kpiImplValue').textContent = `Implementação: ${formatCurrency(r.implementationCost)}`;

    // Cards de planos
    renderPlanCards();

    // Detalhamento de custos
    document.getElementById('baseMonthlyCost').textContent = formatCurrency(r.baseMonthlyCost);
    renderAnnualBreakdown();

    // Implementação
    document.getElementById('implementationCost').textContent = formatCurrency(r.implementationCost);
    document.getElementById('implementationFormula').textContent = `${r.deviceCount} dispositivos × R$ 10,00`;

    // Texto da proposta
    generateProposalText();

    // Mostrar seção de resumo
    summarySection.style.display = 'block';
}

// Renderizar cards de planos
function renderPlanCards() {
    const r = calculationResults;
    const plansGrid = document.getElementById('plansGrid');
    const year1Plan = r.plans.year1;
    
    plansGrid.innerHTML = '';

    ['year1', 'year2', 'year3'].forEach((planKey, index) => {
        const plan = r.plans[planKey];
        const years = index + 1;
        const isSelected = r.selectedPlan === planKey;
        
        // Calcular economia
        const fullPrice = year1Plan.total * years;
        const savings = fullPrice - plan.total;
        const savingsPercent = years === 1 ? 0 : (savings / fullPrice) * 100;

        const card = document.createElement('div');
        card.className = `plan-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => selectPlan(planKey);
        
        card.innerHTML = `
            ${isSelected ? '<div class="plan-badge">Selecionado</div>' : ''}
            <div class="plan-title">${years} ${years === 1 ? 'Ano' : 'Anos'}</div>
            <div class="plan-total">${formatCurrency(plan.total)}</div>
            <div class="plan-monthly">Mensal: ${formatCurrency(plan.monthly)}</div>
            ${years > 1 ? `<div class="plan-savings">💰 Economize ${formatCurrency(savings)} (${savingsPercent.toFixed(1)}%)</div>` : '<div class="plan-savings" style="opacity: 0.5;">Plano base</div>'}
        `;
        
        plansGrid.appendChild(card);
    });
}

// Selecionar plano
function selectPlan(planKey) {
    const years = parseInt(planKey.replace('year', ''));
    calculationResults.selectedPlan = planKey;
    calculationResults.contractYears = years;
    renderResults();
}

// Renderizar breakdown de faixas
function renderTiersBreakdown() {
    const r = calculationResults;
    const container = document.getElementById('tiersBreakdown');
    
    container.innerHTML = '';

    const tiers = [
        { key: 'tier1', name: 'Faixa 1', range: '1-50 dispositivos' },
        { key: 'tier2', name: 'Faixa 2', range: '51-100 dispositivos' },
        { key: 'tier3', name: 'Faixa 3', range: 'Acima de 100 dispositivos' }
    ];

    tiers.forEach(tier => {
        const data = r.tiers[tier.key];
        
        if (data.devices > 0) {
            const item = document.createElement('div');
            item.className = 'tier-item';
            
            item.innerHTML = `
                <div>
                    <div class="tier-name">${tier.name}</div>
                    <div class="tier-details">${tier.range} • ${data.devices} dispositivos</div>
                </div>
                <div class="tier-price">
                    <div class="tier-price-label">Preço unitário</div>
                    <div class="tier-price-value">${formatCurrency(data.price)}</div>
                </div>
                <div class="tier-total">
                    <div class="tier-total-label">Total mensal</div>
                    <div class="tier-total-value">${formatCurrency(data.cost)}</div>
                </div>
            `;
            
            container.appendChild(item);
        }
    });
}

// Renderizar detalhamento por ano
function renderAnnualBreakdown() {
    const r = calculationResults;
    const container = document.getElementById('annualBreakdown');

    container.innerHTML = '';

    const getDiscountRateByYear = (yearNumber) => {
        if (yearNumber === 1) {
            return 0;
        }

        if (yearNumber === 2) {
            return r.annualDiscountBase;
        }

    return r.annualDiscountBase * 2;
    };

    const tierDefinitions = [
        { key: 'tier1', name: 'Faixa 1', range: '1-50 dispositivos' },
        { key: 'tier2', name: 'Faixa 2', range: '51-100 dispositivos' },
        { key: 'tier3', name: 'Faixa 3', range: 'Acima de 100 dispositivos' }
    ];

    const annualPlans = [
        {
            key: 'year1',
            label: '1 ano',
            yearNumber: 1,
            annualLabel: 'Ano 1',
            discountLabel: 'Sem desconto anual',
            total: r.plans.year1.total,
            monthly: r.baseMonthlyCost,
            yearly: r.baseMonthlyCost * 12
        },
        {
            key: 'year2',
            label: '2 anos',
            yearNumber: 2,
            annualLabel: 'Ano 2',
            discountLabel: `${Number(r.annualDiscountBase).toFixed(1)}% de desconto`,
            total: r.plans.year2.total,
            monthly: r.baseMonthlyCost * (1 - r.annualDiscountBase / 100),
            yearly: r.baseMonthlyCost * 12 * (1 - r.annualDiscountBase / 100)
        },
        {
            key: 'year3',
            label: '3 anos',
            yearNumber: 3,
            annualLabel: 'Ano 3',
            discountLabel: `${Number(r.annualDiscountBase * 2).toFixed(1)}% de desconto`,
            total: r.plans.year3.total,
            monthly: r.baseMonthlyCost * (1 - (r.annualDiscountBase * 2) / 100),
            yearly: r.baseMonthlyCost * 12 * (1 - (r.annualDiscountBase * 2) / 100)
        }
    ];

    annualPlans.forEach((plan) => {
        const discountRate = getDiscountRateByYear(plan.yearNumber);
        const tiersHtml = tierDefinitions
            .map((tier) => {
                const data = r.tiers[tier.key];

                if (!data.devices) {
                    return '';
                }

                const discountedUnitPrice = data.price * (1 - discountRate / 100);
                const discountedMonthlyTotal = data.cost * (1 - discountRate / 100);
                const discountedYearlyTotal = discountedMonthlyTotal * 12;

                return `
                    <div class="annual-tier-item">
                        <div class="annual-tier-main">
                            <div class="annual-tier-name">${tier.name}</div>
                            <div class="annual-tier-range">${tier.range} • ${data.devices} dispositivos</div>
                        </div>
                        <div class="annual-tier-metrics">
                            <div>
                                <div class="annual-tier-label">Preço/disp.</div>
                                <div class="annual-tier-value">${formatCurrency(discountedUnitPrice)}</div>
                            </div>
                        </div>
                    </div>
                `;
            })
            .filter(Boolean)
            .join('');

        const item = document.createElement('div');
        item.className = `annual-item ${r.selectedPlan === plan.key ? 'selected' : ''}`;

        item.innerHTML = `
            <div class="annual-item-header">
                <div>
                    <div class="annual-item-title">${plan.annualLabel}</div>
                    <div class="annual-item-subtitle">Plano de ${plan.label}</div>
                </div>
                <div class="annual-item-badge">${plan.discountLabel}</div>
            </div>
            <div class="annual-item-grid">
                <div>
                    <div class="annual-item-label">Mensal aplicado</div>
                    <div class="annual-item-value">${formatCurrency(plan.monthly)}</div>
                </div>
                <div>
                    <div class="annual-item-label">Total do ano</div>
                    <div class="annual-item-value">${formatCurrency(plan.yearly)}</div>
                </div>
                <div>
                    <div class="annual-item-label">Acumulado do plano</div>
                    <div class="annual-item-value">${formatCurrency(plan.total)}</div>
                </div>
            </div>
            <div class="annual-tier-list">
                ${tiersHtml}
            </div>
        `;

        container.appendChild(item);
    });
}

// Gerar texto da proposta
function generateProposalText() {
    const r = calculationResults;
    const selectedPlan = r.plans[r.selectedPlan];
    const years = r.contractYears;
    const year1Plan = r.plans.year1;

    const fullPrice = year1Plan.total * years;
    const savings = fullPrice - selectedPlan.total;
    const savingsPercent = fullPrice > 0 ? (savings / fullPrice) * 100 : 0;

    const totalWithImpl = selectedPlan.total + r.implementationCost;

    const fmtDevices = (n) => new Intl.NumberFormat('pt-BR').format(n);

    const tiersLines = [
        r.tiers.tier1.devices > 0
            ? `• Faixa 1 (1–50): ${fmtDevices(r.tiers.tier1.devices)} × ${formatCurrency(r.tiers.tier1.price)} = ${formatCurrency(r.tiers.tier1.cost)}/mês`
            : null,
        r.tiers.tier2.devices > 0
            ? `• Faixa 2 (51–100): ${fmtDevices(r.tiers.tier2.devices)} × ${formatCurrency(r.tiers.tier2.price)} = ${formatCurrency(r.tiers.tier2.cost)}/mês`
            : null,
        r.tiers.tier3.devices > 0
            ? `• Faixa 3 (>100): ${fmtDevices(r.tiers.tier3.devices)} × ${formatCurrency(r.tiers.tier3.price)} = ${formatCurrency(r.tiers.tier3.cost)}/mês`
            : null
    ].filter(Boolean);

    const plansLines = [
        `• 1 ano: ${formatCurrency(r.plans.year1.total)} (≈ ${formatCurrency(r.plans.year1.monthly)}/mês)`,
        `• 2 anos: ${formatCurrency(r.plans.year2.total)} (≈ ${formatCurrency(r.plans.year2.monthly)}/mês)`,
        `• 3 anos: ${formatCurrency(r.plans.year3.total)} (≈ ${formatCurrency(r.plans.year3.monthly)}/mês)`
    ];
    
    // Importante: NÃO usar `.filter(Boolean)` aqui, porque ele remove strings vazias
    // que são justamente as linhas em branco.
    const lines = [
        `PROPOSTA COMERCIAL — Sentynel`,
        `Data: ${new Intl.DateTimeFormat('pt-BR').format(new Date())}`,
        '',
        `Olá! Segue a simulação para ${fmtDevices(r.deviceCount)} dispositivo(s).`,
        `Modo de cálculo: ${r.pricingMode === 'final-price' ? 'Preço final mensal' : 'Configuração manual'}`,
        r.pricingMode === 'final-price' ? `Preço final desejado (mensal): ${formatCurrency(r.targetFinalPrice || 0)}` : '',
        '',
        `✅ PLANO SELECIONADO: ${years} ${years === 1 ? 'ano' : 'anos'}`,
        `• Mensal equivalente: ${formatCurrency(selectedPlan.monthly)}`,
        `• Total do contrato: ${formatCurrency(selectedPlan.total)}`,
        `• Implementação (taxa única): ${formatCurrency(r.implementationCost)}`,
        `• Total geral (contrato + implementação): ${formatCurrency(totalWithImpl)}`,
        years > 1 ? `• Economia vs ${years} contrato(s) de 1 ano: ${formatCurrency(savings)} (${savingsPercent.toFixed(1)}%)` : '',
        '',
        `Custo mensal base (somatório das faixas): ${formatCurrency(r.baseMonthlyCost)}`,
        '',
        `Detalhamento por faixas (mensal):`,
        ...tiersLines,
        '',
        `Comparação de planos (total e mensal equivalente):`,
        ...plansLines,
        '',
        `Condições usadas na simulação:`,
        `• Preço base (Faixa 1): ${formatCurrency(r.basePrice)}/disp.`,
        `• Desconto por faixa: ${formatCurrency(r.tierDiscount)}/disp. (progressivo)`,
    `• Desconto base anual: ${Number(r.annualDiscountBase).toFixed(1)}% (2º ano) | ${Number(r.annualDiscountBase * 2).toFixed(1)}% (3º ano)`,
        '',
        `Validade da proposta: 30 dias.`,
        `Fico à disposição para ajustar volume, condições e fechar o melhor plano.`
    ];

    const text = lines.join('\n').replace(/\r\n/g, '\n');
    
    document.getElementById('proposalText').value = text;
}

// Copiar proposta
async function copyProposal() {
    const textarea = document.getElementById('proposalText');
    const text = textarea.value || '';

    const originalText = copyBtn.textContent;
    const setCopiedUI = () => {
        copyBtn.textContent = '✓ Copiado!';
        copyBtn.style.background = '#10b981';
        copyBtn.style.color = 'white';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
    };

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
        }
        setCopiedUI();
    } catch {
        // fallback extremo
        window.prompt('Copie o texto abaixo:', text);
    }
}

// Formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Event listeners
calculateBtn.addEventListener('click', calculateBudget);
copyBtn.addEventListener('click', copyProposal);
pricingModeToggle?.addEventListener('change', () => {
    setPricingModeUI(pricingModeToggle.checked);
    calculateBudget();
});

// Calcular ao pressionar Enter nos inputs
Object.values(form)
    .filter(Boolean)
    .forEach((input) => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculateBudget();
            }
        });
    });

// Calcular automaticamente ao carregar (valores padrão)
window.addEventListener('load', () => {
    setPricingModeUI(Boolean(pricingModeToggle?.checked));
    calculateBudget();
});
