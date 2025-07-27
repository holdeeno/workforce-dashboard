// Installer Tracking JavaScript

// Global state
let currentScenario = 'base';
let revenueTargets = {
    worst: 1200000,
    base: 1500000,
    best: 1800000
};
let installers = [];
let revenueChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadInstallers();
    loadRevenueGoals();
    updateDashboard();
    initializeSettings();
    
    // Add event listeners for revenue input formatting
    const revenueInputs = ['worstCaseRevenue', 'baseCaseRevenue', 'bestCaseRevenue'];
    revenueInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Store original value on focus
            input.addEventListener('focus', function() {
                // Store current numeric value before editing
                const currentValue = parseCurrencyInput(this);
                if (currentValue > 0) {
                    this.dataset.numericValue = currentValue;
                    // Show unformatted number for editing
                    this.value = currentValue.toString();
                }
            });
            
            // Format on blur (when user leaves the field)
            input.addEventListener('blur', function() {
                // Update the numeric value based on what was typed
                const typedValue = parseFloat(this.value.replace(/[^0-9.]/g, ''));
                if (!isNaN(typedValue) && typedValue > 0) {
                    this.dataset.numericValue = typedValue;
                }
                formatCurrencyInput(this);
            });
            
            // Update stored value on input
            input.addEventListener('input', function() {
                const value = parseFloat(this.value.replace(/[^0-9.]/g, ''));
                if (!isNaN(value)) {
                    this.dataset.numericValue = value;
                }
            });
            
            // Allow only numbers and formatting characters while typing
            input.addEventListener('keypress', function(e) {
                const char = String.fromCharCode(e.which);
                // Allow numbers, decimal point, and control keys
                if (!char.match(/[0-9.]/) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
            });
        }
    });
});

// Tab switching functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked nav tab
    event.target.classList.add('active');
    
    // Refresh data when switching to dashboard
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'installers') {
        loadInstallers();
    }
}

// Load all installers from the API
async function loadInstallers() {
    try {
        const response = await fetch('/api/installers');
        const data = await response.json();
        
        if (data.success) {
            installers = data.installers;
            updateInstallersTable();
            updateDashboardInstallersTable();
        } else {
            console.error('Failed to load installers:', data.error);
        }
    } catch (error) {
        console.error('Error loading installers:', error);
    }
}

// Load revenue goals from the API
async function loadRevenueGoals() {
    try {
        const response = await fetch('/api/revenue-goals');
        const data = await response.json();
        
        if (data.success) {
            // Update global revenue targets
            revenueTargets = data.data;
            
            // Update form fields with loaded values and format them
            const worstInput = document.getElementById('worstCaseRevenue');
            const baseInput = document.getElementById('baseCaseRevenue');
            const bestInput = document.getElementById('bestCaseRevenue');
            
            // Store numeric values
            worstInput.dataset.numericValue = data.data.worst_case;
            baseInput.dataset.numericValue = data.data.base_case;
            bestInput.dataset.numericValue = data.data.best_case;
            
            // Set and format the display values
            worstInput.value = data.data.worst_case;
            baseInput.value = data.data.base_case;
            bestInput.value = data.data.best_case;
            
            formatCurrencyInput(worstInput);
            formatCurrencyInput(baseInput);
            formatCurrencyInput(bestInput);
            
            console.log('Revenue goals loaded:', data.data);
            
            // Update dashboard with loaded values
            updateDashboard();
        }
    } catch (error) {
        console.error('Error loading revenue goals:', error);
    }
}

// Save revenue goals to the API
async function saveRevenueGoals() {
    // Parse values from formatted inputs
    const worstCase = parseCurrencyInput(document.getElementById('worstCaseRevenue'));
    const baseCase = parseCurrencyInput(document.getElementById('baseCaseRevenue'));
    const bestCase = parseCurrencyInput(document.getElementById('bestCaseRevenue'));
    
    // Validate inputs
    if (!worstCase || !baseCase || !bestCase) {
        alert('Please enter values for all revenue scenarios');
        return;
    }
    
    if (worstCase >= baseCase || baseCase >= bestCase) {
        alert('Invalid values: Worst case must be less than base case, and base case must be less than best case');
        return;
    }
    
    try {
        const response = await fetch('/api/revenue-goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                worst_case: worstCase,
                base_case: baseCase,
                best_case: bestCase
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update global revenue targets
            revenueTargets = data.data;
            
            alert('Revenue goals saved successfully!');
            
            // Update dashboard with new goals
            updateDashboard();
        } else {
            alert('Error saving revenue goals: ' + data.error);
        }
    } catch (error) {
        console.error('Error saving revenue goals:', error);
        alert('Error saving revenue goals. Please try again.');
    }
}

