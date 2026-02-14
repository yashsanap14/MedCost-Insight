// ER Bill Explainer — App Logic
// All chart rendering, calculators, and interactive features

const services = ER_DATA.services;
const PLOTLY_DARK = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 12 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    margin: { t: 50, r: 20, b: 50, l: 60 },
    colorway: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#ec4899', '#14b8a6']
};

// ===== Tab Routing =====
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById('tab-' + tabId).classList.add('active');

        // Show/hide scenario controls
        const showControls = ['bill-explained'].includes(tabId);
        document.getElementById('scenario-controls').style.display = showControls ? 'block' : 'none';

        // Render tab content (lazy)
        renderTab(tabId);
    });
});

// ===== Scenario Sliders =====
const sliderConfig = [
    { id: 'copay-slider', display: 'copay-value', fmt: v => `$${v}` },
    { id: 'deductible-slider', display: 'deductible-value', fmt: v => `$${v.toLocaleString()}` },
    { id: 'coinsurance-slider', display: 'coinsurance-value', fmt: v => `${v}%` },
];

sliderConfig.forEach(({ id, display, fmt }) => {
    const slider = document.getElementById(id);
    const disp = document.getElementById(display);
    slider.addEventListener('input', () => {
        disp.textContent = fmt(Number(slider.value));
        renderTab('bill-explained');
    });
});

// What-If sliders
const wifSliderConfig = [
    { id: 'wif-deductible', display: 'wif-deductible-value', fmt: v => `$${v.toLocaleString()}` },
    { id: 'wif-coinsurance', display: 'wif-coinsurance-value', fmt: v => `${v}%` },
    { id: 'wif-copay', display: 'wif-copay-value', fmt: v => `$${v}` },
    { id: 'wif-oopmax', display: 'wif-oopmax-value', fmt: v => `$${v.toLocaleString()}` },
];

wifSliderConfig.forEach(({ id, display, fmt }) => {
    const slider = document.getElementById(id);
    const disp = document.getElementById(display);
    slider.addEventListener('input', () => {
        disp.textContent = fmt(Number(slider.value));
        renderWhatIf();
    });
});

document.getElementById('wif-oon-toggle').addEventListener('change', renderWhatIf);

// Red Flag sliders
const rfSliderConfig = [
    { id: 'rf-medicare-threshold', display: 'rf-medicare-value', fmt: v => `${v}x` },
    { id: 'rf-variance-threshold', display: 'rf-variance-value', fmt: v => `${v}%` },
];

rfSliderConfig.forEach(({ id, display, fmt }) => {
    const slider = document.getElementById(id);
    const disp = document.getElementById(display);
    slider.addEventListener('input', () => {
        disp.textContent = fmt(Number(slider.value));
        renderRedFlags();
    });
});

// ===== Core Calculator =====
function calcPatientOwes(allowedTotal, copay, deductible, coinsurancePct, oopMax = Infinity) {
    const deductiblePart = Math.min(deductible, allowedTotal);
    const afterDeductible = allowedTotal - deductiblePart;
    const coinsurancePart = (coinsurancePct / 100) * afterDeductible;
    const total = copay + deductiblePart + coinsurancePart;
    return Math.min(total, oopMax);
}

function getScenarioValues() {
    return {
        copay: Number(document.getElementById('copay-slider').value),
        deductible: Number(document.getElementById('deductible-slider').value),
        coinsurance: Number(document.getElementById('coinsurance-slider').value),
    };
}

// ===== Tab Renderer =====
const rendered = {};
function renderTab(tabId) {
    switch (tabId) {
        case 'bill-explained': renderBillExplained(); break;
        case 'cost-breakdown':
            if (!rendered['cost-breakdown']) { renderCostBreakdown(); rendered['cost-breakdown'] = true; }
            break;
        case 'price-comparison':
            if (!rendered['price-comparison']) { renderPriceComparison(); rendered['price-comparison'] = true; }
            break;
        case 'insights':
            if (!rendered['insights']) { renderInsights(); rendered['insights'] = true; }
            break;
        case 'explain-bill':
            if (!rendered['explain-bill']) { renderExplainBillSetup(); rendered['explain-bill'] = true; }
            break;
        case 'what-if':
            renderWhatIf();
            break;
        case 'red-flags':
            renderRedFlags();
            break;
    }
}

