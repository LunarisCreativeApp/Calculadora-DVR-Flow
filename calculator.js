// Elementos do DOM
const form = {
    deviceCount: document.getElementById('deviceCount'),
    basePrice: document.getElementById('basePrice'),
    tierDiscount: document.getElementById('tierDiscount'),
    annualDiscount: document.getElementById('annualDiscount')
};

const calculateBtn = document.getElementById('calculateBtn');
const summarySection = document.getElementById('summarySection');
const copyBtn = document.getElementById('copyBtn');

// Estado da aplicação
let calculationResults = null;

// Função principal de cálculo
function calculateBudget() {
    const deviceCount = parseInt(form.deviceCount.value);
    const basePrice = parseFloat(form.basePrice.value);
    const tierDiscount = parseFloat(form.tierDiscount.value);
    const annualDiscountBase = parseFloat(form.annualDiscount.value);

    // Validações básicas
    if (deviceCount <= 0 || basePrice <= 0) {
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
    let tier1Devices = 0;
    let tier2Devices = 0;
    let tier3Devices = 0;

    if (deviceCount <= 50) {
        tier1Devices = deviceCount;
    } else if (deviceCount <= 100) {
        tier1Devices = 50;
        tier2Devices = deviceCount - 50;
    } else {
        tier1Devices = 50;
        tier2Devices = 50;
        tier3Devices = deviceCount - 100;
    }

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
    
    // Ano 3: primeiro ano normal + segundo com desconto + terceiro com desconto maior
    const year3Discount2 = annualDiscountBase + 2;
    const year3Discount3 = annualDiscountBase + 4;
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
    renderTiersBreakdown();

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

// Gerar texto da proposta
function generateProposalText() {
    const r = calculationResults;
    const selectedPlan = r.plans[r.selectedPlan];
    const years = r.contractYears;
    
    const text = `
═══════════════════════════════════════════════════
              PROPOSTA COMERCIAL - DVR FLOW
═══════════════════════════════════════════════════

CONFIGURAÇÃO DO CONTRATO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Quantidade de dispositivos: ${r.deviceCount}
• Duração do contrato: ${years} ${years === 1 ? 'ano' : 'anos'}
• Custo mensal base: ${formatCurrency(r.baseMonthlyCost)}

DETALHAMENTO POR FAIXAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${r.tiers.tier1.devices > 0 ? `• Faixa 1 (1-50): ${r.tiers.tier1.devices} dispositivos × ${formatCurrency(r.tiers.tier1.price)} = ${formatCurrency(r.tiers.tier1.cost)}/mês` : ''}
${r.tiers.tier2.devices > 0 ? `• Faixa 2 (51-100): ${r.tiers.tier2.devices} dispositivos × ${formatCurrency(r.tiers.tier2.price)} = ${formatCurrency(r.tiers.tier2.cost)}/mês` : ''}
${r.tiers.tier3.devices > 0 ? `• Faixa 3 (>100): ${r.tiers.tier3.devices} dispositivos × ${formatCurrency(r.tiers.tier3.price)} = ${formatCurrency(r.tiers.tier3.cost)}/mês` : ''}

RESUMO FINANCEIRO - PLANO DE ${years} ${years === 1 ? 'ANO' : 'ANOS'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total do contrato: ${formatCurrency(selectedPlan.total)}
• Mensal equivalente: ${formatCurrency(selectedPlan.monthly)}
• Taxa de implementação: ${formatCurrency(r.implementationCost)}
• TOTAL GERAL: ${formatCurrency(selectedPlan.total + r.implementationCost)}

${years > 1 ? `ECONOMIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Comparado com contratos anuais consecutivos:
• Economia total: ${formatCurrency((r.plans.year1.total * years) - selectedPlan.total)}
• Percentual: ${(((r.plans.year1.total * years) - selectedPlan.total) / (r.plans.year1.total * years) * 100).toFixed(1)}%
` : ''}
COMPARAÇÃO DE PLANOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 1 ano: ${formatCurrency(r.plans.year1.total)} (${formatCurrency(r.plans.year1.monthly)}/mês)
• 2 anos: ${formatCurrency(r.plans.year2.total)} (${formatCurrency(r.plans.year2.monthly)}/mês)
• 3 anos: ${formatCurrency(r.plans.year3.total)} (${formatCurrency(r.plans.year3.monthly)}/mês)

═══════════════════════════════════════════════════
Proposta válida por 30 dias.
Para mais informações, entre em contato com nossa equipe.
═══════════════════════════════════════════════════
    `.trim();
    
    document.getElementById('proposalText').value = text;
}

// Copiar proposta
function copyProposal() {
    const textarea = document.getElementById('proposalText');
    textarea.select();
    document.execCommand('copy');
    
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copiado!';
    copyBtn.style.background = '#10b981';
    copyBtn.style.color = 'white';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
        copyBtn.style.color = '';
    }, 2000);
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
    calculateBudget();
});
