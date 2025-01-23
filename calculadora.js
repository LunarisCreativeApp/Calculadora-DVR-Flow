let resultadoCustoImplementação = document.querySelector('#implementação');
let resultadoCustoMensal = document.querySelector('#custo-mensal');
let resultadoCustoAnual = document.querySelector('#custo-anual');
let resultadoCustoTotal = document.querySelector('#custo-total');

// Calculadora de custo para cliente DVR Flow
function calcular() {
    let quantity = parseInt(document.querySelector('#quantidade').value);
    console.log("A quantidade é: " + quantity);

    function calculateMensalCost(quantity) {
        let totalCost = 0;

        if (quantity > 0) {
            const faixa1Devices = Math.min(quantity, 50);
            totalCost += faixa1Devices * 18;
            quantity -= faixa1Devices;
        }

        if (quantity > 0) {
            const faixa2Devices = Math.min(quantity, 50);
            totalCost += faixa2Devices * 16;
            quantity -= faixa2Devices;
        }

        if (quantity > 0) {
            totalCost += quantity * 14;
        }

        return totalCost;
    }

    let totalCost = calculateMensalCost(quantity);
    let custoMensal = totalCost.toFixed(2);
    let implementação = quantity * 10;
    let custoAnual = (totalCost * 12).toFixed(2);
    let custoTotal = (parseFloat(custoAnual) * 2 + implementação).toFixed(2);

    function preencherResultados(implementação, custoMensal, custoAnual, custoTotal) {
        resultadoCustoImplementação.innerHTML = implementação;
        resultadoCustoMensal.innerHTML = custoMensal;
        resultadoCustoAnual.innerHTML = custoAnual;
        resultadoCustoTotal.innerHTML = custoTotal;
    }

    preencherResultados(implementação, custoMensal, custoAnual, custoTotal);
}