// ===== TAB 1: Bill Explained =====
function renderBillExplained() {
    const { copay, deductible, coinsurance } = getScenarioValues();
    const totalBilled = services.reduce((s, svc) => s + svc.gross_charge, 0);
    const totalAllowed = services.reduce((s, svc) => s + (svc.negotiated_median || svc.medicare_rate), 0);
    const patientOwes = calcPatientOwes(totalAllowed, copay, deductible, coinsurance);
    const insurancePays = totalAllowed - patientOwes + copay; // Copay is separate

    // KPI Cards
    document.getElementById('kpi-cards').innerHTML = `
    <div class="kpi-card indigo">
      <div class="kpi-label">Total Billed</div>
      <div class="kpi-value indigo">$${totalBilled.toLocaleString()}</div>
    </div>
    <div class="kpi-card cyan">
      <div class="kpi-label">Allowed Amount</div>
      <div class="kpi-value cyan">$${totalAllowed.toLocaleString()}</div>
    </div>
    <div class="kpi-card emerald">
      <div class="kpi-label">Insurance Pays</div>
      <div class="kpi-value emerald">$${Math.max(0, totalAllowed - patientOwes).toLocaleString()}</div>
    </div>
    <div class="kpi-card rose">
      <div class="kpi-label">You Pay</div>
      <div class="kpi-value rose">$${patientOwes.toLocaleString()}</div>
    </div>
  `;

    // Waterfall chart
    const discount = totalBilled - totalAllowed;
    const insurancePayAmt = Math.max(0, totalAllowed - patientOwes);

    Plotly.react('waterfall-chart', [{
        type: 'waterfall',
        orientation: 'v',
        measure: ['absolute', 'relative', 'relative', 'total'],
        x: ['Total Billed', 'Discount', 'Insurance Pays', 'You Pay'],
        y: [totalBilled, -discount, -insurancePayAmt, patientOwes],
        text: [`$${totalBilled.toLocaleString()}`, `-$${discount.toLocaleString()}`,
        `-$${insurancePayAmt.toLocaleString()}`, `$${patientOwes.toLocaleString()}`],
        textposition: 'outside',
        connector: { line: { color: 'rgba(99,102,241,0.3)' } },
        increasing: { marker: { color: '#6366f1' } },
        decreasing: { marker: { color: '#10b981' } },
        totals: { marker: { color: '#f43f5e' } }
    }], {
        ...PLOTLY_DARK,
        title: { text: 'How Your ER Bill Breaks Down', font: { color: '#f1f5f9', size: 16 } },
        height: 420, showlegend: false,
    }, { responsive: true });

    // Pie chart
    const deductibleAmt = Math.min(deductible, totalAllowed);
    const coinsuranceAmt = (coinsurance / 100) * (totalAllowed - deductibleAmt);
    const pieData = [
        { label: 'Copay', value: copay, color: '#6366f1' },
        { label: 'Deductible', value: deductibleAmt, color: '#06b6d4' },
        { label: 'Coinsurance', value: coinsuranceAmt, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    Plotly.react('pie-chart', [{
        type: 'pie',
        labels: pieData.map(d => d.label),
        values: pieData.map(d => d.value),
        marker: { colors: pieData.map(d => d.color) },
        textinfo: 'label+percent',
        textfont: { color: '#f1f5f9', size: 13 },
        hole: 0.4
    }], {
        ...PLOTLY_DARK,
        title: { text: 'Your Cost Breakdown', font: { color: '#f1f5f9', size: 16 } },
        height: 420, showlegend: false,
    }, { responsive: true });
}

// ===== TAB 2: Cost Breakdown =====
function renderCostBreakdown() {
    const data = services.map(s => ({
        ...s,
        variance_pct: ((s.cash_price - s.medicare_rate) / s.medicare_rate * 100).toFixed(1)
    }));

    // Top 10 variance bar
    const topVar = [...data].sort((a, b) => b.variance_pct - a.variance_pct).slice(0, 10);
    Plotly.react('variance-bar-chart', [{
        type: 'bar',
        orientation: 'h',
        y: topVar.map(d => d.description.length > 30 ? d.description.slice(0, 28) + '…' : d.description),
        x: topVar.map(d => +d.variance_pct),
        marker: {
            color: topVar.map(d => +d.variance_pct > 200 ? '#f43f5e' : +d.variance_pct > 50 ? '#f59e0b' : '#10b981')
        },
        text: topVar.map(d => d.variance_pct + '%'),
        textposition: 'outside',
        textfont: { color: '#94a3b8' }
    }], {
        ...PLOTLY_DARK,
        title: { text: 'Top 10 Services by Price Variance from Medicare', font: { color: '#f1f5f9', size: 14 } },
        height: 440, yaxis: { autorange: 'reversed', gridcolor: 'rgba(0,0,0,0)' },
        margin: { ...PLOTLY_DARK.margin, l: 220 }
    }, { responsive: true });

    // Category comparison
    const categories = [...new Set(data.map(d => d.category))];
    const catAvg = categories.map(cat => {
        const items = data.filter(d => d.category === cat);
        return {
            category: cat,
            cash: items.reduce((s, d) => s + d.cash_price, 0) / items.length,
            medicare: items.reduce((s, d) => s + d.medicare_rate, 0) / items.length
        };
    });

    Plotly.react('category-bar-chart', [
        { type: 'bar', name: 'Hospital Cash', x: catAvg.map(d => d.category), y: catAvg.map(d => d.cash), marker: { color: '#6366f1' } },
        { type: 'bar', name: 'Medicare Rate', x: catAvg.map(d => d.category), y: catAvg.map(d => d.medicare), marker: { color: '#10b981' } }
    ], {
        ...PLOTLY_DARK, barmode: 'group',
        title: { text: 'Average Price by Category', font: { color: '#f1f5f9', size: 14 } },
        height: 440, legend: { font: { color: '#94a3b8' } }
    }, { responsive: true });

    // Cumulative chart
    const sorted = [...data].sort((a, b) => b.cash_price - a.cash_price);
    let cumHosp = 0, cumMed = 0;
    sorted.forEach((d, i) => { cumHosp += d.cash_price; cumMed += d.medicare_rate; d.cumHosp = cumHosp; d.cumMed = cumMed; d.rank = i + 1; });

    Plotly.react('cumulative-chart', [
        { type: 'scatter', mode: 'lines+markers', name: 'Hospital', x: sorted.map(d => d.rank), y: sorted.map(d => d.cumHosp), line: { color: '#6366f1', width: 3 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'lines+markers', name: 'Medicare', x: sorted.map(d => d.rank), y: sorted.map(d => d.cumMed), line: { color: '#10b981', width: 3 }, marker: { size: 5 } }
    ], {
        ...PLOTLY_DARK,
        title: { text: 'Cumulative Cost by Service Rank', font: { color: '#f1f5f9', size: 14 } },
        height: 400, xaxis: { ...PLOTLY_DARK.xaxis, title: 'Service Rank' }, yaxis: { ...PLOTLY_DARK.yaxis, title: 'Cumulative ($)' },
        legend: { font: { color: '#94a3b8' } }
    }, { responsive: true });

    // Category pie
    const catTotals = categories.map(cat => ({
        cat, total: data.filter(d => d.category === cat).reduce((s, d) => s + d.cash_price, 0)
    }));
    Plotly.react('category-pie-chart', [{
        type: 'pie', labels: catTotals.map(d => d.cat), values: catTotals.map(d => d.total),
        marker: { colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'] },
        textinfo: 'label+percent', textfont: { color: '#f1f5f9' }, hole: 0.35
    }], {
        ...PLOTLY_DARK,
        title: { text: 'Cost Distribution by Category', font: { color: '#f1f5f9', size: 14 } },
        height: 400, showlegend: false
    }, { responsive: true });

    // Service table
    const tableHTML = `<table class="data-table">
    <thead><tr>
      <th>Service</th><th>Category</th><th>Hospital $</th><th>Medicare $</th><th>Variance %</th><th>Variance $</th>
    </tr></thead>
    <tbody>${data.sort((a, b) => b.variance_pct - a.variance_pct).map(d => {
        const vDol = (d.cash_price - d.medicare_rate).toFixed(2);
        const cls = +d.variance_pct > 200 ? 'cell-danger' : +d.variance_pct > 50 ? 'cell-warning' : 'cell-success';
        return `<tr>
        <td>${d.description}</td><td>${d.category}</td>
        <td>$${d.cash_price.toFixed(2)}</td><td>$${d.medicare_rate.toFixed(2)}</td>
        <td class="${cls}">${d.variance_pct}%</td><td class="${cls}">$${vDol}</td>
      </tr>`;
    }).join('')}</tbody></table>`;
    document.getElementById('service-table-wrapper').innerHTML = tableHTML;
}

// ===== TAB 3: Price Comparison =====
function renderPriceComparison() {
    const cats = [...new Set(services.map(s => s.category))];
    const colorMap = { facility: '#6366f1', imaging: '#06b6d4', lab: '#10b981', procedure: '#f59e0b' };

    // Scatter
    const traces = cats.map(cat => {
        const items = services.filter(s => s.category === cat);
        return {
            type: 'scatter', mode: 'markers', name: cat,
            x: items.map(s => s.medicare_rate), y: items.map(s => s.cash_price),
            marker: { size: items.map(s => Math.max(8, Math.sqrt(s.gross_charge) * 0.4)), color: colorMap[cat], opacity: 0.8 },
            text: items.map(s => `${s.description} (CPT ${s.cpt})`), hoverinfo: 'text+x+y'
        };
    });
    const maxVal = Math.max(...services.map(s => Math.max(s.medicare_rate, s.cash_price)));
    traces.push({
        type: 'scatter', mode: 'lines', name: 'Equal Price',
        x: [0, maxVal * 1.1], y: [0, maxVal * 1.1],
        line: { dash: 'dash', color: 'rgba(255,255,255,0.2)', width: 1 }, showlegend: true
    });

    Plotly.react('scatter-chart', traces, {
        ...PLOTLY_DARK,
        title: { text: 'Hospital Cash Price vs Medicare Rate', font: { color: '#f1f5f9', size: 16 } },
        height: 500, xaxis: { ...PLOTLY_DARK.xaxis, title: 'Medicare Rate ($)' }, yaxis: { ...PLOTLY_DARK.yaxis, title: 'Hospital Cash Price ($)' },
        legend: { font: { color: '#94a3b8' }, bgcolor: 'rgba(0,0,0,0)' }
    }, { responsive: true });

    // Histogram
    const markups = services.map(s => ((s.cash_price - s.medicare_rate) / s.medicare_rate * 100));
    Plotly.react('histogram-chart', [{
        type: 'histogram', x: markups, nbinsx: 15,
        marker: { color: '#06b6d4', line: { color: 'rgba(6,182,212,0.5)', width: 1 } }
    }], {
        ...PLOTLY_DARK,
        title: { text: 'Distribution of Price Markup from Medicare', font: { color: '#f1f5f9', size: 14 } },
        height: 400, xaxis: { ...PLOTLY_DARK.xaxis, title: 'Markup (%)' }, yaxis: { ...PLOTLY_DARK.yaxis, title: 'Count' },
        shapes: [{ type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper', line: { color: '#f43f5e', dash: 'dash', width: 2 } }]
    }, { responsive: true });

    // Box plot
    const boxTraces = cats.map(cat => ({
        type: 'box', name: cat, y: services.filter(s => s.category === cat).map(s => s.cash_price),
        marker: { color: colorMap[cat] }, boxpoints: 'all', jitter: 0.3
    }));
    Plotly.react('box-chart', boxTraces, {
        ...PLOTLY_DARK,
        title: { text: 'Price Distribution by Category', font: { color: '#f1f5f9', size: 14 } },
        height: 400, yaxis: { ...PLOTLY_DARK.yaxis, title: 'Cash Price ($)' }, showlegend: false
    }, { responsive: true });

    // Service count
    const countData = cats.map(cat => ({ cat, count: services.filter(s => s.category === cat).length }));
    Plotly.react('service-count-chart', [{
        type: 'bar', x: countData.map(d => d.cat), y: countData.map(d => d.count),
        marker: { color: countData.map(d => colorMap[d.cat]) },
        text: countData.map(d => d.count), textposition: 'outside', textfont: { color: '#94a3b8' }
    }], {
        ...PLOTLY_DARK,
        title: { text: 'Number of Services by Category', font: { color: '#f1f5f9', size: 14 } },
        height: 350, yaxis: { ...PLOTLY_DARK.yaxis, title: 'Count' }
    }, { responsive: true });
}

// ===== TAB 4: Insights =====
function renderInsights() {
    const markups = services.map(s => ((s.cash_price - s.medicare_rate) / s.medicare_rate * 100));
    const avgMarkup = markups.reduce((a, b) => a + b, 0) / markups.length;
    const belowMedicare = services.filter(s => s.cash_price < s.medicare_rate).length;

    const highestIdx = markups.indexOf(Math.max(...markups));
    const highest = services[highestIdx];
    const highestPct = markups[highestIdx];

    const totalHosp = services.reduce((s, d) => s + d.cash_price, 0);
    const totalMed = services.reduce((s, d) => s + d.medicare_rate, 0);
    const diff = Math.abs(totalHosp - totalMed);
    const hospMore = totalHosp > totalMed;

    // Top 5 best deals
    const bestDeals = [...services].map(s => ({
        ...s, savings: s.medicare_rate - s.cash_price,
        savingsPct: ((s.medicare_rate - s.cash_price) / s.medicare_rate * 100)
    })).sort((a, b) => b.savings - a.savings).slice(0, 5);

    // Top 5 worst markups
    const worstMarkups = [...services].map(s => ({
        ...s, markup: s.cash_price - s.medicare_rate,
        markupPct: ((s.cash_price - s.medicare_rate) / s.medicare_rate * 100)
    })).sort((a, b) => b.markup - a.markup).slice(0, 5);

    document.getElementById('insights-content').innerHTML = `
    <div class="summary-box">
      <div class="summary-icon">🔍</div>
      <h3>Key Findings</h3>
      <p><strong>Surprising Discovery:</strong> Inova's cash prices are on average <strong>${Math.abs(avgMarkup).toFixed(1)}%
        ${avgMarkup > 0 ? 'HIGHER' : 'LOWER'}</strong> than Medicare rates!</p>
      <p>${belowMedicare} out of ${services.length} services (${(belowMedicare / services.length * 100).toFixed(0)}%)
        are priced below Medicare benchmarks.</p>
      <p style="margin-top:12px"><strong>Highest Markup:</strong> ${highest.description} is
        <span style="color: var(--accent-rose); font-weight:700">${highestPct.toFixed(1)}%</span> above Medicare rate.</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card ${hospMore ? 'rose' : 'emerald'}">
        <div class="kpi-label">💰 Savings Calculator</div>
        <div class="kpi-value ${hospMore ? 'rose' : 'emerald'}">
          ${hospMore ? 'SAVE' : 'PAY'} $${diff.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${hospMore ? '' : 'MORE'}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">
          If you paid Medicare rates instead of hospital cash prices
        </div>
      </div>
      <div class="kpi-card cyan">
        <div class="kpi-label">Total Hospital</div>
        <div class="kpi-value cyan">$${totalHosp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </div>
      <div class="kpi-card emerald">
        <div class="kpi-label">Total Medicare</div>
        <div class="kpi-value emerald">$${totalMed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      </div>
    </div>

    <div class="insight-grid">
      <div class="insight-card">
        <h4>✅ Top 5 Best Deals (vs Medicare)</h4>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>Service</th><th>Hospital $</th><th>Medicare $</th><th>Savings $</th></tr></thead>
            <tbody>${bestDeals.map(d => `<tr>
              <td>${d.description}</td>
              <td>$${d.cash_price.toFixed(2)}</td>
              <td>$${d.medicare_rate.toFixed(2)}</td>
              <td class="cell-success">$${d.savings.toFixed(2)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
      <div class="insight-card">
        <h4>⚠️ Top 5 Highest Markups (vs Medicare)</h4>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>Service</th><th>Hospital $</th><th>Medicare $</th><th>Markup $</th></tr></thead>
            <tbody>${worstMarkups.map(d => `<tr>
              <td>${d.description}</td>
              <td>$${d.cash_price.toFixed(2)}</td>
              <td>$${d.medicare_rate.toFixed(2)}</td>
              <td class="cell-danger">$${d.markup.toFixed(2)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="insight-card">
      <h4>📌 What This Means</h4>
      <ul>
        <li>Inova's cash prices are competitive with Medicare</li>
        <li>Price transparency reveals unexpected cost structures</li>
        <li>Self-pay patients may get better rates than expected</li>
        <li>Always ask about cash prices vs insurance billing</li>
      </ul>
    </div>
  `;
}

// ===== TAB 5: Explain My Bill =====
function renderExplainBillSetup() {
    const selector = document.getElementById('service-selector');
    selector.innerHTML = services.map(s => `
    <label class="service-checkbox">
      <input type="checkbox" value="${s.cpt}" checked>
      <span class="cpt-badge">${s.cpt}</span>
      <span>${s.description}</span>
    </label>
  `).join('');
    generateExplanations(); // Auto-generate on first load
}

function generateExplanations() {
    const checked = [...document.querySelectorAll('#service-selector input:checked')].map(c => c.value);
    const selected = services.filter(s => checked.includes(s.cpt));

    if (selected.length === 0) {
        document.getElementById('explanation-cards').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">Select at least one service to generate explanations.</p>';
        document.getElementById('explanation-summary').classList.add('hidden');
        return;
    }

    const { copay, deductible, coinsurance } = getScenarioValues();
    const totalBilled = selected.reduce((s, svc) => s + svc.gross_charge, 0);
    const totalAllowed = selected.reduce((s, svc) => s + (svc.negotiated_median || svc.medicare_rate), 0);
    const patientOwes = calcPatientOwes(totalAllowed, copay, deductible, coinsurance);

    // Summary
    document.getElementById('explanation-summary').classList.remove('hidden');
    document.getElementById('explanation-summary').innerHTML = `
    <div class="summary-box">
      <div class="summary-icon">📝</div>
      <h3>Your Bill Summary</h3>
      <p>You visited <strong>${ER_DATA.hospital.name}</strong> and received <strong>${selected.length} service(s)</strong>.</p>
      <p>The hospital's total list price was <strong style="color:var(--accent-indigo)">$${totalBilled.toLocaleString()}</strong>.
        After insurance negotiations, the allowed amount is <strong style="color:var(--accent-cyan)">$${totalAllowed.toLocaleString()}</strong>
        — that's a <strong style="color:var(--accent-emerald)">${((1 - totalAllowed / totalBilled) * 100).toFixed(0)}% discount</strong>.</p>
      <p>With your plan (Copay $${copay}, Deductible $${deductible.toLocaleString()}, Coinsurance ${coinsurance}%),
        <strong>you would owe approximately <span style="color:var(--accent-rose);font-size:1.2em">$${patientOwes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></strong>.</p>
    </div>
  `;

    // Per-service cards
    document.getElementById('explanation-cards').innerHTML = selected.map(s => {
        const ratio = s.cash_price / s.medicare_rate;
        const severity = ratio > 5 ? 'high' : ratio > 2 ? 'medium' : 'low';
        const severityLabel = ratio > 5 ? '🔴 High Markup' : ratio > 2 ? '🟡 Moderate Markup' : '🟢 Fair Price';
        const negotiated = s.negotiated_median || s.medicare_rate;

        return `<div class="explanation-card ${severity}">
      <div class="service-name">${s.description}</div>
      <span class="cpt-tag">CPT ${s.cpt}</span>
      <div class="explanation-text">
        <p>You were charged <strong>$${s.gross_charge.toLocaleString()}</strong> for this service.
          The Medicare benchmark is <strong>$${s.medicare_rate.toFixed(2)}</strong>.
          Your hospital charges <strong>${ratio.toFixed(1)}x</strong> the Medicare rate.</p>
        <p>The negotiated (insurance) rate is <strong>$${negotiated.toFixed(2)}</strong>,
          which is ${((1 - negotiated / s.gross_charge) * 100).toFixed(0)}% off the list price.</p>
        <p><em>Typical use: ${s.typical_use}</em></p>
      </div>
      <span class="ratio-badge ${severity}">${severityLabel} — ${ratio.toFixed(1)}x Medicare</span>
    </div>`;
    }).join('');
}

// ===== TAB 6: What If Simulator =====
function renderWhatIf() {
    const presets = ER_DATA.planPresets;
    const planKeys = Object.keys(presets);

    // Plan Cards
    const planCardsEl = document.getElementById('plan-cards');
    if (!planCardsEl.dataset.init) {
        planCardsEl.innerHTML = planKeys.map(key => {
            const p = presets[key];
            return `<div class="plan-card" data-plan="${key}" onclick="selectPlan('${key}')">
        <div class="plan-name" style="color:${p.color}">${p.name}</div>
        <div class="plan-desc">${p.description}</div>
        <div class="plan-cost" id="plan-cost-${key}" style="color:${p.color}">—</div>
      </div>`;
        }).join('');
        planCardsEl.dataset.init = 'true';
    }

    const isOON = document.getElementById('wif-oon-toggle').checked;
    const oonMultiplier = isOON ? 2 : 1;

    const totalBilled = services.reduce((s, svc) => s + svc.gross_charge, 0);
    const baseAllowed = services.reduce((s, svc) => s + (svc.negotiated_median || svc.medicare_rate), 0);
    const totalAllowed = baseAllowed * oonMultiplier;

    // Calculate for each plan
    const planCosts = {};
    planKeys.forEach(key => {
        const p = presets[key];
        const cost = calcPatientOwes(totalAllowed, p.copay, p.deductible, p.coinsurance / 100 * 100, p.oopMax);
        planCosts[key] = cost;
        const el = document.getElementById(`plan-cost-${key}`);
        if (el) el.textContent = `$${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    });

    // Custom plan calc
    const wifDed = Number(document.getElementById('wif-deductible').value);
    const wifCo = Number(document.getElementById('wif-coinsurance').value);
    const wifCop = Number(document.getElementById('wif-copay').value);
    const wifOOP = Number(document.getElementById('wif-oopmax').value);

    const customCost = calcPatientOwes(totalAllowed, wifCop, wifDed, wifCo, wifOOP);
    const bestPlan = planKeys.reduce((best, key) => planCosts[key] < planCosts[best] ? key : best, planKeys[0]);

    // KPIs
    document.getElementById('wif-kpis').innerHTML = `
    <div class="kpi-card rose">
      <div class="kpi-label">Your Custom Plan Cost</div>
      <div class="kpi-value rose">$${customCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
    </div>
    <div class="kpi-card emerald">
      <div class="kpi-label">Best Plan</div>
      <div class="kpi-value emerald">${presets[bestPlan].name}</div>
      <div style="color:var(--text-muted);font-size:0.8rem;margin-top:4px">$${planCosts[bestPlan].toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
    </div>
    <div class="kpi-card cyan">
      <div class="kpi-label">Total Allowed</div>
      <div class="kpi-value cyan">$${totalAllowed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      <div style="color:var(--text-muted);font-size:0.8rem;margin-top:4px">${isOON ? '⚠️ Out-of-Network (2x)' : '✅ In-Network'}</div>
    </div>
    <div class="kpi-card amber">
      <div class="kpi-label">Potential Savings</div>
      <div class="kpi-value amber">$${Math.max(0, customCost - planCosts[bestPlan]).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      <div style="color:var(--text-muted);font-size:0.8rem;margin-top:4px">vs ${presets[bestPlan].name}</div>
    </div>
  `;

    // Comparison bar chart
    const allPlans = [...planKeys.map(k => ({ name: presets[k].name, cost: planCosts[k], color: presets[k].color })),
    { name: 'Your Custom', cost: customCost, color: '#f43f5e' }];
    allPlans.sort((a, b) => a.cost - b.cost);

    Plotly.react('wif-comparison-chart', [{
        type: 'bar', x: allPlans.map(p => p.name), y: allPlans.map(p => p.cost),
        marker: { color: allPlans.map(p => p.color) },
        text: allPlans.map(p => `$${p.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`),
        textposition: 'outside', textfont: { color: '#94a3b8' }
    }], {
        ...PLOTLY_DARK,
        title: { text: 'Patient Cost by Plan', font: { color: '#f1f5f9', size: 14 } },
        height: 400, yaxis: { ...PLOTLY_DARK.yaxis, title: 'You Pay ($)' }
    }, { responsive: true });

    // Gauge
    const gaugeVal = (customCost / wifOOP) * 100;
    Plotly.react('wif-gauge-chart', [{
        type: 'indicator', mode: 'gauge+number+delta',
        value: customCost,
        number: { prefix: '$', font: { color: '#f1f5f9', size: 32 } },
        delta: { reference: wifOOP, prefix: '$', font: { size: 14 } },
        gauge: {
            axis: { range: [0, wifOOP], tickcolor: '#94a3b8', tickfont: { color: '#94a3b8' } },
            bar: { color: gaugeVal > 80 ? '#f43f5e' : gaugeVal > 50 ? '#f59e0b' : '#10b981' },
            bgcolor: 'rgba(255,255,255,0.04)',
            borderwidth: 0,
            steps: [
                { range: [0, wifOOP * 0.5], color: 'rgba(16,185,129,0.08)' },
                { range: [wifOOP * 0.5, wifOOP * 0.8], color: 'rgba(245,158,11,0.08)' },
                { range: [wifOOP * 0.8, wifOOP], color: 'rgba(244,63,94,0.08)' }
            ],
            threshold: { line: { color: '#f43f5e', width: 3 }, thickness: 0.8, value: wifOOP }
        }
    }], {
        ...PLOTLY_DARK,
        title: { text: 'Progress to OOP Maximum', font: { color: '#f1f5f9', size: 14 } },
        height: 400
    }, { responsive: true });

    // Comparison table
    const tableRows = [...planKeys.map(k => {
        const p = presets[k];
        return `<tr>
      <td style="font-weight:600;color:${p.color}">${p.name}</td>
      <td>$${p.deductible.toLocaleString()}</td>
      <td>${p.coinsurance}%</td>
      <td>$${p.copay}</td>
      <td>$${p.oopMax.toLocaleString()}</td>
      <td class="${planCosts[k] === planCosts[bestPlan] ? 'best-value' : 'highlight-col'}">$${planCosts[k].toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
    </tr>`;
    }),
    `<tr style="background:rgba(244,63,94,0.06)">
      <td style="font-weight:700;color:#f43f5e">Your Custom</td>
      <td>$${wifDed.toLocaleString()}</td>
      <td>${wifCo}%</td>
      <td>$${wifCop}</td>
      <td>$${wifOOP.toLocaleString()}</td>
      <td class="highlight-col" style="color:#f43f5e;font-weight:700">$${customCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
    </tr>`
    ].join('');

    document.getElementById('wif-table-wrapper').innerHTML = `
    <table class="comparison-table">
      <thead><tr>
        <th>Plan</th><th>Deductible</th><th>Coinsurance</th><th>Copay</th><th>OOP Max</th><th>You Pay</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
}

function selectPlan(key) {
    const p = ER_DATA.planPresets[key];
    document.getElementById('wif-deductible').value = p.deductible;
    document.getElementById('wif-coinsurance').value = p.coinsurance;
    document.getElementById('wif-copay').value = p.copay;
    document.getElementById('wif-oopmax').value = p.oopMax;

    document.getElementById('wif-deductible-value').textContent = `$${p.deductible.toLocaleString()}`;
    document.getElementById('wif-coinsurance-value').textContent = `${p.coinsurance}%`;
    document.getElementById('wif-copay-value').textContent = `$${p.copay}`;
    document.getElementById('wif-oopmax-value').textContent = `$${p.oopMax.toLocaleString()}`;

    document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
    document.querySelector(`.plan-card[data-plan="${key}"]`).classList.add('selected');

    renderWhatIf();
}

// ===== TAB 7: Red Flags =====
function renderRedFlags() {
    const medThreshold = Number(document.getElementById('rf-medicare-threshold').value);
    const varThreshold = Number(document.getElementById('rf-variance-threshold').value);

    const flags = [];
    const cashPrices = services.map(s => s.cash_price);
    const p95 = cashPrices.sort((a, b) => a - b)[Math.floor(cashPrices.length * 0.95)];

    services.forEach(s => {
        const ratio = s.cash_price / s.medicare_rate;
        const negVariance = s.negotiated_max && s.negotiated_min
            ? ((s.negotiated_max - s.negotiated_min) / s.negotiated_min * 100) : 0;

        if (ratio >= medThreshold) {
            flags.push({
                ...s, flagType: 'Extreme Medicare Markup', severity: ratio >= medThreshold * 1.5 ? 'critical' : 'warning',
                message: `⚠️ This ${s.description.toLowerCase()} price is ${((ratio - 1) * 100).toFixed(0)}% above Medicare average.`,
                ratio, detail: `Hospital charges ${ratio.toFixed(1)}x the Medicare rate of $${s.medicare_rate.toFixed(2)}`
            });
        }
        if (negVariance >= varThreshold) {
            flags.push({
                ...s, flagType: 'High Negotiated Variance', severity: 'warning',
                message: `⚠️ Negotiated rates vary by ${negVariance.toFixed(0)}% ($${s.negotiated_min} – $${s.negotiated_max}).`,
                ratio: negVariance / 100, detail: `Min: $${s.negotiated_min}, Max: $${s.negotiated_max}`
            });
        }
        if (s.cash_price >= p95 && ratio > 2) {
            const exists = flags.find(f => f.cpt === s.cpt && f.flagType === 'Extreme Medicare Markup');
            if (!exists) {
                flags.push({
                    ...s, flagType: 'Outlier Pricing', severity: 'warning',
                    message: `⚠️ This service is in the top 5% most expensive and is ${ratio.toFixed(1)}x Medicare.`,
                    ratio, detail: `Cash price $${s.cash_price.toFixed(2)} is in the 95th percentile`
                });
            }
        }
    });

    flags.sort((a, b) => b.ratio - a.ratio);

    const criticalCount = flags.filter(f => f.severity === 'critical').length;
    const warningCount = flags.filter(f => f.severity === 'warning').length;
    const okCount = services.length - new Set(flags.map(f => f.cpt)).size;

    // Alert banner
    document.getElementById('rf-alert-banner').innerHTML = `
    <div class="alert-stat critical">
      <div class="stat-number">${criticalCount}</div>
      <div class="stat-label">🔴 Critical</div>
    </div>
    <div class="alert-stat warning">
      <div class="stat-number">${warningCount}</div>
      <div class="stat-label">🟠 Warning</div>
    </div>
    <div class="alert-stat ok">
      <div class="stat-number">${okCount}</div>
      <div class="stat-label">🟢 Clean</div>
    </div>
    <div class="alert-stat" style="background:rgba(99,102,241,0.08);border-color:rgba(99,102,241,0.2)">
      <div class="stat-number" style="color:var(--accent-indigo)">${services.length}</div>
      <div class="stat-label">Total Services</div>
    </div>
  `;

    // Flag cards
    document.getElementById('rf-flag-cards').innerHTML = flags.length === 0
        ? '<div class="summary-box"><div class="summary-icon">✅</div><h3>No Red Flags Detected</h3><p>All services are within acceptable thresholds. Try lowering the thresholds to find more potential issues.</p></div>'
        : flags.map(f => `
      <div class="flag-card ${f.severity}">
        <div class="flag-icon">${f.severity === 'critical' ? '🔴' : '🟠'}</div>
        <div class="flag-content">
          <div class="flag-title">${f.description} (CPT ${f.cpt})</div>
          <div class="flag-message">${f.message}</div>
          <div class="flag-message" style="margin-top:4px;font-size:0.8rem;color:var(--text-muted)">${f.detail} — Type: ${f.flagType}</div>
        </div>
      </div>
    `).join('');

    // Scatter with flags highlighted
    const flaggedCPTs = new Set(flags.map(f => f.cpt));
    const normal = services.filter(s => !flaggedCPTs.has(s.cpt));
    const flagged = services.filter(s => flaggedCPTs.has(s.cpt));

    const maxVal = Math.max(...services.map(s => Math.max(s.medicare_rate, s.cash_price)));

    Plotly.react('rf-scatter-chart', [
        {
            type: 'scatter', mode: 'markers', name: 'Normal',
            x: normal.map(s => s.medicare_rate), y: normal.map(s => s.cash_price),
            marker: { size: 10, color: '#10b981', opacity: 0.6 },
            text: normal.map(s => s.description), hoverinfo: 'text+x+y'
        },
        {
            type: 'scatter', mode: 'markers+text', name: '🚩 Flagged',
            x: flagged.map(s => s.medicare_rate), y: flagged.map(s => s.cash_price),
            marker: { size: 14, color: '#f43f5e', symbol: 'diamond', line: { color: '#fff', width: 1 } },
            text: flagged.map(s => s.cpt), textposition: 'top center', textfont: { color: '#f43f5e', size: 10 },
            hovertext: flagged.map(s => `${s.description} — ${(s.cash_price / s.medicare_rate).toFixed(1)}x Medicare`), hoverinfo: 'text'
        },
        {
            type: 'scatter', mode: 'lines', name: `${medThreshold}x Medicare`,
            x: [0, maxVal], y: [0, maxVal * medThreshold],
            line: { dash: 'dash', color: 'rgba(244,63,94,0.4)', width: 2 }, showlegend: true
        },
        {
            type: 'scatter', mode: 'lines', name: 'Equal Price',
            x: [0, maxVal * 1.1], y: [0, maxVal * 1.1],
            line: { dash: 'dot', color: 'rgba(255,255,255,0.15)', width: 1 }
        }
    ], {
        ...PLOTLY_DARK,
        title: { text: 'Red Flag Detection — Hospital vs Medicare', font: { color: '#f1f5f9', size: 14 } },
        height: 450,
        xaxis: { ...PLOTLY_DARK.xaxis, title: 'Medicare Rate ($)' },
        yaxis: { ...PLOTLY_DARK.yaxis, title: 'Hospital Cash Price ($)' },
        legend: { font: { color: '#94a3b8' }, bgcolor: 'rgba(0,0,0,0)' }
    }, { responsive: true });

    // Flag table
    if (flags.length > 0) {
        document.getElementById('rf-table-wrapper').innerHTML = `
      <table class="data-table">
        <thead><tr>
          <th>Service</th><th>CPT</th><th>Flag Type</th><th>Severity</th><th>Hospital $</th><th>Medicare $</th><th>Ratio</th>
        </tr></thead>
        <tbody>${flags.map(f => `<tr>
          <td>${f.description}</td>
          <td><span style="font-family:monospace;color:var(--accent-cyan)">${f.cpt}</span></td>
          <td>${f.flagType}</td>
          <td class="${f.severity === 'critical' ? 'cell-danger' : 'cell-warning'}">${f.severity.toUpperCase()}</td>
          <td>$${f.cash_price.toFixed(2)}</td>
          <td>$${f.medicare_rate.toFixed(2)}</td>
          <td class="cell-danger">${f.ratio.toFixed(1)}x</td>
        </tr>`).join('')}</tbody>
      </table>
    `;
    } else {
        document.getElementById('rf-table-wrapper').innerHTML = '<p style="padding:20px;text-align:center;color:var(--text-muted)">No flagged services.</p>';
    }
}

// ===== Initial Render =====
renderBillExplained();
