/* ════════════════════════════════════════════════════
   EstateAI — app.js
   Chart instances are stored globally and destroyed
   before recreation. animation: false on all charts.
   The diagnostics API is called ONCE per page load.
   ════════════════════════════════════════════════════ */

// ── Currency formatter ──────────────────────────────
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// ── Feature metadata (for UI display) ───────────────
const FEATURE_META = {
    OverallQual:  { name: 'Overall Quality',       desc: 'Overall material and finish of the house (1–10).' },
    OverallCond:  { name: 'Overall Condition',      desc: 'Overall condition of the house (1–10).' },
    GrLivArea:    { name: 'Living Area',            desc: 'Above-grade living area in square feet.' },
    YearBuilt:    { name: 'Year Built',             desc: 'Original construction year.' },
    YearRemodAdd: { name: 'Year Remodeled',         desc: 'Remodel or addition year.' },
    TotalBsmtSF:  { name: 'Total Basement Area',    desc: 'Total basement area in square feet.' },
    '1stFlrSF':   { name: 'First Floor Area',       desc: 'First floor square footage.' },
    '2ndFlrSF':   { name: 'Second Floor Area',      desc: 'Second floor square footage.' },
    FullBath:     { name: 'Full Bathrooms',         desc: 'Full bathrooms above grade.' },
    HalfBath:     { name: 'Half Bathrooms',         desc: 'Half bathrooms above grade.' },
    BedroomAbvGr: { name: 'Bedrooms',               desc: 'Bedrooms above grade.' },
    KitchenQual:  { name: 'Kitchen Quality',        desc: 'Quality of the kitchen (Ex / Gd / TA / Fa).' },
    GarageCars:   { name: 'Garage Capacity',        desc: 'Garage capacity (number of cars).' },
    GarageArea:   { name: 'Garage Area',            desc: 'Garage area in square feet.' },
    Neighborhood: { name: 'Neighborhood',           desc: 'Physical location within Ames city limits.' },
    HouseStyle:   { name: 'House Style',            desc: 'Style of the dwelling.' },
    CentralAir:   { name: 'Central Air',            desc: 'Central air conditioning (Yes / No).' },
    Fireplaces:   { name: 'Fireplaces',             desc: 'Number of fireplaces.' },
    LotArea:      { name: 'Lot Area',               desc: 'Lot area in square feet.' }
};

// Human-readable labels for display in the result card
const FEATURE_LABELS = {
    Neighborhood:  'Neighborhood',
    HouseStyle:    'House Style',
    GrLivArea:     'Living Area',
    OverallQual:   'Overall Quality',
    BedroomAbvGr:  'Bedrooms',
    FullBath:      'Full Baths',
    HalfBath:      'Half Baths',
    YearBuilt:     'Year Built',
    GarageCars:    'Garage'
};

// Human-readable values for categorical codes
const VALUE_LABELS = {
    Neighborhood: {
        Blmngtn: 'Bloomington Heights', Blueste: 'Bluestem', BrDale: 'Briardale',
        BrkSide: 'Brookside', ClearCr: 'Clear Creek', CollgCr: 'College Creek',
        Crawfor: 'Crawford', Edwards: 'Edwards', Gilbert: 'Gilbert',
        IDOTRR: 'Iowa DOT & Rail Road', MeadowV: 'Meadow Village', Mitchel: 'Mitchell',
        NAmes: 'North Ames', NPkVill: 'Northpark Villa', NWAmes: 'Northwest Ames',
        NoRidge: 'Northridge', NridgHt: 'Northridge Heights', OldTown: 'Old Town',
        SWISU: 'South & West of ISU', Sawyer: 'Sawyer', SawyerW: 'Sawyer West',
        Somerst: 'Somerset', StoneBr: 'Stone Brook', Timber: 'Timberland', Veenker: 'Veenker'
    },
    HouseStyle: {
        '1Story': 'One Story', '1.5Fin': '1.5 Story (Finished)', '1.5Unf': '1.5 Story (Unfinished)',
        '2Story': 'Two Story', '2.5Fin': '2.5 Story (Finished)', '2.5Unf': '2.5 Story (Unfinished)',
        SFoyer: 'Split Foyer', SLvl: 'Split Level'
    }
};

