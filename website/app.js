// ER Bill Explainer — Consumer Healthcare Pricing Intelligence Platform
// app.js — Main application logic

const { services, planPresets, defaultThresholds, hospital, stateBenchmarks, nationalPercentiles } = ER_DATA;

// ===== Utility Functions =====
const fmt = n => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtDec = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = n => n.toFixed(0) + '%';

// ===== Theme Toggle =====
function setupTheme() {
  const toggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme');
  // Default is dark theme (CSS :root = light, [data-theme=dark] = dark)
  if (saved === 'light') {
    document.documentElement.removeAttribute('data-theme');
    toggle.textContent = '☀️';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggle.textContent = '🌙';
  }
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      toggle.textContent = '☀️';
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggle.textContent = '🌙';
      localStorage.setItem('theme', 'dark');
    }
  });
}

// ===== Hero Counter Animation =====
function animateCounters() {
  const counters = [
    { el: document.getElementById('hero-count-bills'), target: 50000, prefix: '', suffix: '+' },
    { el: document.getElementById('hero-count-people'), target: 25000, prefix: '', suffix: '+' },
    { el: document.getElementById('hero-count-saved'), target: 12, prefix: '$', suffix: 'M+' }
  ];
  const duration = 2000;
  const steps = 60;
  const interval = duration / steps;

  counters.forEach(({ el, target, prefix, suffix }) => {
    if (!el) return;
    let current = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      const display = target >= 1000
        ? Math.floor(current).toLocaleString('en-US')
        : Math.floor(current);
      el.textContent = prefix + display + suffix;
    }, interval);
  });
}

// ===== Tab Navigation =====
function setupTabs() {
  const allLinks = document.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll('.tab-panel');
  const progressSteps = document.querySelectorAll('.progress-step');

  allLinks.forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.dataset.tab;

      // Update nav links
      document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.tab === tab);
        if (l.dataset.tab === tab) l.setAttribute('aria-current', 'page');
        else l.removeAttribute('aria-current');
      });

      // Update panels
      panels.forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));

      // Update progress steps
      const tabOrder = ['dashboard', 'services', 'compare', 'simulator', 'action-plan'];
      const currentIdx = tabOrder.indexOf(tab);
      progressSteps.forEach(s => {
        const stepIdx = tabOrder.indexOf(s.dataset.tab);
        s.classList.toggle('active', stepIdx <= currentIdx);
        s.classList.toggle('current', s.dataset.tab === tab);
      });

      // Close mobile nav
      document.getElementById('mobile-nav-overlay').classList.remove('open');
      document.getElementById('nav-hamburger').classList.remove('active');
    });
  });

  // Hamburger
  document.getElementById('nav-hamburger').addEventListener('click', () => {
    document.getElementById('mobile-nav-overlay').classList.toggle('open');
    document.getElementById('nav-hamburger').classList.toggle('active');
  });

  // Navbar scroll
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ===== Computed Analytics =====
function computeAnalytics() {
  const analyzed = services.map(s => {
    const markup = s.gross_charge / s.medicare_rate;
    const stateMarkup = stateBenchmarks.byCpt[s.cpt] || markup;
    const savings = s.gross_charge - s.medicare_rate;
    let severity;
    if (markup >= 15) severity = 'critical';
    else if (markup >= 8) severity = 'high';
    else if (markup >= 4) severity = 'moderate';
    else severity = 'fair';
    return { ...s, markup, stateMarkup, savings, severity };
  }).sort((a, b) => b.markup - a.markup);

  const totalCharged = analyzed.reduce((s, i) => s + i.gross_charge, 0);
  const totalMedicare = analyzed.reduce((s, i) => s + i.medicare_rate, 0);
  const avgMarkup = (totalCharged / totalMedicare).toFixed(1);
  const overchargeCount = analyzed.filter(s => s.markup >= 8).length;
  const negotiationScore = overchargeCount >= 5 ? 'strong' : overchargeCount >= 2 ? 'moderate' : 'low';

  // Category breakdown
  const categories = {};
  analyzed.forEach(s => {
    if (!categories[s.category]) categories[s.category] = { total: 0, count: 0, items: [] };
    categories[s.category].total += s.gross_charge;
    categories[s.category].count++;
    categories[s.category].items.push(s);
  });

  // Markup distribution buckets
  const buckets = { '1-3x': 0, '3-5x': 0, '5-10x': 0, '10-15x': 0, '15x+': 0 };
  analyzed.forEach(s => {
    if (s.markup >= 15) buckets['15x+']++;
    else if (s.markup >= 10) buckets['10-15x']++;
    else if (s.markup >= 5) buckets['5-10x']++;
    else if (s.markup >= 3) buckets['3-5x']++;
    else buckets['1-3x']++;
  });

  return { analyzed, analyzedByCost: [...analyzed].sort((a, b) => b.gross_charge - a.gross_charge), totalCharged, totalMedicare, avgMarkup, overchargeCount, negotiationScore, categories, buckets };
}

// ===== RENDER: Hero Stats =====
// Hero now uses static social proof numbers (no dynamic rendering needed)

