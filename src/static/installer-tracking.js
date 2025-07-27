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

// Modal utility functions
function showModal(title, message, buttons = []) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButtons = document.getElementById('modalButtons');
    
    // Set content
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Clear existing buttons
    modalButtons.innerHTML = '';
    
    // Add buttons
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `modal-btn ${button.class || 'modal-btn-primary'}`;
        btn.textContent = button.text;
        btn.onclick = () => {
            if (button.callback) button.callback();
            hideModal();
        };
        modalButtons.appendChild(btn);
    });
    
    // Show modal
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('customModal');
    modal.style.display = 'none';
}

// Replacement for alert()
function showAlert(message, title = 'Alert') {
    showModal(title, message, [
        { text: 'OK', class: 'modal-btn-primary' }
    ]);
}

// Replacement for confirm()
function showConfirm(message, onConfirm, onCancel = null, title = 'Confirm') {
    showModal(title, message, [
        { 
            text: 'Cancel', 
            class: 'modal-btn-secondary',
            callback: onCancel
        },
        { 
            text: 'Confirm', 
            class: 'modal-btn-primary',
            callback: onConfirm
        }
    ]);
}

// Special confirm for delete operations
function showDeleteConfirm(message, onConfirm, title = 'Confirm Delete') {
    showModal(title, message, [
        { 
            text: 'Cancel', 
            class: 'modal-btn-secondary'
        },
        { 
            text: 'Delete', 
            class: 'modal-btn-danger',
            callback: onConfirm
        }
    ]);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadInstallers();
    loadRevenueGoals();
    updateDashboard();
    initializeSettings();
    loadSeasonDates();
    
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
        showAlert('Please enter values for all revenue scenarios', 'Missing Values');
        return;
    }
    
    if (worstCase >= baseCase || baseCase >= bestCase) {
        showAlert('Invalid values: Worst case must be less than base case, and base case must be less than best case', 'Invalid Values');
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
            
            showAlert('Revenue goals saved successfully!', 'Success');
            
            // Update dashboard with new goals
            updateDashboard();
        } else {
            showAlert('Error saving revenue goals: ' + data.error, 'Error');
        }
    } catch (error) {
        console.error('Error saving revenue goals:', error);
        showAlert('Error saving revenue goals. Please try again.', 'Error');
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
        'Advanced': 250,
        'Expert': 275
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
        showAlert('Please enter installer name', 'Missing Information');
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
            
            showAlert(`Installer ${name} added successfully!`, 'Success');
        } else {
            showAlert('Error adding installer: ' + data.error, 'Error');
        }
    } catch (error) {
        console.error('Error adding installer:', error);
        showAlert('Error adding installer. Please try again.', 'Error');
    }
}