// Update the main dashboard
async function updateDashboard() {
    const scenario = document.getElementById('activeScenario').value;
    currentScenario = scenario;  // Update global current scenario
    
    // Map scenario to revenue target
    let targetRevenue;
    switch(scenario) {
        case 'worst':
            targetRevenue = revenueTargets.worst_case || revenueTargets.worst;
            break;
        case 'base':
            targetRevenue = revenueTargets.base_case || revenueTargets.base;
            break;
        case 'best':
            targetRevenue = revenueTargets.best_case || revenueTargets.best;
            break;
        default:
            targetRevenue = revenueTargets.base_case || revenueTargets.base;
    }
    
    try {
        const response = await fetch(`/api/revenue/dashboard?scenario=${scenario}&target_revenue=${targetRevenue}`);
        const data = await response.json();
        
        if (data.success) {
            // Update metric cards
            document.getElementById('totalRevenue').textContent = formatCurrency(data.target_revenue);
            document.getElementById('committedRevenue').textContent = formatCurrency(data.committed_revenue);
            document.getElementById('remainingRevenue').textContent = formatCurrency(data.remaining_revenue);
            
            // Update chart
            updateRevenueChart(data);
            
            // Update dashboard installers table
            updateDashboardInstallersTable(data.installer_breakdown);
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Update the revenue chart
function updateRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Committed Revenue', 'Remaining Revenue'],
            datasets: [{
                data: [data.committed_revenue, data.remaining_revenue],
                backgroundColor: ['#3498db', '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Revenue Commitment - ${data.percentage_committed.toFixed(1)}% Complete`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update installers table in the management tab
function updateInstallersTable() {
    const tableBody = document.getElementById('installersTable');
    
    if (installers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6c757d;">No installers added yet</td></tr>';
        return;
    }
    
    tableBody.innerHTML = installers.map(installer => `
        <tr>
            <td>${installer.name}</td>
            <td><span class="experience-badge experience-${installer.experience_level.toLowerCase()}">${installer.experience_level}</span></td>
            <td>${Array.isArray(installer.committed_days) ? installer.committed_days.length : installer.committed_days}</td>
            <td>${new Date(installer.date_added).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-danger" onclick="removeInstaller(${installer.id})" style="padding: 5px 10px; font-size: 0.8em;">Remove</button>
            </td>
        </tr>
    `).join('');
}

// Update dashboard installers table
function updateDashboardInstallersTable(installerBreakdown = null) {
    const tableBody = document.getElementById('dashboardInstallersTable');
    
    if (!installerBreakdown && installers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6c757d;">No installers added yet</td></tr>';
        return;
    }
    
    // If we have breakdown data from the API, use it; otherwise calculate locally
    const displayData = installerBreakdown || installers.map(installer => ({
        installer: installer,
        capacity: calculateInstallerCapacity(installer)
    }));
    
    tableBody.innerHTML = displayData.map(item => `
        <tr>
            <td>${item.installer.name}</td>
            <td><span class="experience-badge experience-${item.installer.experience_level.toLowerCase()}">${item.installer.experience_level}</span></td>
            <td>${item.capacity ? item.capacity.committed_days : 'N/A'}</td>
            <td>${item.capacity ? formatCurrency(item.capacity.total_revenue_capacity) : 'N/A'}</td>
            <td>${item.capacity ? formatCurrency(item.capacity.total_compensation) : 'N/A'}</td>
        </tr>
    `).join('');
}

// Calculate installer capacity (simplified version for client-side)
function calculateInstallerCapacity(installer) {
    const revenueRanges = {
        'Beginner': { worst: 2500, base: 3250, best: 4000 },
        'Intermediate': { worst: 4000, base: 4750, best: 5500 },
        'Advanced': { worst: 5500, base: 6250, best: 7000 },
        'Expert': { worst: 7000, base: 7750, best: 8500 }
    };
    
    const perDiemRates = {
        'Beginner': 200,
        'Intermediate': 225,
        'Advanced': 275,
        'Expert': 300
    };
    
    const committedDays = Array.isArray(installer.committed_days) ? installer.committed_days.length : parseInt(installer.committed_days) || 0;
    const dailyRevenue = revenueRanges[installer.experience_level][currentScenario];
    const totalRevenueCapacity = dailyRevenue * committedDays;
    const guaranteedPay = perDiemRates[installer.experience_level] * committedDays;
    const productionBonus = totalRevenueCapacity * 0.10;
    const totalCompensation = guaranteedPay + productionBonus;
    
    return {
        committed_days: committedDays,
        total_revenue_capacity: totalRevenueCapacity,
        total_compensation: totalCompensation
    };
}

// Add new installer
async function addInstaller() {
    const name = document.getElementById('installerName').value.trim();
    const experience = document.getElementById('installerExperience').value;
    const daysInput = document.getElementById('installerDays').value.trim();
    
    if (!name) {
        alert('Please enter installer name');
        return;
    }
    
    // Parse committed days
    let committedDays = [];
    if (daysInput) {
        if (daysInput.includes(',')) {
            // Comma-separated dates
            committedDays = daysInput.split(',').map(d => d.trim());
        } else if (!isNaN(daysInput)) {
            // Number of days
            const numDays = parseInt(daysInput);
            committedDays = Array.from({length: numDays}, (_, i) => `Day ${i + 1}`);
        }
    }
    
    try {
        const response = await fetch('/api/installers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                experience_level: experience,
                committed_days: committedDays
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear form
            document.getElementById('installerName').value = '';
            document.getElementById('installerDays').value = '';
            
            // Reload data
            await loadInstallers();
            await updateDashboard();
            
            alert(`Installer ${name} added successfully!`);
        } else {
            alert('Error adding installer: ' + data.error);
        }
    } catch (error) {
        console.error('Error adding installer:', error);
        alert('Error adding installer. Please try again.');
    }
}

// Remove installer
async function removeInstaller(installerId) {
    if (!confirm('Are you sure you want to remove this installer?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/installers/${installerId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadInstallers();
            await updateDashboard();
            alert('Installer removed successfully!');
        } else {
            alert('Error removing installer: ' + data.error);
        }
    } catch (error) {
        console.error('Error removing installer:', error);
        alert('Error removing installer. Please try again.');
    }
}

// Update recruitment presentation
async function updateRecruitmentPresentation() {
    const experience = document.getElementById('recruitExperience').value;
    const days = parseInt(document.getElementById('recruitDays').value);
    
    if (!days || days <= 0) {
        return;
    }
    
    try {
        const response = await fetch('/api/recruitment/presentation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                experience_level: experience,
                committed_days: days
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const presentation = data.presentation_data;
            
            // Show scenario comparison
            document.getElementById('scenarioComparison').style.display = 'grid';
            
            // Update worst case
            document.getElementById('worstAmount').textContent = formatCurrency(presentation.scenarios.worst.total_compensation);
            document.getElementById('worstDetails').innerHTML = `
                ${formatCurrency(presentation.scenarios.worst.guaranteed_pay)} guaranteed<br>
                ${formatCurrency(presentation.scenarios.worst.production_bonus)} production bonus<br>
                $${presentation.scenarios.worst.effective_hourly_rate.toFixed(2)}/hour effective
            `;
            
            // Update base case
            document.getElementById('baseAmount').textContent = formatCurrency(presentation.scenarios.base.total_compensation);
            document.getElementById('baseDetails').innerHTML = `
                ${formatCurrency(presentation.scenarios.base.guaranteed_pay)} guaranteed<br>
                ${formatCurrency(presentation.scenarios.base.production_bonus)} production bonus<br>
                $${presentation.scenarios.base.effective_hourly_rate.toFixed(2)}/hour effective
            `;
            
            // Update best case
            document.getElementById('bestAmount').textContent = formatCurrency(presentation.scenarios.best.total_compensation);
            document.getElementById('bestDetails').innerHTML = `
                ${formatCurrency(presentation.scenarios.best.guaranteed_pay)} guaranteed<br>
                ${formatCurrency(presentation.scenarios.best.production_bonus)} production bonus<br>
                $${presentation.scenarios.best.effective_hourly_rate.toFixed(2)}/hour effective
            `;
        }
    } catch (error) {
        console.error('Error updating recruitment presentation:', error);
    }
}

// Initialize settings
async function initializeSettings() {
    const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const scenarios = ['worst', 'base', 'best'];
    
    const settingsContainer = document.getElementById('revenueRangesSettings');
    
    settingsContainer.innerHTML = experienceLevels.map(level => `
        <div class="form-section">
            <h4>${level}</h4>
            <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                ${scenarios.map(scenario => `
                    <div class="form-group">
                        <label for="${level.toLowerCase()}_${scenario}">${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Case Daily Revenue</label>
                        <input type="text" id="${level.toLowerCase()}_${scenario}" placeholder="Enter amount">
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Default values
    const defaults = {
        'beginner': { worst: 2500, base: 3250, best: 4000 },
        'intermediate': { worst: 4000, base: 4750, best: 5500 },
        'advanced': { worst: 5500, base: 6250, best: 7000 },
        'expert': { worst: 7000, base: 7750, best: 8500 }
    };
    
    // Try to load saved settings
    let savedSettings = {};
    try {
        const response = await fetch('/api/settings/revenue-ranges');
        const data = await response.json();
        if (data.success && data.data) {
            savedSettings = data.data;
        }
    } catch (error) {
        console.error('Error loading saved settings:', error);
    }
    
    // Add formatting to settings inputs after they are created
    setTimeout(() => {
        experienceLevels.forEach(level => {
            scenarios.forEach(scenario => {
                const input = document.getElementById(`${level.toLowerCase()}_${scenario}`);
                if (input) {
                    // Use saved value if available, otherwise use default
                    let value;
                    if (savedSettings[level.toLowerCase()] && savedSettings[level.toLowerCase()][scenario]) {
                        value = savedSettings[level.toLowerCase()][scenario];
                    } else {
                        value = defaults[level.toLowerCase()][scenario];
                    }
                    
                    input.value = value;
                    input.dataset.numericValue = value;
                    formatCurrencyInput(input);
                    
                    // Add event listeners for formatting
                    input.addEventListener('focus', function() {
                        const currentValue = parseCurrencyInput(this);
                        if (currentValue > 0) {
                            this.dataset.numericValue = currentValue;
                            this.value = currentValue.toString();
                        }
                    });
                    
                    input.addEventListener('blur', function() {
                        const typedValue = parseFloat(this.value.replace(/[^0-9.]/g, ''));
                        if (!isNaN(typedValue) && typedValue > 0) {
                            this.dataset.numericValue = typedValue;
                        }
                        formatCurrencyInput(this);
                    });
                    
                    input.addEventListener('input', function() {
                        const value = parseFloat(this.value.replace(/[^0-9.]/g, ''));
                        if (!isNaN(value)) {
                            this.dataset.numericValue = value;
                        }
                    });
                    
                    input.addEventListener('keypress', function(e) {
                        const char = String.fromCharCode(e.which);
                        if (!char.match(/[0-9.]/) && !e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                        }
                    });
                }
            });
        });
    }, 0);
}

// Save settings
async function saveSettings() {
    const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    const scenarios = ['worst', 'base', 'best'];
    const revenueRanges = {};
    
    // Collect all values from the form
    experienceLevels.forEach(level => {
        revenueRanges[level.toLowerCase()] = {};
        scenarios.forEach(scenario => {
            const inputId = `${level.toLowerCase()}_${scenario}`;
            const input = document.getElementById(inputId);
            if (input) {
                const value = parseCurrencyInput(input);
                revenueRanges[level.toLowerCase()][scenario] = value;
            }
        });
    });
    
    try {
        const response = await fetch('/api/settings/revenue-ranges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(revenueRanges)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Settings saved successfully!');
        } else {
            alert('Error saving settings: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings. Please try again.');
    }
}

// Save season settings (placeholder)
function saveSeasonSettings() {
    alert('Season settings saved! (This would save to the backend in a full implementation)');
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format currency input fields
function formatCurrencyInput(input) {
    // Store the numeric value in a data attribute
    let numValue;
    
    // If we have a stored numeric value, use it
    if (input.dataset.numericValue) {
        numValue = parseFloat(input.dataset.numericValue);
    } else {
        // Otherwise, parse the current value
        let value = input.value.replace(/[^0-9.]/g, '');
        numValue = parseFloat(value) || 0;
    }
    
    // Don't format if the value is 0 or empty
    if (numValue === 0 && input.value.trim() === '') {
        return;
    }
    
    // Store the numeric value
    input.dataset.numericValue = numValue;
    
    // Format with commas
    input.value = numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Parse currency input back to number
function parseCurrencyInput(input) {
    // First check if we have a stored numeric value
    if (input.dataset.numericValue) {
        return parseFloat(input.dataset.numericValue) || 0;
    }
    // Otherwise, parse the displayed value
    return parseFloat(input.value.replace(/[^0-9.]/g, '')) || 0;
}

// Show season content based on selected tab
function showSeasonContent(season) {
    // Update tab styling
    const tabs = document.querySelectorAll('.season-tab');
    tabs.forEach(tab => {
        tab.style.background = '#f8f9fa';
        tab.style.color = '';
        tab.querySelector('div:first-child').style.color = '#2c3e50';
        tab.querySelector('div:last-child').style.color = '#6c757d';
    });
    
    // Style the active tab
    const activeTab = event.target.closest('.season-tab');
    activeTab.style.background = '#3498db';
    activeTab.style.color = 'white';
    activeTab.querySelector('div:first-child').style.color = '';
    activeTab.querySelector('div:last-child').style.color = '';
    activeTab.querySelector('div:last-child').style.opacity = '0.9';
    
    // Hide all season contents
    const contents = document.querySelectorAll('.season-content');
    contents.forEach(content => content.style.display = 'none');
    
    // Show selected season content
    const selectedContent = document.getElementById(`${season}-content`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
}