// ===== RENDER: Dashboard — Negotiation Score =====
function renderNegotiationScore(data) {
  const { negotiationScore, overchargeCount, analyzed } = data;
  const colors = { strong: '#ef4444', moderate: '#f59e0b', low: '#22c55e' };
  const labels = { strong: 'Strong Negotiation Leverage', moderate: 'Moderate Leverage', low: 'Low Leverage — Fair Pricing' };
  const icons = { strong: '🔴', moderate: '🟡', low: '🟢' };
  const color = colors[negotiationScore];

  const severeCount = analyzed.filter(s => s.markup >= 15).length;
  const highCount = analyzed.filter(s => s.markup >= 8 && s.markup < 15).length;

  document.getElementById('negotiation-score').innerHTML = `
    <div class="neg-score-header" style="border-left:4px solid ${color}">
      <div class="neg-score-icon">${icons[negotiationScore]}</div>
      <div class="neg-score-info">
        <h3> "Can I Negotiate This?" — <span style="color:${color}">${labels[negotiationScore]}</span></h3>
        <p>${overchargeCount} of ${analyzed.length} services exceed 8x Medicare rate</p>
      </div>
    </div>
    <div class="neg-score-details">
      <div class="neg-detail ${severeCount > 0 ? 'critical' : ''}">
        <span class="neg-count">${severeCount}</span>
        <span class="neg-label">Critical (15x+)</span>
      </div>
      <div class="neg-detail ${highCount > 0 ? 'high' : ''}">
        <span class="neg-count">${highCount}</span>
        <span class="neg-label">High (8-15x)</span>
      </div>
      <div class="neg-detail">
        <span class="neg-count">${analyzed.filter(s => s.markup >= 4 && s.markup < 8).length}</span>
        <span class="neg-label">Moderate (4-8x)</span>
      </div>
      <div class="neg-detail">
        <span class="neg-count">${analyzed.filter(s => s.markup < 4).length}</span>
        <span class="neg-label">Fair (< 4x)</span>
      </div>
    </div>
    <div class="neg-savings">
      <span>💰 Potential Savings if Negotiated to Medicare Rates:</span>
      <strong style="color:${color};font-size:1.3rem">${fmt(data.totalCharged - data.totalMedicare)}</strong>
    </div>
  `;
}

