// Workforce Planning Dashboard JavaScript

let currentConfig = null;
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadConfiguration();
    updateQuickOverview();
    updateRecruitmentData();
});

// Tab Management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`/api/workforce${endpoint}`, options);
        const result = await response.json();
        
        if (!result.success) {
            console.error('API Error:', result.error);
            alert('Error: ' + result.error);
            return null;
        }
        
        return result.data;
    } catch (error) {
        console.error('Network Error:', error);
        alert('Network error: ' + error.message);
        return null;
    }
}

// Configuration Management
async function loadConfiguration() {
    const config = await apiCall('/config');
    if (config) {
        currentConfig = config;
        populateConfigurationForms();
        updateBreakEvenTable();
    }
}

async function saveConfiguration() {
    if (!currentConfig) return;
    
    const result = await apiCall('/config', 'POST', currentConfig);
    if (result) {
        alert('Configuration saved successfully!');
    }
}

function populateConfigurationForms() {
    if (!currentConfig) return;
    
    // Populate season configuration
    const seasonConfig = document.getElementById('season-config');
    seasonConfig.innerHTML = '';
    
    Object.entries(currentConfig.seasons).forEach(([key, season]) => {
        const seasonDiv = document.createElement('div');
        seasonDiv.className = 'mb-4 p-4 border border-gray-200 rounded';
        seasonDiv.innerHTML = `
            <h4 class="font-medium mb-2">${season.name}</h4>
            <div class="grid-2 gap-2">
                <div class="input-group">
                    <label>Start Date</label>
                    <input type="date" value="${season.start_date}" onchange="updateSeasonConfig('${key}', 'start_date', this.value)">
                </div>
                <div class="input-group">
                    <label>End Date</label>
                    <input type="date" value="${season.end_date}" onchange="updateSeasonConfig('${key}', 'end_date', this.value)">
                </div>
                <div class="input-group">
                    <label>Working Days/Week</label>
                    <input type="number" step="0.5" value="${season.working_days_per_week}" onchange="updateSeasonConfig('${key}', 'working_days_per_week', parseFloat(this.value))">
                </div>
                <div class="input-group">
                    <label>Production Eligible</label>
                    <input type="checkbox" ${season.production_eligible ? 'checked' : ''} onchange="updateSeasonConfig('${key}', 'production_eligible', this.checked)">
                </div>
            </div>
        `;
        seasonConfig.appendChild(seasonDiv);
    });
    
    // Populate experience levels
    const experienceConfig = document.getElementById('experience-config');
    experienceConfig.innerHTML = '';
    
    Object.entries(currentConfig.experience_levels).forEach(([key, level]) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'mb-4 p-4 border border-gray-200 rounded';
        levelDiv.innerHTML = `
            <h4 class="font-medium mb-2">${level.name}</h4>
            <div class="input-group">
                <label>Per-Diem Rate ($)</label>
                <input type="number" value="${level.per_diem_rate}" onchange="updateExperienceConfig('${key}', 'per_diem_rate', parseFloat(this.value))">
            </div>
            <div class="grid-3 gap-2">
                <div class="input-group">
                    <label>Min Revenue ($)</label>
                    <input type="number" value="${level.revenue_range_min}" onchange="updateExperienceConfig('${key}', 'revenue_range_min', parseFloat(this.value))">
                </div>
                <div class="input-group">
                    <label>Base Revenue ($)</label>
                    <input type="number" value="${level.revenue_range_base}" onchange="updateExperienceConfig('${key}', 'revenue_range_base', parseFloat(this.value))">
                </div>
                <div class="input-group">
                    <label>Max Revenue ($)</label>
                    <input type="number" value="${level.revenue_range_max}" onchange="updateExperienceConfig('${key}', 'revenue_range_max', parseFloat(this.value))">
                </div>
            </div>
        `;
        experienceConfig.appendChild(levelDiv);
    });
    
    // Populate sliding scale configuration
    const slidingScaleConfig = document.getElementById('sliding-scale-config');
    slidingScaleConfig.innerHTML = `
        <div class="input-group">
            <label>Base Percentage (%)</label>
            <input type="number" step="0.01" value="${currentConfig.sliding_scale.base_percentage * 100}" onchange="updateSlidingScaleConfig('base_percentage', parseFloat(this.value) / 100)">
        </div>
        <div class="input-group">
            <label>Max Percentage (%)</label>
            <input type="number" step="0.01" value="${currentConfig.sliding_scale.max_percentage * 100}" onchange="updateSlidingScaleConfig('max_percentage', parseFloat(this.value) / 100)">
        </div>
        <div class="mt-4">
            <h5 class="font-medium mb-2">Thresholds</h5>
            <div class="text-sm text-gray-600">
                ${currentConfig.sliding_scale.thresholds.map(([threshold, percentage]) => 
                    `${(threshold * 100).toFixed(0)}% performance = ${(percentage * 100).toFixed(1)}% bonus`
                ).join('<br>')}
            </div>
        </div>
    `;
    
    // Populate labor configuration
    const laborConfig = document.getElementById('labor-config');
    laborConfig.innerHTML = `
        <div class="input-group">
            <label>Total Labor Percentage (%)</label>
            <input type="number" step="0.01" value="${currentConfig.labor_config.total_labor_percentage * 100}" onchange="updateLaborConfig('total_labor_percentage', parseFloat(this.value) / 100)">
        </div>
        <div class="grid-2 gap-2">
            <div class="input-group">
                <label>Junior Min Rate ($/hr)</label>
                <input type="number" step="0.25" value="${currentConfig.labor_config.junior_hourly_rate_min}" onchange="updateLaborConfig('junior_hourly_rate_min', parseFloat(this.value))">
            </div>
            <div class="input-group">
                <label>Junior Max Rate ($/hr)</label>
                <input type="number" step="0.25" value="${currentConfig.labor_config.junior_hourly_rate_max}" onchange="updateLaborConfig('junior_hourly_rate_max', parseFloat(this.value))">
            </div>
        </div>
        <div class="input-group">
            <label>Hours per Day</label>
            <input type="number" step="0.5" value="${currentConfig.labor_config.hours_per_day}" onchange="updateLaborConfig('hours_per_day', parseFloat(this.value))">
        </div>
    `;
}