// ── Chart instance registry (prevents duplicates) ───
const charts = {};
function renderChart(id, config) {
    if (charts[id]) { charts[id].destroy(); }
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (!config.options) config.options = {};
    config.options.animation = false;  // ← STATIC, never animates
    charts[id] = new Chart(canvas.getContext('2d'), config);
}

// ═══════════════════════════════════════════════════
//  PREDICTION PAGE
// ═══════════════════════════════════════════════════
const predictForm = document.getElementById('prediction-form');
if (predictForm) {
    predictForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn      = document.getElementById('predict-btn');
        const btnText  = btn.querySelector('.btn-text');
        const btnLoad  = btn.querySelector('.btn-loading');
        const errBox   = document.getElementById('form-error');
        const resultCard = document.getElementById('result-card');

        btnText.classList.add('hidden');
        btnLoad.classList.remove('hidden');
        btn.disabled = true;
        errBox.classList.add('hidden');
        resultCard.classList.add('hidden');

        const payload = {
            Neighborhood:  document.getElementById('Neighborhood').value,
            HouseStyle:    document.getElementById('HouseStyle').value,
            LotArea:       +document.getElementById('LotArea').value,
            GrLivArea:     +document.getElementById('GrLivArea').value,
            BedroomAbvGr:  +document.getElementById('BedroomAbvGr').value,
            FullBath:      +document.getElementById('FullBath').value,
            HalfBath:      +document.getElementById('HalfBath').value,
            OverallQual:   +document.getElementById('OverallQual').value,
            OverallCond:   +document.getElementById('OverallCond').value,
            KitchenQual:   document.getElementById('KitchenQual').value,
            YearBuilt:     +document.getElementById('YearBuilt').value,
            YearRemodAdd:  +document.getElementById('YearRemodAdd').value,
            TotalBsmtSF:   +document.getElementById('TotalBsmtSF').value,
            GarageCars:    +document.getElementById('GarageCars').value,
            GarageArea:    +document.getElementById('GarageArea').value,
            Fireplaces:    +document.getElementById('Fireplaces').value,
            CentralAir:    document.getElementById('CentralAir').value,
            '1stFlrSF':    +document.getElementById('1stFlrSF').value,
            '2ndFlrSF':    +document.getElementById('2ndFlrSF').value
        };

        try {
            const res  = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Prediction failed.');

            // ── Price ──
            document.getElementById('result-price').textContent = USD.format(data.predicted_price);

            // ── Range ──
            document.getElementById('result-mae').textContent   = `±${USD.format(data.typical_error)}`;
            document.getElementById('result-range').textContent =
                `${USD.format(data.price_range_low)} – ${USD.format(data.price_range_high)}`;

            // ── Context badge ──
            const ctxEl = document.getElementById('result-context');
            const ctx = data.price_context || 'mid-range';
            ctxEl.textContent = ctx.charAt(0).toUpperCase() + ctx.slice(1);
            ctxEl.style.background = ctx === 'above average' ? 'rgba(167,139,250,.15)' :
                                      ctx === 'below average' ? 'rgba(239,68,68,.12)'  : 'rgba(59,130,246,.15)';
            ctxEl.style.color = ctx === 'above average' ? '#a78bfa' :
                                 ctx === 'below average' ? '#f87171'  : '#60a5fa';

            // ── Property summary ──
            const grid = document.getElementById('summary-grid');
            grid.innerHTML = '';
            const show = Object.keys(FEATURE_LABELS);
            show.forEach(k => {
                let v = payload[k];
                if (VALUE_LABELS[k] && VALUE_LABELS[k][v]) v = VALUE_LABELS[k][v];
                if (k === 'GrLivArea' || k === 'TotalBsmtSF' || k === 'GarageArea') v = `${v.toLocaleString()} sq ft`;
                if (k === 'GarageCars') v = `${v} car${v !== 1 ? 's' : ''}`;
                grid.insertAdjacentHTML('beforeend', `
                    <div class="summary-item">
                        <div class="summary-item-label">${FEATURE_LABELS[k]}</div>
                        <div class="summary-item-value">${v}</div>
                    </div>
                `);
            });

            resultCard.classList.remove('hidden');
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            errBox.textContent = err.message;
            errBox.classList.remove('hidden');
        } finally {
            btnText.classList.remove('hidden');
            btnLoad.classList.add('hidden');
            btn.disabled = false;
        }
    });
}