// Remove installer
async function removeInstaller(installerId) {
    showDeleteConfirm('Are you sure you want to remove this installer?', async () => {
        try {
            const response = await fetch(`/api/installers/${installerId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                await loadInstallers();
                await updateDashboard();
                showAlert('Installer removed successfully!', 'Success');
            } else {
                showAlert('Error removing installer: ' + data.error, 'Error');
            }
        } catch (error) {
            console.error('Error removing installer:', error);
            showAlert('Error removing installer. Please try again.', 'Error');
        }
    });
}

// Show recruitment form for new installer calculation
function showRecruitmentForm() {
    // Show the form section
    const formSection = document.querySelector('#recruitment .form-section');
    if (formSection) {
        formSection.style.display = 'block';
    }
    
    // Clear the recruitment presentation to show the form's default state
    const recruitmentPresentation = document.getElementById('recruitmentPresentation');
    if (recruitmentPresentation) {
        recruitmentPresentation.innerHTML = `
            <h3>Compensation Overview</h3>
            <p>Select experience level and committed days to see earning potential.</p>
            
            <div class="scenario-comparison" id="scenarioComparison" style="display: none;">
                <div class="scenario-card scenario-worst">
                    <h4>Worst Case (Guaranteed)</h4>
                    <div class="amount" id="worstAmount">$0</div>
                    <div class="details" id="worstDetails"></div>
                </div>
                <div class="scenario-card scenario-base">
                    <h4>Base Case (Expected)</h4>
                    <div class="amount" id="baseAmount">$0</div>
                    <div class="details" id="baseDetails"></div>
                </div>
                <div class="scenario-card scenario-best">
                    <h4>Best Case (High Performance)</h4>
                    <div class="amount" id="bestAmount">$0</div>
                    <div class="details" id="bestDetails"></div>
                </div>
            </div>
        `;
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
    
    const perDiemRates = {
        'Beginner': 200,
        'Intermediate': 225,
        'Advanced': 250,
        'Expert': 275
    };
    
    settingsContainer.innerHTML = experienceLevels.map(level => `
        <div class="form-section">
            <h4>${level} <span style="color: #6c757d; font-size: 0.9em; font-weight: normal;">($${perDiemRates[level]} Per-Diem)</span></h4>
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
            showAlert('Settings saved successfully!', 'Success');
        } else {
            showAlert('Error saving settings: ' + (data.error || 'Unknown error'), 'Error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Error saving settings. Please try again.', 'Error');
    }
}

// Save season settings (placeholder)
function saveSeasonSettings() {
    showAlert('Season settings saved! (This would save to the backend in a full implementation)', 'Success');
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

// Load season dates from the API
async function loadSeasonDates() {
    try {
        const response = await fetch('/api/settings/season-dates');
        const data = await response.json();
        
        if (data.success && data.data) {
            // Set the date values for each season
            const seasons = ['pre_season', 'in_season', 'post_season', 'off_season'];
            seasons.forEach(season => {
                const seasonKey = season.replace('_', '-');
                if (data.data[season]) {
                    const startInput = document.getElementById(`${seasonKey}-start`);
                    const endInput = document.getElementById(`${seasonKey}-end`);
                    
                    if (startInput && data.data[season].start_date) {
                        startInput.value = data.data[season].start_date;
                    }
                    if (endInput && data.data[season].end_date) {
                        endInput.value = data.data[season].end_date;
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading season dates:', error);
        // Set default dates if loading fails
        setDefaultSeasonDates();
    }
}

// Set default season dates
function setDefaultSeasonDates() {
    const currentYear = new Date().getFullYear();
    // Set defaults that are properly consecutive with no gaps
    const defaults = {
        'pre-season': {
            start: `${currentYear}-08-01`,
            end: `${currentYear}-09-30`
        },
        'in-season': {
            start: `${currentYear}-10-01`,
            end: `${currentYear}-12-31`
        },
        'post-season': {
            start: `${currentYear + 1}-01-01`,
            end: `${currentYear + 1}-01-31`
        },
        'off-season': {
            start: `${currentYear + 1}-02-01`,
            end: `${currentYear + 1}-02-28`  // or 29 for leap years
        }
    };
    
    // Adjust for leap year if necessary
    const nextYear = currentYear + 1;
    const isLeapYear = (nextYear % 4 === 0 && nextYear % 100 !== 0) || (nextYear % 400 === 0);
    if (isLeapYear) {
        defaults['off-season'].end = `${nextYear}-02-29`;
    }
    
    Object.keys(defaults).forEach(season => {
        const startInput = document.getElementById(`${season}-start`);
        const endInput = document.getElementById(`${season}-end`);
        
        if (startInput) startInput.value = defaults[season].start;
        if (endInput) endInput.value = defaults[season].end;
    });
}

// Save season dates to the API
async function saveSeasonDates() {
    const seasonDates = {
        pre_season: {
            start_date: document.getElementById('pre-season-start').value,
            end_date: document.getElementById('pre-season-end').value
        },
        in_season: {
            start_date: document.getElementById('in-season-start').value,
            end_date: document.getElementById('in-season-end').value
        },
        post_season: {
            start_date: document.getElementById('post-season-start').value,
            end_date: document.getElementById('post-season-end').value
        },
        off_season: {
            start_date: document.getElementById('off-season-start').value,
            end_date: document.getElementById('off-season-end').value
        }
    };
    
    // Validate dates
    const validation = validateSeasonDates(seasonDates);
    if (!validation.valid) {
        showAlert(validation.message, 'Validation Error');
        return;
    }
    
    try {
        const response = await fetch('/api/settings/season-dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(seasonDates)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Season dates saved successfully!', 'Success');
            // Refresh calendar if it's visible
            if (document.getElementById('season').classList.contains('active')) {
                initializeCalendar();
            }
        } else {
            showAlert('Error saving season dates: ' + (data.error || 'Unknown error'), 'Error');
        }
    } catch (error) {
        console.error('Error saving season dates:', error);
        showAlert('Error saving season dates. Please try again.', 'Error');
    }
}

// Validate season dates
function validateSeasonDates(seasonDates) {
    const seasons = ['pre_season', 'in_season', 'post_season', 'off_season'];
    const seasonNames = {
        'pre_season': 'Pre-Season',
        'in_season': 'In-Season',
        'post_season': 'Post-Season',
        'off_season': 'Off-Season'
    };
    
    // Check if all dates are filled
    for (const season of seasons) {
        if (!seasonDates[season].start_date || !seasonDates[season].end_date) {
            return {
                valid: false,
                message: `Please fill in all start and end dates for ${seasonNames[season]}.`
            };
        }
        
        // Check if end date is after start date
        const startDate = new Date(seasonDates[season].start_date);
        const endDate = new Date(seasonDates[season].end_date);
        
        if (endDate <= startDate) {
            return {
                valid: false,
                message: `End date must be after start date for ${seasonNames[season]}.`
            };
        }
    }
    
    // Check for proper chronological order and no gaps
    for (let i = 0; i < seasons.length - 1; i++) {
        const currentSeason = seasons[i];
        const nextSeason = seasons[i + 1];
        const currentEnd = new Date(seasonDates[currentSeason].end_date);
        const nextStart = new Date(seasonDates[nextSeason].start_date);
        
        // Check if seasons are in chronological order
        if (currentEnd >= nextStart) {
            return {
                valid: false,
                message: `${seasonNames[currentSeason]} must end before ${seasonNames[nextSeason]} begins.`
            };
        }
        
        // Check for gaps between seasons (should be exactly 1 day)
        const dayDifference = Math.floor((nextStart - currentEnd) / (1000 * 60 * 60 * 24));
        if (dayDifference !== 1) {
            if (dayDifference > 1) {
                return {
                    valid: false,
                    message: `There is a ${dayDifference - 1} day gap between ${seasonNames[currentSeason]} and ${seasonNames[nextSeason]}. Seasons must be consecutive with no gaps.`
                };
            }
            // This case is already covered by the chronological order check above
        }
    }
    
    return { valid: true };
}

// Calendar state
let calendarCurrentDate = new Date();
let selectedWorkDays = new Set();
let seasonDates = {};

// Initialize calendar when season tab is shown
function initializeCalendar() {
    // Get season dates from inputs
    seasonDates = {
        'pre-season': {
            start: document.getElementById('pre-season-start').value,
            end: document.getElementById('pre-season-end').value
        },
        'in-season': {
            start: document.getElementById('in-season-start').value,
            end: document.getElementById('in-season-end').value
        },
        'post-season': {
            start: document.getElementById('post-season-start').value,
            end: document.getElementById('post-season-end').value
        },
        'off-season': {
            start: document.getElementById('off-season-start').value,
            end: document.getElementById('off-season-end').value
        }
    };
    
    // Set calendar to first month with season dates
    const firstSeasonStart = getEarliestSeasonDate();
    if (firstSeasonStart) {
        calendarCurrentDate = new Date(firstSeasonStart);
        calendarCurrentDate.setDate(1); // Go to first day of month
    }
    
    renderCalendar();
}

// Get earliest season start date
function getEarliestSeasonDate() {
    let earliestDate = null;
    
    Object.values(seasonDates).forEach(season => {
        if (season.start) {
            const startDate = new Date(season.start);
            if (!earliestDate || startDate < earliestDate) {
                earliestDate = startDate;
            }
        }
    });
    
    return earliestDate;
}

// Render the calendar
function renderCalendar() {
    const grid = document.getElementById('workCalendarGrid');
    if (!grid) return;
    
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // Update month display
    const monthDisplay = document.getElementById('currentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = calendarCurrentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    // Clear grid
    grid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const isCurrentMonth = date.getMonth() === month;
        const dateString = date.toISOString().split('T')[0];
        
        if (!isCurrentMonth) {
            dayElement.classList.add('disabled');
        } else {
            // Determine season
            const season = getSeasonForDate(date);
            
            if (season) {
                dayElement.classList.add(season);
                dayElement.onclick = () => toggleDay(dateString, dayElement);
                
                if (selectedWorkDays.has(dateString)) {
                    dayElement.classList.add('selected');
                }
            } else {
                dayElement.classList.add('disabled');
            }
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${date.getDate()}</div>
            <div class="day-info">${isCurrentMonth ? (getSeasonForDate(date) || 'off').replace('-season', '') : ''}</div>
        `;
        
        grid.appendChild(dayElement);
    }
    
    updateSelectedDaysSummary();
}

// Get season for a specific date
function getSeasonForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    
    for (const [seasonName, dates] of Object.entries(seasonDates)) {
        if (dates.start && dates.end) {
            const startDate = new Date(dates.start);
            const endDate = new Date(dates.end);
            
            if (date >= startDate && date <= endDate) {
                return seasonName;
            }
        }
    }
    
    return null;
}

// Check if date is within selectable range
function isSelectableDay(date) {
    const day = date.getDay();
    return day >= 0 && day <= 6; // Sunday through Saturday (all days)
}

// Toggle day selection
function toggleDay(dateString, element) {
    if (selectedWorkDays.has(dateString)) {
        selectedWorkDays.delete(dateString);
        element.classList.remove('selected');
    } else {
        selectedWorkDays.add(dateString);
        element.classList.add('selected');
    }
    
    updateSelectedDaysSummary();
}

// Update selected days summary
function updateSelectedDaysSummary() {
    const totalDays = selectedWorkDays.size;
    let preSeasonCount = 0;
    let inSeasonCount = 0;
    let postSeasonCount = 0;
    let offSeasonCount = 0;
    
    selectedWorkDays.forEach(dateString => {
        const date = new Date(dateString);
        const season = getSeasonForDate(date);
        
        switch(season) {
            case 'pre-season':
                preSeasonCount++;
                break;
            case 'in-season':
                inSeasonCount++;
                break;
            case 'post-season':
                postSeasonCount++;
                break;
            case 'off-season':
                offSeasonCount++;
                break;
        }
    });
    
    // Update display
    document.getElementById('totalSelectedDays').textContent = totalDays;
    document.getElementById('preSeasonDays').textContent = preSeasonCount;
    document.getElementById('inSeasonDays').textContent = inSeasonCount;
    document.getElementById('postSeasonDays').textContent = postSeasonCount;
    document.getElementById('offSeasonDays').textContent = offSeasonCount;
}

// Navigate to previous month
function previousMonth() {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
    renderCalendar();
}

// Navigate to next month
function nextMonth() {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
    renderCalendar();
}

// Clear all selected days
function clearCalendarSelection() {
    selectedWorkDays.clear();
    renderCalendar();
}

// Select all working days in visible month
function selectAllWorkingDays() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const season = getSeasonForDate(date);
        if (season) {
            selectedWorkDays.add(date.toISOString().split('T')[0]);
        }
    }
    
    renderCalendar();
}

// Override showTab to initialize calendar when season tab is shown
const originalShowTab = showTab;
const enhancedShowTab = function(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked nav tab
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Refresh data when switching to dashboard
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'season') {
        // Initialize calendar when season tab is shown
        setTimeout(() => {
            initializeCalendar();
        }, 100);
    } else if (tabName === 'recruitment') {
        // Show all installers list when switching to recruitment tab
        showAllInstallersRecruitmentSummary();
    }
}

// Calculate phase breakdown for committed days
function calculatePhaseBreakdown(committedDays) {
    let preSeasonDays = 0;
    let inSeasonDays = 0;
    let postSeasonDays = 0;
    let offSeasonDays = 0;
    
    committedDays.forEach(dateString => {
        const date = new Date(dateString);
        const season = getSeasonForDate(date);
        
        switch(season) {
            case 'pre-season':
                preSeasonDays++;
                break;
            case 'in-season':
                inSeasonDays++;
                break;
            case 'post-season':
                postSeasonDays++;
                break;
            case 'off-season':
                offSeasonDays++;
                break;
        }
    });
    
    return {
        preSeasonDays,
        inSeasonDays,
        postSeasonDays,
        offSeasonDays,
        totalDays: committedDays.length
    };
}

// Calculate detailed compensation with phase breakdown
function calculateDetailedCompensation(experienceLevel, phaseBreakdown, scenario = 'base') {
    const revenueRanges = {
        'Beginner': { worst: 2500, base: 3250, best: 4000 },
        'Intermediate': { worst: 4000, base: 4750, best: 5500 },
        'Advanced': { worst: 5500, base: 6250, best: 7000 },
        'Expert': { worst: 7000, base: 7750, best: 8500 }
    };
    
    const perDiemRates = {
        'Beginner': 200,
        'Intermediate': 225,
        'Advanced': 250,
        'Expert': 275
    };
    
    const perDiemRate = perDiemRates[experienceLevel];
    const dailyRevenue = revenueRanges[experienceLevel][scenario];
    
    // Calculate base pay (guaranteed per-diem for ALL days)
    const totalBasePay = phaseBreakdown.totalDays * perDiemRate;
    
    // Calculate revenue generated (only for in-season days)
    const inSeasonRevenue = phaseBreakdown.inSeasonDays * dailyRevenue;
    
    // Calculate production bonus
    // Formula: (Total Revenue × 10%) - (In-Season + Post-Season days × per-diem rate)
    const productionDaysCount = phaseBreakdown.inSeasonDays + phaseBreakdown.postSeasonDays;
    const productionDaysPerDiem = productionDaysCount * perDiemRate;
    const grossProductionBonus = inSeasonRevenue * 0.10;
    const netProductionBonus = Math.max(0, grossProductionBonus - productionDaysPerDiem);
    
    // Total compensation is base pay + production bonus
    const totalCompensation = totalBasePay + netProductionBonus;
    
    // Calculate effective hourly rate (assuming 12 hours per day)
    const totalHours = phaseBreakdown.totalDays * 12;
    const effectiveHourlyRate = totalHours > 0 ? totalCompensation / totalHours : 0;
    
    return {
        perDiemRate,
        dailyRevenue,
        totalDays: phaseBreakdown.totalDays,
        inSeasonDays: phaseBreakdown.inSeasonDays,
        postSeasonDays: phaseBreakdown.postSeasonDays,
        totalBasePay,
        inSeasonRevenue,
        productionDaysCount,
        productionDaysPerDiem,
        grossProductionBonus,
        netProductionBonus,
        totalCompensation,
        effectiveHourlyRate,
        breakdown: phaseBreakdown
    };
}

// Commit installer from calendar selection
async function commitInstallerFromCalendar() {
    const name = document.getElementById('commitInstallerName').value.trim();
    const experience = document.getElementById('commitExperienceLevel').value;
    
    if (!name) {
        showAlert('Please enter installer name', 'Missing Information');
        return;
    }
    
    if (selectedWorkDays.size === 0) {
        showAlert('Please select at least one work day from the calendar', 'Missing Selection');
        return;
    }
    
    const committedDays = Array.from(selectedWorkDays).sort();
    
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
            showAlert(`Installer ${name} committed successfully for ${committedDays.length} days!`, 'Success');
            
            // Clear form and selection
            document.getElementById('commitInstallerName').value = '';
            document.getElementById('commitExperienceLevel').value = 'Beginner';
            clearCalendarSelection();
            
            // Reload installers data and update dashboard
            await loadInstallers();
            await updateDashboard();
            
            // Calculate phase breakdown and show recruitment summary
            const phaseBreakdown = calculatePhaseBreakdown(committedDays);
            showRecruitmentSummary({
                name: name,
                experienceLevel: experience,
                committedDays: committedDays,
                phaseBreakdown: phaseBreakdown
            });
            
            // Switch to recruitment summary tab to see the new addition
            showTab('recruitment');
        } else {
            showAlert('Error committing installer: ' + data.error, 'Error');
        }
    } catch (error) {
        console.error('Error committing installer:', error);
        showAlert('Error committing installer. Please try again.', 'Error');
    }
}

// Show all installers recruitment summary list
async function showAllInstallersRecruitmentSummary() {
    const recruitmentPresentation = document.getElementById('recruitmentPresentation');
    if (!recruitmentPresentation) return;
    
    // Build the summary HTML
    let summaryHTML = `
        <h3>All Installers Recruitment Summary</h3>
        <div style="margin-bottom: 20px;">
            <button class="btn btn-primary" onclick="showRecruitmentForm()">Calculate New Installer</button>
        </div>
    `;
    
    if (installers.length === 0) {
        summaryHTML += '<p style="color: #6c757d;">No installers committed yet. Use the calendar to commit installers with specific work days.</p>';
    } else {
        // Create table for all installers
        summaryHTML += `
            <div class="installers-table" style="margin-bottom: 30px;">
                <table>
                    <thead>
                        <tr>
                            <th>Installer Name</th>
                            <th>Experience</th>
                            <th>Total Days</th>
                            <th>Pre-Season</th>
                            <th>In-Season</th>
                            <th>Post-Season</th>
                            <th>Off-Season</th>
                            <th>Base Compensation</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let totalsByPhase = {
            total: 0,
            preSeason: 0,
            inSeason: 0,
            postSeason: 0,
            offSeason: 0,
            compensation: 0
        };
        
        for (const installer of installers) {
            // Calculate phase breakdown if we have committed days
            let phaseBreakdown = { totalDays: 0, preSeasonDays: 0, inSeasonDays: 0, postSeasonDays: 0, offSeasonDays: 0 };
            
            if (Array.isArray(installer.committed_days) && installer.committed_days.length > 0) {
                // Check if committed_days contains date strings
                if (installer.committed_days[0] && installer.committed_days[0].includes('-')) {
                    phaseBreakdown = calculatePhaseBreakdown(installer.committed_days);
                } else {
                    // For "Day X" format, distribute days proportionally based on typical season distribution
                    // Assume: 10% pre-season, 60% in-season, 20% post-season, 10% off-season
                    phaseBreakdown.totalDays = installer.committed_days.length;
                    phaseBreakdown.preSeasonDays = Math.round(phaseBreakdown.totalDays * 0.10);
                    phaseBreakdown.inSeasonDays = Math.round(phaseBreakdown.totalDays * 0.60);
                    phaseBreakdown.postSeasonDays = Math.round(phaseBreakdown.totalDays * 0.20);
                    phaseBreakdown.offSeasonDays = phaseBreakdown.totalDays - phaseBreakdown.preSeasonDays - phaseBreakdown.inSeasonDays - phaseBreakdown.postSeasonDays;
                }
            } else if (typeof installer.committed_days === 'number') {
                phaseBreakdown.totalDays = installer.committed_days;
                // Same proportional distribution for numeric days
                phaseBreakdown.preSeasonDays = Math.round(phaseBreakdown.totalDays * 0.10);
                phaseBreakdown.inSeasonDays = Math.round(phaseBreakdown.totalDays * 0.60);
                phaseBreakdown.postSeasonDays = Math.round(phaseBreakdown.totalDays * 0.20);
                phaseBreakdown.offSeasonDays = phaseBreakdown.totalDays - phaseBreakdown.preSeasonDays - phaseBreakdown.inSeasonDays - phaseBreakdown.postSeasonDays;
            }
            
            // Calculate base compensation
            const compensation = calculateDetailedCompensation(
                installer.experience_level,
                phaseBreakdown,
                'base'
            );
            
            // Add to totals
            totalsByPhase.total += phaseBreakdown.totalDays;
            totalsByPhase.preSeason += phaseBreakdown.preSeasonDays;
            totalsByPhase.inSeason += phaseBreakdown.inSeasonDays;
            totalsByPhase.postSeason += phaseBreakdown.postSeasonDays;
            totalsByPhase.offSeason += phaseBreakdown.offSeasonDays;
            totalsByPhase.compensation += compensation.totalCompensation;
            
            summaryHTML += `
                <tr>
                    <td>${installer.name}</td>
                    <td><span class="experience-badge experience-${installer.experience_level.toLowerCase()}">${installer.experience_level}</span></td>
                    <td style="text-align: center;"><strong>${phaseBreakdown.totalDays}</strong></td>
                    <td style="text-align: center; color: #f39c12;">${phaseBreakdown.preSeasonDays}</td>
                    <td style="text-align: center; color: #e91e63;">${phaseBreakdown.inSeasonDays}</td>
                    <td style="text-align: center; color: #00bcd4;">${phaseBreakdown.postSeasonDays}</td>
                    <td style="text-align: center; color: #888;">${phaseBreakdown.offSeasonDays}</td>
                    <td style="text-align: center;"><strong>${formatCurrency(compensation.totalCompensation)}</strong></td>
                    <td>
                        <button class="btn btn-primary" onclick="showIndividualRecruitmentSummary(${installer.id})" style="padding: 5px 10px; font-size: 0.8em; margin-right: 5px;">View Details</button>
                        <button class="btn btn-danger" onclick="deleteInstallerFromRecruitment(${installer.id}, '${installer.name.replace(/'/g, "\\'")}')" style="padding: 5px 10px; font-size: 0.8em;">Delete</button>
                    </td>
                </tr>
            `;
        }
        
        // Add totals row
        summaryHTML += `
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8f9fa; font-weight: 600;">
                            <td colspan="2">TOTALS (${installers.length} installers)</td>
                            <td style="text-align: center;">${totalsByPhase.total}</td>
                            <td style="text-align: center; color: #f39c12;">${totalsByPhase.preSeason}</td>
                            <td style="text-align: center; color: #e91e63;">${totalsByPhase.inSeason}</td>
                            <td style="text-align: center; color: #00bcd4;">${totalsByPhase.postSeason}</td>
                            <td style="text-align: center; color: #888;">${totalsByPhase.offSeason}</td>
                            <td style="text-align: center;">${formatCurrency(totalsByPhase.compensation)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
        
        // Add phase coverage summary
        summaryHTML += `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h4 style="color: #2c3e50; margin-bottom: 15px;">Phase Coverage Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 2px solid #ffeaa7;">
                        <div style="font-size: 28px; font-weight: 600; color: #f39c12;">${totalsByPhase.preSeason}</div>
                        <div style="color: #6c757d; font-size: 14px;">Pre-Season Days</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 2px solid #fd79a8;">
                        <div style="font-size: 28px; font-weight: 600; color: #e91e63;">${totalsByPhase.inSeason}</div>
                        <div style="color: #6c757d; font-size: 14px;">In-Season Days</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 2px solid #81ecec;">
                        <div style="font-size: 28px; font-weight: 600; color: #00bcd4;">${totalsByPhase.postSeason}</div>
                        <div style="color: #6c757d; font-size: 14px;">Post-Season Days</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 2px solid #ddd;">
                        <div style="font-size: 28px; font-weight: 600; color: #888;">${totalsByPhase.offSeason}</div>
                        <div style="color: #6c757d; font-size: 14px;">Off-Season Days</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    recruitmentPresentation.innerHTML = summaryHTML;
    
    // Hide the form section
    const formSection = document.querySelector('#recruitment .form-section');
    if (formSection) {
        formSection.style.display = 'none';
    }
}

// Show individual installer recruitment summary
async function showIndividualRecruitmentSummary(installerId) {
    const installer = installers.find(i => i.id === installerId);
    if (!installer) return;
    
    // Calculate phase breakdown
    let phaseBreakdown = { totalDays: 0, preSeasonDays: 0, inSeasonDays: 0, postSeasonDays: 0, offSeasonDays: 0 };
    
    if (Array.isArray(installer.committed_days) && installer.committed_days.length > 0) {
        if (installer.committed_days[0] && installer.committed_days[0].includes('-')) {
            phaseBreakdown = calculatePhaseBreakdown(installer.committed_days);
        } else {
            // For "Day X" format, distribute days proportionally
            phaseBreakdown.totalDays = installer.committed_days.length;
            phaseBreakdown.preSeasonDays = Math.round(phaseBreakdown.totalDays * 0.10);
            phaseBreakdown.inSeasonDays = Math.round(phaseBreakdown.totalDays * 0.60);
            phaseBreakdown.postSeasonDays = Math.round(phaseBreakdown.totalDays * 0.20);
            phaseBreakdown.offSeasonDays = phaseBreakdown.totalDays - phaseBreakdown.preSeasonDays - phaseBreakdown.inSeasonDays - phaseBreakdown.postSeasonDays;
        }
    } else if (typeof installer.committed_days === 'number') {
        phaseBreakdown.totalDays = installer.committed_days;
        phaseBreakdown.preSeasonDays = Math.round(phaseBreakdown.totalDays * 0.10);
        phaseBreakdown.inSeasonDays = Math.round(phaseBreakdown.totalDays * 0.60);
        phaseBreakdown.postSeasonDays = Math.round(phaseBreakdown.totalDays * 0.20);
        phaseBreakdown.offSeasonDays = phaseBreakdown.totalDays - phaseBreakdown.preSeasonDays - phaseBreakdown.inSeasonDays - phaseBreakdown.postSeasonDays;
    }
    
    // Show the detailed summary
    showRecruitmentSummary({
        name: installer.name,
        experienceLevel: installer.experience_level,
        committedDays: installer.committed_days,
        phaseBreakdown: phaseBreakdown
    });
}

// Show recruitment summary for newly committed installer
function showRecruitmentSummary(installerData) {
    // Store the data for display
    window.currentRecruitmentSummary = installerData;
    
    // Clear existing content
    const recruitmentPresentation = document.getElementById('recruitmentPresentation');
    if (!recruitmentPresentation) return;
    
    // Calculate compensation for all scenarios
    const scenarios = ['worst', 'base', 'best'];
    const compensationData = {};
    
    scenarios.forEach(scenario => {
        compensationData[scenario] = calculateDetailedCompensation(
            installerData.experienceLevel,
            installerData.phaseBreakdown,
            scenario
        );
    });
    
    // Build the summary HTML
    let summaryHTML = `
        <h3>Recruitment Summary for ${installerData.name}</h3>
        <div style="margin-bottom: 20px;">
            <p style="font-size: 1.1em; color: #2c3e50;">
                <strong>Experience Level:</strong> <span class="experience-badge experience-${installerData.experienceLevel.toLowerCase()}">${installerData.experienceLevel}</span><br>
                <strong>Total Committed Days:</strong> ${installerData.phaseBreakdown.totalDays} days<br>
                <strong>Per-Diem Rate:</strong> ${formatCurrency(compensationData.base.perDiemRate)}/day
            </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h4 style="color: #2c3e50; margin-bottom: 15px;">Work Days Breakdown</h4>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 600; color: #ffeaa7;">${installerData.phaseBreakdown.preSeasonDays}</div>
                    <div style="color: #6c757d; font-size: 14px;">Pre-Season Days</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 600; color: #fd79a8;">${installerData.phaseBreakdown.inSeasonDays}</div>
                    <div style="color: #6c757d; font-size: 14px;">In-Season Days</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 600; color: #81ecec;">${installerData.phaseBreakdown.postSeasonDays}</div>
                    <div style="color: #6c757d; font-size: 14px;">Post-Season Days</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 600; color: #888;">${installerData.phaseBreakdown.offSeasonDays}</div>
                    <div style="color: #6c757d; font-size: 14px;">Off-Season Days</div>
                </div>
            </div>
        </div>
        
        <h4 style="color: #2c3e50; margin-bottom: 15px;">Compensation Scenarios</h4>
        <div class="scenario-comparison" style="display: grid;">
    `;
    
    // Add scenario cards
    const scenarioInfo = {
        worst: { title: 'Worst Case (Guaranteed)', class: 'scenario-worst' },
        base: { title: 'Base Case (Expected)', class: 'scenario-base' },
        best: { title: 'Best Case (High Performance)', class: 'scenario-best' }
    };
    
    scenarios.forEach(scenario => {
        const comp = compensationData[scenario];
        const info = scenarioInfo[scenario];
        
        summaryHTML += `
            <div class="scenario-card ${info.class}">
                <h4>${info.title}</h4>
                <div class="amount">${formatCurrency(comp.totalCompensation)}</div>
                <div class="details">
                    <div style="margin-bottom: 10px;">
                        <strong>Base Pay (All Days):</strong><br>
                        ${comp.totalDays} days × ${formatCurrency(comp.perDiemRate)} = ${formatCurrency(comp.totalBasePay)}
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Production Bonus:</strong><br>
                        Revenue: ${formatCurrency(comp.inSeasonRevenue)} (${comp.inSeasonDays} days × ${formatCurrency(comp.dailyRevenue)})<br>
                        10% Bonus: ${formatCurrency(comp.grossProductionBonus)}<br>
                        Less Per-Diem: -${formatCurrency(comp.productionDaysPerDiem)}<br>
                        Net Bonus: ${formatCurrency(comp.netProductionBonus)}
                    </div>
                    <div>
                        <strong>Effective Rate:</strong> $${comp.effectiveHourlyRate.toFixed(2)}/hour
                    </div>
                </div>
            </div>
        `;
    });
    
    summaryHTML += '</div>';
    
    // Update the recruitment presentation div
    recruitmentPresentation.innerHTML = summaryHTML;
    
    // Hide the form section since we're showing a summary
    const formSection = document.querySelector('#recruitment .form-section');
    if (formSection) {
        formSection.style.display = 'none';
    }
}

// Delete installer from recruitment summary (permanent deletion)
async function deleteInstallerFromRecruitment(installerId, installerName) {
    showDeleteConfirm(
        `Are you sure you want to permanently delete ${installerName}? This action cannot be undone.`,
        async () => {
            try {
                const response = await fetch(`/api/installers/${installerId}?permanent=true`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Reload installers data
                    await loadInstallers();
                    await updateDashboard();
                    
                    // Refresh the recruitment summary view
                    showAllInstallersRecruitmentSummary();
                    
                    showAlert(`${installerName} has been permanently deleted.`, 'Success');
                } else {
                    showAlert('Error deleting installer: ' + data.error, 'Error');
                }
            } catch (error) {
                console.error('Error deleting installer:', error);
                showAlert('Error deleting installer. Please try again.', 'Error');
            }
        },
        'Confirm Permanent Deletion'
    );
}

// Export functions for HTML
window.showTab = enhancedShowTab;
window.removeInstaller = removeInstaller;
window.saveSettings = saveSettings;
window.saveRevenueGoals = saveRevenueGoals;
window.updateRecruitmentPresentation = updateRecruitmentPresentation;
window.saveSeasonSettings = saveSeasonSettings;
window.updateDashboard = updateDashboard;
window.showSeasonContent = showSeasonContent;
window.saveSeasonDates = saveSeasonDates;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.clearCalendarSelection = clearCalendarSelection;
window.selectAllWorkingDays = selectAllWorkingDays;
window.commitInstallerFromCalendar = commitInstallerFromCalendar;
window.showRecruitmentForm = showRecruitmentForm;
window.deleteInstallerFromRecruitment = deleteInstallerFromRecruitment;