// ===== RENDER: Category Breakdown =====
function renderCategoryBreakdown(data) {
  const { categories, totalCharged } = data;
  const catEntries = Object.entries(categories).sort((a, b) => b[1].total - a[1].total);
  const catColors = { facility: '#6366f1', imaging: '#f59e0b', lab: '#22c55e', procedure: '#ef4444' };
  const catIcons = { facility: '🏥', imaging: '📷', lab: '🧪', procedure: '💉' };
  const nationalAvg = { facility: 45, imaging: 28, lab: 12, procedure: 15 };

  // Top 2 categories insight
  const top2 = catEntries.slice(0, 2);
  const top2Pct = top2.reduce((s, [, d]) => s + d.total, 0) / totalCharged * 100;
  const top2Names = top2.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1)).join(' and ');

  document.getElementById('category-section').innerHTML = `
    <div class="card-header">
      <h3>📊 Where Your Money Goes</h3>
      <p>Cost distribution by service category</p>
    </div>
    <div class="insight-box">
      <span class="insight-pin">📌</span>
      <span>${top2Names} charges make up <strong>${top2Pct.toFixed(0)}%</strong> of your total bill.</span>
    </div>
    <div class="category-donut-grid">
      <div class="donut-chart-wrap">
        <svg viewBox="0 0 200 200" class="donut-chart">
          ${(() => {
      let offset = 0;
      const radius = 80, cx = 100, cy = 100, circ = 2 * Math.PI * radius;
      return catEntries.map(([cat, d]) => {
        const pct = d.total / totalCharged;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${catColors[cat] || '#94a3b8'}" stroke-width="24" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" />`;
        offset += dash;
        return el;
      }).join('');
    })()}
          <text x="100" y="95" text-anchor="middle" class="donut-total-label">Total</text>
          <text x="100" y="118" text-anchor="middle" class="donut-total-value">${fmt(totalCharged)}</text>
        </svg>
      </div>
      <div class="category-legend">
        ${catEntries.map(([cat, d]) => {
      const pctOfTotal = (d.total / totalCharged * 100).toFixed(0);
      const natAvg = nationalAvg[cat];
      return `
          <div class="cat-legend-item">
            <div class="cat-legend-top">
              <span class="cat-legend-dot" style="background:${catColors[cat] || '#94a3b8'}"></span>
              <span class="cat-legend-name">${catIcons[cat] || '📋'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              <span class="cat-legend-pct">${pctOfTotal}%</span>
            </div>
            <div class="cat-legend-meta">
              ${fmt(d.total)} · ${d.count} service${d.count > 1 ? 's' : ''}${natAvg ? ` · <span class="cat-natl">Natl avg: ${natAvg}%</span>` : ''}
            </div>
          </div>`;
    }).join('')}
      </div>
    </div>
  `;
}

// ===== RENDER: Top 5 Highest Cost Services =====
function renderTopCostServices(data) {
  const { analyzedByCost, totalCharged } = data;
  const top5 = analyzedByCost.slice(0, 5);
  const top3Total = analyzedByCost.slice(0, 3).reduce((s, i) => s + i.gross_charge, 0);
  const top3Pct = (top3Total / totalCharged * 100).toFixed(0);
  const maxCost = top5[0].gross_charge;

  document.getElementById('top-cost-section').innerHTML = `
    <div class="card-header">
      <h3>💵 Top 5 Highest Cost Services</h3>
      <p>Services contributing the most to your total bill</p>
    </div>
    <div class="insight-box">
      <span class="insight-pin">📌</span>
      <span>The top 3 services account for <strong>${top3Pct}%</strong> of your total ER bill.</span>
    </div>
    <div class="cost-rank-list">
      ${top5.map((s, i) => {
    const pctOfTotal = (s.gross_charge / totalCharged * 100).toFixed(1);
    const barW = (s.gross_charge / maxCost * 100).toFixed(0);
    return `
        <div class="cost-rank-item">
          <div class="cost-rank-num">${i + 1}</div>
          <div class="cost-rank-body">
            <div class="cost-rank-top">
              <span class="cost-rank-name">${s.description}</span>
              <span class="cost-rank-amount">${fmt(s.gross_charge)}</span>
            </div>
            <div class="cost-rank-bar-bg">
              <div class="cost-rank-bar" style="width:${barW}%"></div>
            </div>
            <div class="cost-rank-meta">
              <span>${pctOfTotal}% of total bill</span>
              <span>Medicare: ${fmt(s.medicare_rate)}</span>
            </div>
          </div>
        </div>`;
  }).join('')}
    </div>
  `;
}

// ===== RENDER: Markup Distribution =====
function renderMarkupDistribution(data) {
  const { buckets, analyzed, avgMarkup } = data;
  const maxBucket = Math.max(...Object.values(buckets));
  const bucketColors = {
    '1-3x': '#22c55e', '3-5x': '#84cc16', '5-10x': '#f59e0b', '10-15x': '#f97316', '15x+': '#ef4444'
  };
  const bucketLabels = {
    '1-3x': 'Reasonable', '3-5x': 'Elevated', '5-10x': 'High', '10-15x': 'Very High', '15x+': 'Extreme'
  };
  const above5x = analyzed.filter(s => s.markup >= 5).length;
  const above5xPct = (above5x / analyzed.length * 100).toFixed(0);

  document.getElementById('markup-section').innerHTML = `
    <div class="card-header">
      <h3>⚡ How Aggressive Are These Prices?</h3>
      <p>Comparison of hospital charges to federal Medicare benchmarks</p>
    </div>
    <div class="markup-key-stats">
      <div class="markup-stat-big">
        <span class="markup-stat-value">${avgMarkup}x</span>
        <span class="markup-stat-label">Average Markup</span>
      </div>
      <div class="markup-stat-big">
        <span class="markup-stat-value">${above5xPct}%</span>
        <span class="markup-stat-label">Services Above 5x Medicare</span>
      </div>
    </div>
    <div class="markup-formula">
      <span title="Hospital Price ÷ Medicare Rate = Markup">Markup = Hospital Price ÷ Medicare Rate</span>
      <span class="markup-formula-hint">A 5x markup means the hospital charges 5 times the Medicare reimbursement rate</span>
    </div>
    <div class="distribution-chart">
      ${Object.entries(buckets).map(([label, count]) => `
        <div class="dist-column">
          <div class="dist-bar-wrap">
            <div class="dist-bar" style="height:${maxBucket > 0 ? (count / maxBucket * 100) : 0}%;background:${bucketColors[label]}">
              <span class="dist-count">${count}</span>
            </div>
          </div>
          <div class="dist-label">${label}</div>
          <div class="dist-sublabel">${bucketLabels[label]}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== RENDER: Most Overpriced Services =====
function renderMostOverpriced(data) {
  const { analyzed } = data;
  const top5 = analyzed.slice(0, 5); // Already sorted by markup desc
  const severityColors = { critical: '#ef4444', high: '#f97316', moderate: '#f59e0b', fair: '#22c55e' };
  const severityLabels = { critical: 'Extreme', high: 'Very High', moderate: 'Elevated', fair: 'Fair' };

  document.getElementById('overpriced-section').innerHTML = `
    <div class="card-header">
      <h3>🔴 Most Overpriced Services</h3>
      <p>Ranked by how much the hospital charges above Medicare rates</p>
    </div>
    <div class="overpriced-list">
      ${top5.map((s, i) => `
        <div class="overpriced-item">
          <div class="overpriced-rank" style="background:${severityColors[s.severity]}">${i + 1}</div>
          <div class="overpriced-body">
            <div class="overpriced-top">
              <span class="overpriced-name">${s.description}</span>
              <span class="overpriced-badge" style="color:${severityColors[s.severity]}">${s.markup.toFixed(1)}x markup</span>
            </div>
            <div class="overpriced-compare">
              <span class="overpriced-hospital">Hospital: ${fmt(s.gross_charge)}</span>
              <span class="overpriced-arrow">→</span>
              <span class="overpriced-medicare">Medicare: ${fmt(s.medicare_rate)}</span>
              <span class="overpriced-diff">+${fmt(s.savings)}</span>
            </div>
            <div class="overpriced-severity">
              <span class="severity-dot" style="background:${severityColors[s.severity]}"></span>
              <span>${severityLabels[s.severity]} pricing</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== RENDER: Actionable Insights Summary =====
function renderInsightsSummary(data) {
  const { categories, analyzed, totalCharged, negotiationScore, avgMarkup } = data;

  // Main cost driver category
  const topCat = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)[0];
  const topCatName = topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1);
  const topCatPct = (topCat[1].total / totalCharged * 100).toFixed(0);

  // % above 5x
  const above5x = analyzed.filter(s => s.markup >= 5).length;
  const above5xPct = (above5x / analyzed.length * 100).toFixed(0);

  // Leverage
  const leverageMap = { strong: { text: 'Strong', color: '#ef4444', icon: '🔴' }, moderate: { text: 'Moderate', color: '#f59e0b', icon: '🟡' }, low: { text: 'Low', color: '#22c55e', icon: '🟢' } };
  const lev = leverageMap[negotiationScore];

  document.getElementById('insights-section').innerHTML = `
    <div class="card-header">
      <h3>🧠 What This Means For You</h3>
      <p>Key takeaways from your bill analysis</p>
    </div>
    <div class="insights-grid">
      <div class="insight-card">
        <div class="insight-card-icon">🏥</div>
        <div class="insight-card-label">Biggest Cost Driver</div>
        <div class="insight-card-value">${topCatName}</div>
        <div class="insight-card-detail">${topCatPct}% of your total bill (${topCat[1].count} service${topCat[1].count > 1 ? 's' : ''})</div>
      </div>
      <div class="insight-card">
        <div class="insight-card-icon">⚠️</div>
        <div class="insight-card-label">Pricing Concern</div>
        <div class="insight-card-value">${above5xPct}% Above 5x</div>
        <div class="insight-card-detail">${above5x} of ${analyzed.length} services exceed 5x Medicare rate</div>
      </div>
      <div class="insight-card">
        <div class="insight-card-icon">${lev.icon}</div>
        <div class="insight-card-label">Negotiation Leverage</div>
        <div class="insight-card-value" style="color:${lev.color}">${lev.text}</div>
        <div class="insight-card-detail">Average markup: ${avgMarkup}x · Potential savings: ${fmt(data.totalCharged - data.totalMedicare)}</div>
      </div>
    </div>
  `;
}

// ===== RENDER: Services — Ranked with Tags =====
function renderServiceCards(data, filterCategory = 'all') {
  const { analyzed } = data;
  const filtered = filterCategory === 'all' ? analyzed : analyzed.filter(s => s.category === filterCategory);

  // Render filter pills
  const cats = ['all', ...new Set(services.map(s => s.category))];
  const catLabels = { all: 'All Services', facility: '🏥 Facility', imaging: '📷 Imaging', lab: '🧪 Labs', procedure: '💉 Procedures' };
  document.getElementById('category-filters').innerHTML = cats.map(c =>
    `<button class="filter-pill ${c === filterCategory ? 'active' : ''}" onclick="renderServiceCards(window._data, '${c}')">${catLabels[c] || c}</button>`
  ).join('');

  // Tags
  const getTag = (s, idx) => {
    if (idx === 0) return '<span class="svc-tag tag-hot">🔥 Most Expensive</span>';
    if (s.severity === 'critical') return '<span class="svc-tag tag-danger">⚠ Extreme Markup</span>';
    if (s.severity === 'high') return '<span class="svc-tag tag-warning">⚠ High Markup</span>';
    if (s.severity === 'fair') return '<span class="svc-tag tag-success">✅ Fair Price</span>';
    return '';
  };

  document.getElementById('service-cards').innerHTML = filtered.map((s, i) => {
    const barWidth = Math.min(100, (s.medicare_rate / s.gross_charge) * 100);
    return `
      <div class="service-card" style="animation-delay:${i * 0.04}s">
        <div class="service-card-top">
          <div class="service-card-title">
            <span class="service-card-cpt">CPT ${s.cpt}</span>
            <h4>${s.description}</h4>
            <span class="service-typical-use">${s.typical_use}</span>
          </div>
          ${getTag(s, i)}
        </div>
        <div class="service-prices">
          <div class="price-col">
            <span class="price-label">Hospital Charges</span>
            <span class="price-val hospital">${fmtDec(s.gross_charge)}</span>
          </div>
          <div class="price-col">
            <span class="price-label">Medicare Rate</span>
            <span class="price-val medicare">${fmtDec(s.medicare_rate)}</span>
          </div>
          <div class="price-col">
            <span class="price-label">Markup</span>
            <span class="price-val markup-${s.severity}">${s.markup.toFixed(1)}x</span>
          </div>
        </div>
        <div class="service-bar-wrap">
          <div class="service-bar-label">Medicare covers ${barWidth.toFixed(0)}% of hospital charge</div>
          <div class="service-bar-bg">
            <div class="service-bar-fill" style="width:${barWidth}%"></div>
            <div class="service-bar-marker" style="left:${barWidth}%"></div>
          </div>
        </div>
        <div class="service-negotiation">
          <strong>💬 Talking Point:</strong> "I see this ${s.description.toLowerCase()} is billed at ${s.markup.toFixed(1)}x
          the Medicare rate. The typical negotiated rate is ${fmtDec(s.negotiated_median)}. Can we discuss
          adjusting this closer to the ${fmtDec(s.cash_price)} cash price?"
        </div>
      </div>
    `;
  }).join('');
}

// ===== RENDER: Compare — Benchmarking =====
function renderCompare(data) {
  const { analyzed, categories } = data;
  const state = stateBenchmarks.state;

  // Hospital vs State comparison
  const catEntries = Object.entries(categories).sort((a, b) => b[1].total - a[1].total);
  const catColors = { facility: '#6366f1', imaging: '#f59e0b', lab: '#22c55e', procedure: '#ef4444' };

  document.getElementById('hospital-comparison').innerHTML = `
    <div class="card" style="margin-bottom:24px">
      <div class="card-header">
        <h3>🏥 Inova Alexandria vs ${state} State Average</h3>
        <p>How this hospital's markups compare to statewide norms</p>
      </div>
      <div class="comparison-grid">
        ${catEntries.map(([cat, d]) => {
    const bench = stateBenchmarks.byCategory[cat];
    const hospitalAvg = d.items.reduce((s, i) => s + i.markup, 0) / d.items.length;
    const diff = hospitalAvg - bench.stateAvg;
    const isAbove = diff > 0;
    return `
            <div class="comparison-card">
              <div class="comparison-cat" style="color:${catColors[cat]}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
              <div class="comparison-bars">
                <div class="comp-row">
                  <span class="comp-label">This Hospital</span>
                  <div class="comp-bar-bg">
                    <div class="comp-bar" style="width:${Math.min(100, hospitalAvg / 25 * 100)}%;background:${catColors[cat]}"></div>
                  </div>
                  <span class="comp-val">${hospitalAvg.toFixed(1)}x</span>
                </div>
                <div class="comp-row">
                  <span class="comp-label">${state} Avg</span>
                  <div class="comp-bar-bg">
                    <div class="comp-bar" style="width:${Math.min(100, bench.stateAvg / 25 * 100)}%;background:rgba(${catColors[cat].replace('#', '').match(/../g).map(h => parseInt(h, 16)).join(',')},0.4)"></div>
                  </div>
                  <span class="comp-val">${bench.stateAvg.toFixed(1)}x</span>
                </div>
              </div>
              <div class="comparison-verdict ${isAbove ? 'above' : 'below'}">
                ${isAbove ? '📈' : '📉'} ${Math.abs(diff).toFixed(1)}x ${isAbove ? 'above' : 'below'} state average
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;

  // Variance Analysis — Top overcharges vs state
  const variances = analyzed.map(s => ({
    ...s,
    diff: s.markup - s.stateMarkup,
    pctAboveState: ((s.markup / s.stateMarkup - 1) * 100).toFixed(0)
  })).filter(s => s.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 8);

  document.getElementById('variance-analysis').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>🔍 Variance Analysis — Where This Hospital Stands Out</h3>
        <p>Services where Inova Alexandria charges significantly more than the ${state} average</p>
      </div>
      <div class="variance-list">
        ${variances.map((s, i) => `
          <div class="variance-item" style="animation-delay:${i * 0.06}s">
            <div class="variance-header">
              <span class="variance-title">${s.description}</span>
              <span class="variance-cpt">CPT ${s.cpt}</span>
            </div>
            <div class="variance-stats">
              <div class="var-stat">
                <span class="var-label">This Hospital</span>
                <span class="var-val danger">${s.markup.toFixed(1)}x Medicare</span>
              </div>
              <div class="var-stat">
                <span class="var-label">${state} Average</span>
                <span class="var-val muted">${s.stateMarkup.toFixed(1)}x Medicare</span>
              </div>
              <div class="var-stat">
                <span class="var-label">Difference</span>
                <span class="var-val ${s.diff > 3 ? 'danger' : 'warning'}">+${s.diff.toFixed(1)}x above state</span>
              </div>
            </div>
            <div class="variance-context">
              ℹ️ ${s.description} at Inova is priced ${s.pctAboveState}% higher than the typical ${state} hospital.
              National median markup for ${s.category} is ${stateBenchmarks.byCategory[s.category]?.nationalMedian || '—'}x.
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== RENDER: Simulator =====
function calcOutOfPocket(totalBill, deductible, coinsurance, copay, oopMax) {
  let total = copay;
  let remaining = totalBill - copay;
  if (remaining <= 0) return Math.min(total, oopMax);

  const dedApplied = Math.min(remaining, deductible);
  total += dedApplied;
  remaining -= dedApplied;

  const coinsAmt = remaining * (coinsurance / 100);
  total += coinsAmt;

  return Math.min(total, oopMax);
}

function renderSimulator(data) {
  const { totalCharged } = data;
  const presetEntries = Object.entries(planPresets);

  // Render plan cards - Simplified for less clutter
  document.getElementById('plan-cards').innerHTML = presetEntries.map(([key, plan]) => {
    const oop = calcOutOfPocket(totalCharged, plan.deductible, plan.coinsurance, plan.copay, plan.oopMax);
    const insurancePays = totalCharged - oop;
    return `
      <div class="plan-card" onclick="applyPlan('${key}')" style="border-top:4px solid ${plan.color}" title="${plan.description}">
        <div class="plan-card-header">
          <div class="plan-card-name">${plan.name}</div>
        </div>
        <div class="plan-card-body">
          <div class="plan-cost">${fmt(oop)}</div>
          <div class="plan-label">Your Share</div>
        </div>
        <div class="plan-card-footer">
          <span class="plan-detail-icon">🛡️</span>
          <span class="plan-detail-text">Plan covers ${fmt(insurancePays)}</span>
        </div>
      </div>
    `;
  }).join('');

  // Custom plan
  updateCustomSim(data);
}

function applyPlan(key) {
  const plan = planPresets[key];
  document.getElementById('wif-deductible').value = plan.deductible;
  document.getElementById('wif-coinsurance').value = plan.coinsurance;
  document.getElementById('wif-copay').value = plan.copay;
  document.getElementById('wif-oopmax').value = plan.oopMax;
  document.getElementById('wif-deductible-value').textContent = fmt(plan.deductible);
  document.getElementById('wif-coinsurance-value').textContent = plan.coinsurance + '%';
  document.getElementById('wif-copay-value').textContent = fmt(plan.copay);
  document.getElementById('wif-oopmax-value').textContent = fmt(plan.oopMax);
  updateCustomSim(window._data);
}

function updateCustomSim(data) {
  const totalBill = data.totalCharged;
  const ded = +document.getElementById('wif-deductible').value;
  const coins = +document.getElementById('wif-coinsurance').value;
  const cop = +document.getElementById('wif-copay').value;
  const oop = +document.getElementById('wif-oopmax').value;

  const yourCost = calcOutOfPocket(totalBill, ded, coins, cop, oop);
  const insurancePays = totalBill - yourCost;

  // Update values display
  document.getElementById('wif-deductible-value').textContent = fmt(ded);
  document.getElementById('wif-coinsurance-value').textContent = coins + '%';
  document.getElementById('wif-copay-value').textContent = fmt(cop);
  document.getElementById('wif-oopmax-value').textContent = fmt(oop);

  // Sim results
  document.getElementById('sim-results').innerHTML = `
    <div class="sim-result-card">
      <div class="sim-result-label">Total Bill</div>
      <div class="sim-result-value">${fmt(totalBill)}</div>
    </div>
    <div class="sim-result-card highlight">
      <div class="sim-result-label">You Pay</div>
      <div class="sim-result-value danger">${fmt(yourCost)}</div>
    </div>
    <div class="sim-result-card">
      <div class="sim-result-label">Insurance Pays</div>
      <div class="sim-result-value success">${fmt(insurancePays)}</div>
    </div>
  `;

  // Recommendation
  renderRecommendation(data);
}

function renderRecommendation(data) {
  const totalBill = data.totalCharged;
  const results = Object.entries(planPresets).map(([key, plan]) => ({
    key, name: plan.name,
    oop: calcOutOfPocket(totalBill, plan.deductible, plan.coinsurance, plan.copay, plan.oopMax),
    worstCase: plan.oopMax,
    description: plan.description
  })).sort((a, b) => a.oop - b.oop);

  const best = results[0];
  const worst = results[results.length - 1];
  const savings = worst.oop - best.oop;

  const recEl = document.getElementById('sim-recommendation');
  recEl.style.display = 'block';
  recEl.innerHTML = `
    <div class="rec-header">
      <span class="rec-icon">📌</span>
      <div>
        <h3>Recommendation</h3>
        <p>Based on this ${fmt(totalBill)} ER bill scenario</p>
      </div>
    </div>
    <div class="rec-body">
      <div class="rec-best">
        <span class="rec-label">Best Plan for This Visit</span>
        <span class="rec-plan">${best.name}</span>
        <span class="rec-cost">${fmt(best.oop)} out-of-pocket</span>
      </div>
      <div class="rec-compare">
        <div class="rec-stat">
          <span class="rec-stat-label">Savings vs Worst Plan</span>
          <span class="rec-stat-value success">${fmt(savings)}</span>
        </div>
        <div class="rec-stat">
          <span class="rec-stat-label">Worst-Case Exposure (${best.name})</span>
          <span class="rec-stat-value">${fmt(best.worstCase)}</span>
        </div>
        <div class="rec-stat">
          <span class="rec-stat-label">Risk Level</span>
          <span class="rec-stat-value">${best.worstCase > 7000 ? '⚠️ High Deductible Risk' : best.worstCase > 4000 ? '🟡 Moderate Risk' : '🟢 Low Risk'}</span>
        </div>
      </div>
    </div>
    <div class="rec-rankings">
      <h4>All Plans Ranked</h4>
      <div class="rec-rank-list">
        ${results.map((r, i) => `
          <div class="rec-rank-item ${i === 0 ? 'best' : ''}">
            <span class="rec-rank">#${i + 1}</span>
            <span class="rec-rank-name">${r.name}</span>
            <span class="rec-rank-cost">${fmt(r.oop)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== RENDER: Action Plan =====
function renderActionPlan(data) {
  const { analyzed, totalCharged, totalMedicare, overchargeCount, negotiationScore } = data;
  const topOvercharge = analyzed[0];

  // Negotiation Letter
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const letterText = `${today}

To: ${hospital.name} Billing Department
Re: Request for Bill Review and Adjustment
Patient Account #: [Your Account Number]

Dear Billing Department,

I am writing to formally request a review and adjustment of my emergency room bill dated [Visit Date], totaling ${fmt(totalCharged)}.

After comparing each charge to CMS Medicare reimbursement rates, I have identified ${overchargeCount} services billed at 8x or more above the Medicare benchmark. The total Medicare-equivalent cost for these services would be approximately ${fmt(totalMedicare)}, representing a markup of ${data.avgMarkup}x.

Services of concern:
${analyzed.filter(s => s.markup >= 8).map(s =>
    `• ${s.description} (CPT ${s.cpt}): Billed ${fmtDec(s.gross_charge)}, Medicare rate ${fmtDec(s.medicare_rate)} — ${s.markup.toFixed(1)}x markup`
  ).join('\n')}

I respectfully request:
1. An itemized bill with all CPT codes and descriptions
2. Review of the above charges against your facility's pricing policies
3. Consideration of adjustment to the cash-pay rate of approximately ${fmt(totalMedicare * 2)}
4. Information about financial assistance or hardship programs

I am aware of my rights under the No Surprises Act and CMS price transparency requirements. I look forward to your prompt response.

Sincerely,
[Your Name]
[Your Phone Number]
[Your Address]`;

  document.getElementById('negotiation-letter').innerHTML = `
    <pre class="letter-preview">${letterText}</pre>
  `;

  // Store letter for download
  window._letterText = letterText;

  // Dispute Checklist
  document.getElementById('dispute-checklist').innerHTML = `
    <div class="checklist">
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 1:</strong> Request an itemized bill — hospitals are legally required to provide one</span></label>
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 2:</strong> Compare each CPT code to Medicare rates (this tool does it for you)</span></label>
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 3:</strong> Call the billing department and reference specific overcharges</span></label>
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 4:</strong> Ask about financial assistance, charity care, or payment plans</span></label>
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 5:</strong> Send the negotiation letter (download above) via certified mail</span></label>
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 6:</strong> Contact your insurance for an Explanation of Benefits (EOB)</span></label>
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 7:</strong> If unresolved, file a complaint with your state's Attorney General or Insurance Commissioner</span></label>
      <label class="check-item"><input type="checkbox"><span class="check-text"><strong>Step 8:</strong> Consider hiring a medical billing advocate (they can often reduce bills by 20-50%)</span></label>
    </div>
  `;

  // Talking Points
  document.getElementById('talking-points').innerHTML = `
    <div class="talking-points-list">
      <div class="tp-item">
        <div class="tp-icon">📞</div>
        <div class="tp-content">
          <h4>Opening Line</h4>
          <p class="tp-script">"Hi, I'm calling about my ER bill. I've compared my charges to Medicare reimbursement rates and I'd like to discuss some specific items that appear to be significantly above benchmark pricing."</p>
        </div>
      </div>
      <div class="tp-item">
        <div class="tp-icon">💰</div>
        <div class="tp-content">
          <h4>Requesting Adjustment</h4>
          <p class="tp-script">"My ${topOvercharge.description} was billed at ${fmtDec(topOvercharge.gross_charge)}, which is ${topOvercharge.markup.toFixed(1)}x the Medicare rate of ${fmtDec(topOvercharge.medicare_rate)}. Your own cash price for this is ${fmtDec(topOvercharge.cash_price)}. Can we adjust this charge?"</p>
        </div>
      </div>
      <div class="tp-item">
        <div class="tp-icon">📋</div>
        <div class="tp-content">
          <h4>Requesting Financial Assistance</h4>
          <p class="tp-script">"Does your hospital have a financial assistance program or charity care policy? I believe I may qualify for a reduction based on my income level."</p>
        </div>
      </div>
      <div class="tp-item">
        <div class="tp-icon">⚖️</div>
        <div class="tp-content">
          <h4>Referencing Regulations</h4>
          <p class="tp-script">"I'm aware that under the No Surprises Act, patients are protected from certain unexpected charges. I'd like to understand which of these charges fall under that protection and whether my bill qualifies for review."</p>
        </div>
      </div>
      <div class="tp-item">
        <div class="tp-icon">🤝</div>
        <div class="tp-content">
          <h4>Negotiating Payment</h4>
          <p class="tp-script">"If I'm able to pay in full today, would you be willing to offer a prompt-pay discount? I've seen that your cash price for these services totals approximately ${fmt(analyzed.reduce((s, i) => s + i.cash_price, 0))}."</p>
        </div>
      </div>
    </div>
  `;

  // Data Methodology
  document.getElementById('data-methodology').innerHTML = `
    <div class="methodology-content">
      <div class="method-section">
        <h4>📊 How Medicare Benchmarks Work</h4>
        <p>Medicare reimbursement rates are set by the Center for Medicare & Medicaid Services (CMS). These rates represent the amount the federal government pays hospitals for specific procedures, identified by CPT (Current Procedural Terminology) codes. While hospitals can charge whatever they want, Medicare rates provide a widely-accepted baseline for fair pricing.</p>
      </div>
      <div class="method-section">
        <h4>💵 What is a "Markup"?</h4>
        <p>Markup ratio = Hospital Charge ÷ Medicare Rate. A markup of 10x means the hospital charges 10 times what Medicare would pay. National median markup for ER services is approximately ${nationalPercentiles.p50}x. Markups above ${nationalPercentiles.p90}x place a hospital in the 90th percentile nationally.</p>
      </div>
      <div class="method-section">
        <h4>🏥 Cash Price vs. Allowed Amount</h4>
        <p>The <strong>cash price</strong> is what the hospital charges self-pay (uninsured) patients — typically 30% of gross charges. The <strong>allowed amount</strong> (or negotiated rate) is what insurance companies have agreed to pay, which can vary by 3-10x depending on the payer.</p>
      </div>
      <div class="method-section">
        <h4>📋 CPT Code Mapping</h4>
        <p>Each medical service is identified by a 5-digit CPT code. This tool maps your bill's CPT codes to Medicare's fee schedule to provide accurate benchmark pricing. We analyze ${services.length} of the most common ER services.</p>
      </div>
      <div class="method-section">
        <h4>⚠️ Limitations</h4>
        <p>This tool uses published price transparency data from ${hospital.name} and CMS Medicare rates. Actual patient costs depend on insurance contracts, network status, and individual plan design. State average data is approximated from published research. This tool is for informational purposes only — not medical or legal advice.</p>
      </div>
    </div>
  `;
}

function downloadNegotiationLetter() {
  if (!window._letterText) return;
  const blob = new Blob([window._letterText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ER_Bill_Negotiation_Letter.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// ===== AI Bill Explanation (Gemini) =====
async function explainBillWithAI() {
  const textarea = document.getElementById('bill-text-input');
  const resultEl = document.getElementById('ai-explanation-result');
  const btn = document.getElementById('ai-explain-btn');
  const billText = textarea.value.trim();

  if (!billText) {
    alert('Please paste your ER bill text first.');
    textarea.focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Analyzing...';
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <span>Gemini is analyzing your bill... this may take a few seconds</span>
    </div>
  `;
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const response = await fetch('/explain-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bill_text: billText }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Server error (${response.status})`);

    const formatted = data.explanation
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h4 style="margin-top:16px;margin-bottom:6px">$1</h4>')
      .replace(/^## (.*$)/gm, '<h3 style="margin-top:20px;margin-bottom:8px">$1</h3>')
      .replace(/^- (.*$)/gm, '→ $1')
      .replace(/\n/g, '<br>');

    resultEl.innerHTML = `
      <h4>🤖 AI-Powered Bill Explanation</h4>
      <div class="ai-text">${formatted}</div>
    `;
  } catch (err) {
    resultEl.innerHTML = `
      <div class="ai-error">
        <strong>⚠️ Could not get AI explanation:</strong> ${err.message}<br>
        <span style="font-size:0.78rem;margin-top:6px;display:inline-block">
          Make sure the backend server is running: <code>python server.py</code>
        </span>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Explain My Bill with AI';
  }
}

// ===== View Switching =====
function showView(viewId) {
  ['landing-view', 'processing-view', 'results-view'].forEach(id => {
    document.getElementById(id).style.display = id === viewId ? '' : 'none';
  });
  // Show/hide nav tabs based on view
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('nav-hamburger');
  if (viewId === 'results-view') {
    navLinks.style.display = '';
    hamburger.style.display = '';
  } else {
    navLinks.style.display = 'none';
    hamburger.style.display = 'none';
  }
}

// ===== Processing Animation =====
function showProcessing() {
  return new Promise(resolve => {
    showView('processing-view');
    window.scrollTo(0, 0);

    const steps = [
      document.getElementById('proc-step-1'),
      document.getElementById('proc-step-2'),
      document.getElementById('proc-step-3')
    ];
    const bar = document.getElementById('processing-bar');

    // Reset
    steps.forEach(s => s.classList.remove('active', 'done'));
    steps[0].classList.add('active');
    bar.style.width = '0%';

    // Step 1 → 2
    setTimeout(() => {
      steps[0].classList.remove('active');
      steps[0].classList.add('done');
      steps[1].classList.add('active');
      bar.style.width = '33%';
    }, 1000);

    // Step 2 → 3
    setTimeout(() => {
      steps[1].classList.remove('active');
      steps[1].classList.add('done');
      steps[2].classList.add('active');
      bar.style.width = '66%';
    }, 2000);

    // Complete
    setTimeout(() => {
      steps[2].classList.remove('active');
      steps[2].classList.add('done');
      bar.style.width = '100%';
    }, 2800);

    setTimeout(resolve, 3200);
  });
}

// ===== Reveal Results Dashboard =====
function revealResults(data) {
  window._data = data;

  renderNegotiationScore(data);
  renderCategoryBreakdown(data);
  renderTopCostServices(data);
  renderMarkupDistribution(data);
  // renderMostOverpriced(data);
  renderInsightsSummary(data);
  renderServiceCards(data);
  renderCompare(data);
  renderSimulator(data);
  renderActionPlan(data);

  // Simulator sliders
  ['wif-deductible', 'wif-coinsurance', 'wif-copay', 'wif-oopmax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updateCustomSim(data));
  });

  showView('results-view');
  window.scrollTo(0, 0);
}

// ===== Start Demo Report =====
async function startDemo() {
  await showProcessing();
  const data = computeAnalytics();
  revealResults(data);
}

// ===== Handle File Upload =====
function setupUpload() {
  const fileInput = document.getElementById('bill-upload');
  const uploadLabel = document.querySelector('.upload-cta-btn');

  if (!fileInput) return;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For now, any upload triggers the demo data
    // In production, this would send to backend for OCR + parsing
    await showProcessing();
    const data = computeAnalytics();
    revealResults(data);
  });

  // Drag and drop
  if (uploadLabel) {
    uploadLabel.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadLabel.classList.add('drag-over');
    });
    uploadLabel.addEventListener('dragleave', () => {
      uploadLabel.classList.remove('drag-over');
    });
    uploadLabel.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadLabel.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });
  }
}

// ===== Initialize =====
function init() {
  setupTheme();
  setupTabs();
  setupUpload();
  animateCounters();
  showView('landing-view');
}

init();