// Configuration Update Functions
function updateSeasonConfig(seasonKey, field, value) {
    if (currentConfig && currentConfig.seasons[seasonKey]) {
        currentConfig.seasons[seasonKey][field] = value;
    }
}

function updateExperienceConfig(levelKey, field, value) {
    if (currentConfig && currentConfig.experience_levels[levelKey]) {
        currentConfig.experience_levels[levelKey][field] = value;
    }
}

function updateSlidingScaleConfig(field, value) {
    if (currentConfig && currentConfig.sliding_scale) {
        currentConfig.sliding_scale[field] = value;
    }
}

function updateLaborConfig(field, value) {
    if (currentConfig && currentConfig.labor_config) {
        currentConfig.labor_config[field] = value;
    }
}

// Overview Tab Functions
async function updateQuickOverview() {
    const composition = {
        beginner_crews: parseInt(document.getElementById('quick-beginner').value) || 0,
        intermediate_crews: parseInt(document.getElementById('quick-intermediate').value) || 0,
        advanced_crews: parseInt(document.getElementById('quick-advanced').value) || 0,
        expert_crews: parseInt(document.getElementById('quick-expert').value) || 0
    };
    
    const scenario = document.getElementById('quick-scenario').value;
    
    const capacity = await apiCall('/capacity', 'POST', { ...composition, scenario });
    
    if (capacity && !capacity.error) {
        document.getElementById('total-crews').textContent = capacity.total_crews;
        document.getElementById('total-revenue').textContent = formatCurrency(capacity.total_seasonal_revenue);
        document.getElementById('labor-percentage').textContent = capacity.labor_percentage.toFixed(1) + '%';
        
        updateScenarioChart(composition);
    }
}