// ═══════════════════════════════════════════════════
//  DIAGNOSTICS PAGE  — called ONCE on DOMContentLoaded
// ═══════════════════════════════════════════════════
async function loadDiagnostics() {
    const diagContainer = document.getElementById('diag-container');
    if (!diagContainer) return;

    const loadEl  = document.getElementById('loading-state');
    const errEl   = document.getElementById('error-state');

    try {
        const res  = await fetch('/api/metrics');
        if (!res.ok) throw new Error('API returned ' + res.status);
        const data = await res.json();

        loadEl.classList.add('hidden');
        diagContainer.classList.remove('hidden');

        // ── Shared Chart.js defaults ──
        Chart.defaults.color           = '#8b9bac';
        Chart.defaults.font.family     = "'Inter', system-ui, sans-serif";
        Chart.defaults.font.size       = 12;
        Chart.defaults.borderColor     = '#1f2d45';

        const splitKeys   = ['80_20', '75_25', '70_30'];
        const splitLabels = ['80 / 20', '75 / 25', '70 / 30'];
        const m80 = data.metrics['80_20'] || {};

        // ── 1. Summary tiles ──
        setText('d-rows',     data.metadata.dataset_rows);
        setText('d-features', (data.metadata.selected_features || []).length);
        setText('d-model',    data.metadata.model_name || 'Ridge Regression');
        setText('d-r2',       pct(m80.r2));
        setText('d-mae',      USD.format(m80.mae));
        setText('d-rmse',     USD.format(m80.rmse));

        // ── 2. Metric explain cards ──
        setText('mec-mae-val',  USD.format(m80.mae));
        setText('mec-mae-txt',  USD.format(m80.mae));
        setText('mec-rmse-val', USD.format(m80.rmse));
        setText('mec-r2-val',   pct(m80.r2));
        setText('mec-r2-txt',   pct(m80.r2));

        // ── 3. Progress bar (static width set via style) ──
        const r2Pct = Math.round((m80.r2 || 0) * 100);
        setText('perf-pct', r2Pct + '%');
        const fill = document.getElementById('perf-fill');
        if (fill) fill.style.width = r2Pct + '%';   // static, no animation

        const label = r2Pct >= 90 ? 'Excellent predictive performance'
                    : r2Pct >= 75 ? 'Good predictive performance'
                    : 'Moderate predictive performance';
        setText('perf-label', label);

        // ── 4. Splits table ──
        const tbody = document.getElementById('splits-tbody');
        tbody.innerHTML = '';   // clear any previous rows

        // Find best R² split
        let bestKey = '80_20', bestR2 = -Infinity;
        splitKeys.forEach(k => { if ((data.metrics[k]||{}).r2 > bestR2) { bestR2 = data.metrics[k].r2; bestKey = k; } });

        splitKeys.forEach((k, i) => {
            const m = data.metrics[k];
            if (!m) return;
            const bestBadge = k === bestKey ? `<span class="best-badge">Best R²</span>` : '';
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><strong>${splitLabels[i]}</strong></td>
                    <td>${USD.format(m.mae)}</td>
                    <td>${USD.format(m.rmse)}</td>
                    <td>${pct(m.r2)}</td>
                    <td>${bestBadge}</td>
                </tr>
            `);
        });

        // ── 5a. MAE Bar Chart ──
        const maes  = splitKeys.map(k => (data.metrics[k]||{}).mae  || 0);
        const rmses = splitKeys.map(k => (data.metrics[k]||{}).rmse || 0);

        renderChart('maeChart', {
            type: 'bar',
            data: {
                labels: splitLabels,
                datasets: [{ data: maes, backgroundColor: '#3b82f6', borderRadius: 6, borderSkipped: false }]
            },
            options: {
                animation: false,
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false },
                    tooltip: { callbacks: { label: c => ' MAE: ' + USD.format(c.raw) } } },
                scales: {
                    x: { grid: { display: false } },
                    y: { ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' }, grid: { color: '#1f2d45' } }
                }
            }
        });

        // ── 5b. RMSE Bar Chart ──
        renderChart('rmseChart', {
            type: 'bar',
            data: {
                labels: splitLabels,
                datasets: [{ data: rmses, backgroundColor: '#ef4444', borderRadius: 6, borderSkipped: false }]
            },
            options: {
                animation: false,
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false },
                    tooltip: { callbacks: { label: c => ' RMSE: ' + USD.format(c.raw) } } },
                scales: {
                    x: { grid: { display: false } },
                    y: { ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' }, grid: { color: '#1f2d45' } }
                }
            }
        });

        // ── 6. Scatter Chart ──
        const diag = data.diagnostics || {};
        if (diag.actual && diag.predicted) {
            const scatterPts = diag.actual.map((a, i) => ({ x: a, y: diag.predicted[i] }));
            const maxV = Math.max(...diag.actual, ...diag.predicted);

            renderChart('scatterChart', {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Houses',
                          data: scatterPts,
                          backgroundColor: 'rgba(167,139,250,.65)',
                          borderColor: '#a78bfa', pointRadius: 4, pointHoverRadius: 6 },
                        { type: 'line',
                          label: 'Perfect prediction (y = x)',
                          data: [{ x: 0, y: 0 }, { x: maxV, y: maxV }],
                          borderColor: 'rgba(139,155,172,.5)',
                          borderWidth: 2, borderDash: [6, 5],
                          pointRadius: 0, fill: false }
                    ]
                },
                options: {
                    animation: false,
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12 } },
                        tooltip: { callbacks: {
                            label: c => c.datasetIndex === 0
                                ? ` Actual: ${USD.format(c.raw.x)}  Predicted: ${USD.format(c.raw.y)}`
                                : ` ${c.dataset.label}`
                        }}
                    },
                    scales: {
                        x: { title: { display: true, text: 'Actual Sale Price' },
                             ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' },
                             grid: { color: '#1f2d45' } },
                        y: { title: { display: true, text: 'Predicted Sale Price' },
                             ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' },
                             grid: { color: '#1f2d45' } }
                    }
                }
            });
        }

        // ── 7. Residual histogram ──
        const errors = (diag.all_errors || diag.error || []);
        if (errors.length > 0) {
            const BINS = 14;
            const minE = Math.min(...errors), maxE = Math.max(...errors);
            const width = (maxE - minE) / BINS;
            const counts = Array(BINS).fill(0);
            const binLabels = [];
            for (let i = 0; i < BINS; i++) {
                const lo = minE + i * width;
                binLabels.push('$' + Math.round(lo / 1000) + 'k');
            }
            errors.forEach(e => {
                let bi = Math.floor((e - minE) / width);
                if (bi >= BINS) bi = BINS - 1;
                counts[bi]++;
            });

            renderChart('residualChart', {
                type: 'bar',
                data: {
                    labels: binLabels,
                    datasets: [{ data: counts,
                                 backgroundColor: 'rgba(245,158,11,.7)',
                                 borderColor: '#f59e0b',
                                 borderWidth: 1, borderRadius: 3, borderSkipped: false }]
                },
                options: {
                    animation: false,
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false },
                        tooltip: { callbacks: { label: c => ` ${c.raw} houses` } } },
                    scales: {
                        x: { title: { display: true, text: 'Prediction Error (Actual − Predicted)' },
                             grid: { display: false } },
                        y: { title: { display: true, text: 'Number of houses' },
                             grid: { color: '#1f2d45' } }
                    }
                }
            });
        }

        // ── 8. Error range example — use real MAE ──
        setText('ere-mae',   `±${USD.format(m80.mae)}`);
        const examplePrice = 245000;
        setText('ere-range',
            `${USD.format(examplePrice - m80.mae)} – ${USD.format(examplePrice + m80.mae)}`);

        // ── 9. Features grid ──
        const fgEl = document.getElementById('features-grid');
        if (fgEl) {
            fgEl.innerHTML = '';
            const feats = data.metadata.selected_features || Object.keys(FEATURE_META);
            feats.forEach(f => {
                const meta = FEATURE_META[f] || { name: f, desc: '' };
                fgEl.insertAdjacentHTML('beforeend', `
                    <div class="feat-item">
                        <div class="feat-name">${meta.name}</div>
                        <div class="feat-code">${f}</div>
                        <div class="feat-desc">${meta.desc}</div>
                    </div>
                `);
            });
        }

    } catch (err) {
        console.error('Diagnostics error:', err);
        loadEl.classList.add('hidden');
        errEl.classList.remove('hidden');
    }
}

// ── Helper functions ─────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function pct(v) { return v != null ? (v * 100).toFixed(2) + '%' : '--'; }