async function updateScenarioChart(composition) {
    const scenarios = ['worst_case', 'base_case', 'best_case'];
    const data = [];
    const labels = ['Worst Case', 'Base Case', 'Best Case'];
    
    for (const scenario of scenarios) {
        const capacity = await apiCall('/capacity', 'POST', { ...composition, scenario });
        if (capacity && !capacity.error) {
            data.push(capacity.total_seasonal_revenue);
        } else {
            data.push(0);
        }
    }
    
    const ctx = document.getElementById('scenario-chart').getContext('2d');
    
    if (charts.scenarioChart) {
        charts.scenarioChart.destroy();
    }
    
    charts.scenarioChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue ($)',
                data: data,
                backgroundColor: ['#ef4444', '#3b82f6', '#10b981'],
                borderColor: ['#dc2626', '#2563eb', '#059669'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

async function updateBreakEvenTable() {
    const breakEvenData = await apiCall('/break-even/all');
    
    if (breakEvenData) {
        const table = document.getElementById('break-even-table');
        table.innerHTML = `
            <table class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="border border-gray-300 px-4 py-2 text-left">Experience Level</th>
                        <th class="border border-gray-300 px-4 py-2 text-right">Break-Even Revenue</th>
                        <th class="border border-gray-300 px-4 py-2 text-right">Daily Revenue Needed</th>
                        <th class="border border-gray-300 px-4 py-2 text-right">Total Per-Diem</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(breakEvenData).map(([level, data]) => `
                        <tr>
                            <td class="border border-gray-300 px-4 py-2 font-medium capitalize">${level}</td>
                            <td class="border border-gray-300 px-4 py-2 text-right">${formatCurrency(data.break_even_revenue)}</td>
                            <td class="border border-gray-300 px-4 py-2 text-right">${formatCurrency(data.break_even_daily_revenue)}</td>
                            <td class="border border-gray-300 px-4 py-2 text-right">${formatCurrency(data.total_per_diem)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

// Workforce Planning Tab Functions
async function getCrewRecommendations() {
    const targetRevenue = parseFloat(document.getElementById('target-revenue').value);
    const scenario = 'base_case'; // Default to base case for recommendations
    
    const recommendations = await apiCall('/recommend-crews', 'POST', {
        target_revenue: targetRevenue,
        scenario: scenario
    });
    
    if (recommendations) {
        displayRecommendations(recommendations);
    }
}

function displayRecommendations(data) {
    const table = document.getElementById('recommendations-table');
    
    if (data.recommendations.length === 0) {
        table.innerHTML = '<p class="text-gray-600">No recommendations found for the target revenue.</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="w-full border-collapse border border-gray-300">
            <thead>
                <tr class="bg-gray-50">
                    <th class="border border-gray-300 px-4 py-2 text-left">Rank</th>
                    <th class="border border-gray-300 px-4 py-2 text-center">Beginner</th>
                    <th class="border border-gray-300 px-4 py-2 text-center">Intermediate</th>
                    <th class="border border-gray-300 px-4 py-2 text-center">Advanced</th>
                    <th class="border border-gray-300 px-4 py-2 text-center">Expert</th>
                    <th class="border border-gray-300 px-4 py-2 text-right">Total Revenue</th>
                    <th class="border border-gray-300 px-4 py-2 text-right">Revenue Gap</th>
                    <th class="border border-gray-300 px-4 py-2 text-right">Labor Cost</th>
                </tr>
            </thead>
            <tbody>
                ${data.recommendations.map((rec, index) => `
                    <tr class="${index === 0 ? 'bg-green-50' : ''}">
                        <td class="border border-gray-300 px-4 py-2 font-medium">${index + 1}</td>
                        <td class="border border-gray-300 px-4 py-2 text-center">${rec.composition.beginner_crews}</td>
                        <td class="border border-gray-300 px-4 py-2 text-center">${rec.composition.intermediate_crews}</td>
                        <td class="border border-gray-300 px-4 py-2 text-center">${rec.composition.advanced_crews}</td>
                        <td class="border border-gray-300 px-4 py-2 text-center">${rec.composition.expert_crews}</td>
                        <td class="border border-gray-300 px-4 py-2 text-right">${formatCurrency(rec.capacity.total_seasonal_revenue)}</td>
                        <td class="border border-gray-300 px-4 py-2 text-right">${rec.revenue_gap_pct.toFixed(1)}%</td>
                        <td class="border border-gray-300 px-4 py-2 text-right">${formatCurrency(rec.capacity.total_labor_cost)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function calculateManualCapacity() {
    const composition = {
        beginner_crews: parseInt(document.getElementById('planning-beginner').value) || 0,
        intermediate_crews: parseInt(document.getElementById('planning-intermediate').value) || 0,
        advanced_crews: parseInt(document.getElementById('planning-advanced').value) || 0,
        expert_crews: parseInt(document.getElementById('planning-expert').value) || 0
    };
    
    const results = {};
    const scenarios = ['worst_case', 'base_case', 'best_case'];
    
    for (const scenario of scenarios) {
        const capacity = await apiCall('/capacity', 'POST', { ...composition, scenario });
        if (capacity && !capacity.error) {
            results[scenario] = capacity;
        }
    }
    
    displayCapacityResults(results);
}

function displayCapacityResults(results) {
    const container = document.getElementById('capacity-results');
    
    container.innerHTML = Object.entries(results).map(([scenario, data]) => `
        <div class="mb-4 p-4 border border-gray-200 rounded">
            <h4 class="font-medium mb-2 capitalize">${scenario.replace('_', ' ')}</h4>
            <div class="grid-2 gap-4 text-sm">
                <div>
                    <strong>Total Crews:</strong> ${data.total_crews}<br>
                    <strong>Daily Capacity:</strong> ${formatCurrency(data.total_daily_capacity)}<br>
                    <strong>Seasonal Revenue:</strong> ${formatCurrency(data.total_seasonal_revenue)}
                </div>
                <div>
                    <strong>Labor Cost:</strong> ${formatCurrency(data.total_labor_cost)}<br>
                    <strong>Labor %:</strong> ${data.labor_percentage.toFixed(1)}%<br>
                    <strong>In-Season Days:</strong> ${data.in_season_days}
                </div>
            </div>
        </div>
    `).join('');
}

// Recruitment Tab Functions
async function updateRecruitmentData() {
    const experienceLevel = document.getElementById('recruitment-experience').value;
    const performanceMultiplier = parseFloat(document.getElementById('performance-slider').value);
    
    document.getElementById('performance-value').textContent = performanceMultiplier.toFixed(1) + 'x';
    
    const recruitmentData = await apiCall(`/recruitment-data/${experienceLevel}`);
    
    if (recruitmentData) {
        displayRecruitmentScenarios(recruitmentData, performanceMultiplier);
        updateCompensationChart(recruitmentData);
    }
}

function displayRecruitmentScenarios(data, multiplier) {
    const scenarios = ['worst_case', 'base_case', 'best_case'];
    const containers = ['worst-case-data', 'base-case-data', 'best-case-data'];
    
    scenarios.forEach((scenario, index) => {
        const scenarioData = data.scenarios[scenario];
        const adjustedData = {
            ...scenarioData,
            daily_revenue: scenarioData.daily_revenue * multiplier,
            total_production_revenue: scenarioData.total_production_revenue * multiplier,
            production_bonus: scenarioData.production_bonus * multiplier,
            bonus_payment: Math.max(0, (scenarioData.production_bonus * multiplier) - scenarioData.total_per_diem),
            total_compensation: scenarioData.total_per_diem + Math.max(0, (scenarioData.production_bonus * multiplier) - scenarioData.total_per_diem)
        };
        
        adjustedData.implicit_hourly_rate = adjustedData.total_compensation / (scenarioData.total_working_days * 12);
        
        const container = document.getElementById(containers[index]);
        container.innerHTML = `
            <div class="text-sm space-y-2">
                <div><strong>Daily Revenue:</strong> ${formatCurrency(adjustedData.daily_revenue)}</div>
                <div><strong>Total Compensation:</strong> ${formatCurrency(adjustedData.total_compensation)}</div>
                <div><strong>Per-Diem:</strong> ${formatCurrency(adjustedData.total_per_diem)}</div>
                <div><strong>Bonus Payment:</strong> ${formatCurrency(adjustedData.bonus_payment)}</div>
                <div><strong>Bi-Weekly Pay:</strong> ${formatCurrency(adjustedData.bi_weekly_per_diem)}</div>
                <div><strong>Implicit Hourly:</strong> ${formatCurrency(adjustedData.implicit_hourly_rate)}</div>
                <div><strong>Working Days:</strong> ${adjustedData.total_working_days}</div>
                <div><strong>Bonus %:</strong> ${(adjustedData.bonus_percentage * 100).toFixed(1)}%</div>
            </div>
        `;
    });
}

function updateCompensationChart(data) {
    const ctx = document.getElementById('compensation-chart').getContext('2d');
    
    if (charts.compensationChart) {
        charts.compensationChart.destroy();
    }
    
    const scenarios = ['worst_case', 'base_case', 'best_case'];
    const labels = ['Worst Case', 'Base Case', 'Best Case'];
    const perDiemData = scenarios.map(scenario => data.scenarios[scenario].total_per_diem);
    const bonusData = scenarios.map(scenario => data.scenarios[scenario].bonus_payment);
    
    charts.compensationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Per-Diem',
                    data: perDiemData,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                },
                {
                    label: 'Bonus',
                    data: bonusData,
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
}

// Financial Analysis Tab Functions
async function updateFinancialAnalysis() {
    const composition = {
        beginner_crews: parseInt(document.getElementById('financial-beginner').value) || 0,
        intermediate_crews: parseInt(document.getElementById('financial-intermediate').value) || 0,
        advanced_crews: parseInt(document.getElementById('financial-advanced').value) || 0,
        expert_crews: parseInt(document.getElementById('financial-expert').value) || 0
    };
    
    const financialData = await apiCall('/financial-summary', 'POST', composition);
    
    if (financialData) {
        displayFinancialResults(financialData);
    }
}

function displayFinancialResults(data) {
    const container = document.getElementById('financial-results');
    
    container.innerHTML = Object.entries(data).map(([scenario, scenarioData]) => `
        <div class="card mb-4">
            <h3 class="text-lg font-semibold mb-4 capitalize">${scenario.replace('_', ' ')}</h3>
            <div class="grid-3 gap-4">
                <div class="metric-card">
                    <div class="metric-value">${formatCurrency(scenarioData.total_seasonal_revenue)}</div>
                    <div class="metric-label">Total Revenue</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${formatCurrency(scenarioData.gross_profit)}</div>
                    <div class="metric-label">Gross Profit</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${formatCurrency(scenarioData.net_profit)}</div>
                    <div class="metric-label">Net Profit</div>
                </div>
            </div>
            <div class="mt-4 grid-2 gap-4 text-sm">
                <div>
                    <h4 class="font-medium mb-2">Cost Breakdown</h4>
                    <div>Labor Cost: ${formatCurrency(scenarioData.total_labor_cost)}</div>
                    <div>Material Cost: ${formatCurrency(scenarioData.material_cost)}</div>
                    <div>Operating Cost: ${formatCurrency(scenarioData.operating_costs)}</div>
                    <div>Total Direct Costs: ${formatCurrency(scenarioData.direct_costs)}</div>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Margin Analysis</h4>
                    <div>Gross Margin: ${scenarioData.gross_margin.toFixed(1)}%</div>
                    <div>Net Margin: ${scenarioData.net_margin.toFixed(1)}%</div>
                    <div>Labor %: ${scenarioData.labor_percentage.toFixed(1)}%</div>
                    <div>Total Crews: ${scenarioData.total_crews}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

