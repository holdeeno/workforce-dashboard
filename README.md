# Holiday Light 4U - Workforce Planning Dashboard

A comprehensive web-based dashboard for workforce planning, payroll forecasting, and financial modeling designed specifically for Holiday Light 4U's production-based compensation system.

## Features

### 🎯 Core Functionality
- **Dynamic Scenario Planning**: Model worst, base, and best case revenue scenarios
- **Crew Composition Optimization**: Find optimal mix of experience levels
- **Break-Even Analysis**: Calculate revenue requirements for profitability
- **Recruitment Tool**: Interactive compensation calculator for candidate interviews
- **Financial Modeling**: Integrate with broader operating budget planning

### 📊 Dashboard Views

#### 1. Overview Dashboard
- Real-time metrics and KPIs
- Scenario comparison charts
- Quick crew setup interface
- Break-even analysis summary

#### 2. Workforce Planning
- Crew composition recommendations
- Capacity calculations
- Revenue target planning
- "What-if" scenario modeling

#### 3. Recruitment Tool
- Interactive compensation calculator
- Experience level comparisons
- Printable candidate reports
- Performance scenario modeling

#### 4. Financial Analysis
- Labor cost breakdowns
- Profit margin analysis
- Sensitivity analysis
- Export capabilities

#### 5. Configuration
- Editable seasonal dates
- Per-diem rate adjustments
- Revenue range modifications
- Sliding scale bonus thresholds

## Technical Architecture

### Backend (Flask/Python)
- **Models**: Workforce planning calculations and data structures
- **Routes**: RESTful API endpoints for all dashboard functionality
- **Analytics**: Advanced analytics and optimization algorithms

### Frontend (HTML/CSS/JavaScript)
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Charts**: Real-time data visualization
- **Dynamic Updates**: Live calculations as parameters change
- **Print Support**: Professional reports for recruitment

## Installation & Setup

### Prerequisites
- Python 3.11+
- Flask and dependencies (see requirements.txt)

### Quick Start
```bash
# Navigate to project directory
cd workforce_dashboard

# Activate virtual environment
source venv/bin/activate

# Install dependencies (already included)
pip install -r requirements.txt

# Run the application
python src/main.py
```

The dashboard will be available at `http://localhost:5000`

## Usage Guide

### For Workforce Planning

1. **Set Revenue Targets**: Enter your seasonal revenue goals
2. **Get Recommendations**: Use the AI-powered crew composition optimizer
3. **Model Scenarios**: Test different experience level combinations
4. **Analyze Results**: Review capacity, costs, and efficiency metrics

### For Recruitment

1. **Open Recruitment Tool**: Navigate to `/recruitment.html`
2. **Select Experience Level**: Choose candidate's background
3. **Adjust Performance**: Model different performance scenarios
4. **Present Results**: Show interactive compensation breakdown
5. **Print Report**: Generate professional summary for candidates

### For Financial Planning

1. **Configure Parameters**: Set per-diem rates and bonus thresholds
2. **Run Analysis**: Generate comprehensive financial projections
3. **Export Data**: Download results for external budget planning
4. **Monitor Performance**: Track actual vs. projected metrics

## Key Metrics & Calculations

### Compensation Structure
- **Guaranteed Per-Diem**: $200-$300/day based on experience
- **Production Bonus**: 10-15% of attributed revenue (sliding scale)
- **Break-Even Point**: Revenue needed to cover labor allocation
- **Effective Hourly Rate**: Total compensation ÷ working hours

### Experience Levels
- **Beginner**: $200/day, $2,500-$4,000 daily revenue capacity
- **Intermediate**: $225/day, $4,000-$5,500 daily revenue capacity  
- **Advanced**: $275/day, $5,500-$7,000 daily revenue capacity
- **Expert**: $300/day, $7,000-$8,500 daily revenue capacity

### Sliding Scale Bonuses
- **Base Rate**: 10% of attributed revenue
- **Performance Tiers**: Increases to 15% for high performers
- **Revenue Thresholds**: Configurable breakpoints for bonus increases
- **Retroactive Application**: Higher rates apply to all season revenue

## API Endpoints

### Workforce Planning
- `GET /api/workforce/config` - Get current configuration
- `POST /api/workforce/capacity` - Calculate crew capacity
- `POST /api/workforce/recommend-crews` - Get optimal crew recommendations
- `GET /api/workforce/recruitment-data/{level}` - Get recruitment data
- `GET /api/workforce/break-even/{level}` - Get break-even analysis

### Analytics
- `POST /api/analytics/capacity-matrix` - Generate capacity analysis matrix
- `POST /api/analytics/optimal-crew-size` - Find optimal crew sizes
- `POST /api/analytics/sensitivity-analysis` - Perform sensitivity analysis
- `GET /api/analytics/break-even-chart` - Generate break-even charts
- `POST /api/analytics/export-analysis` - Export comprehensive data

## Configuration Options

### Seasonal Settings
- **Pre-Season**: August-September (setup and training)
- **In-Season**: October-December (peak installation)
- **Post-Season**: January-February (removal and storage)
- **Off-Season**: March-July (maintenance and planning)

### Revenue Scenarios
- **Worst Case**: $1,200,000 (conservative market conditions)
- **Base Case**: $1,500,000 (expected performance)
- **Best Case**: $1,800,000 (optimal market conditions)

### Labor Allocation
- **Total Labor Budget**: 20% of project revenue
- **Crew Leader Production**: 10-15% (sliding scale)
- **Junior Installer Hourly**: $18-$25/hour
- **Taxes & Insurance**: Remaining allocation

## Business Benefits

### Improved Decision Making
- **Data-Driven Hiring**: Optimize crew composition for revenue targets
- **Risk Management**: Model different scenarios and market conditions
- **Cost Control**: Understand true labor costs and break-even points
- **Performance Tracking**: Monitor actual vs. projected results

### Enhanced Recruitment
- **Professional Presentation**: Interactive compensation calculator
- **Transparent Communication**: Clear explanation of pay structure
- **Competitive Positioning**: Show earning potential vs. competitors
- **Retention Planning**: Demonstrate career progression opportunities

### Financial Planning
- **Budget Integration**: Designed for larger operating budget models
- **Cash Flow Management**: Understand payment timing and amounts
- **Profit Optimization**: Identify most profitable crew compositions
- **Scenario Planning**: Prepare for different market conditions

## Future Enhancements

### Planned Features
- **Actual vs. Forecast Tracking**: Real-time performance monitoring
- **Advanced Analytics**: Machine learning for demand forecasting
- **Mobile App**: Field-based data entry and reporting
- **Integration**: Connect with field service management software

### Expansion Opportunities
- **Multi-Location Support**: Scale to multiple markets
- **Customer Analytics**: Integrate customer data for better forecasting
- **Inventory Management**: Link with equipment and materials planning
- **Performance Dashboards**: Individual installer tracking and coaching

## Support & Maintenance

### Data Updates
- **Annual Configuration**: Update rates and revenue targets each season
- **Market Adjustments**: Modify scenarios based on economic conditions
- **Performance Tuning**: Adjust algorithms based on actual results

### Technical Support
- **Documentation**: Comprehensive user guides and API documentation
- **Training**: Team training on dashboard usage and interpretation
- **Customization**: Ability to modify calculations and add new features

## Security & Compliance

### Data Protection
- **Local Deployment**: All data stays within your infrastructure
- **No External Dependencies**: Operates independently of third-party services
- **Access Control**: Can be configured with user authentication if needed

### Compliance
- **Employment Law**: Calculations comply with Arizona labor regulations
- **Financial Reporting**: Supports standard accounting practices
- **Audit Trail**: All calculations are transparent and verifiable

---

**Contact Information**
- **Company**: Holiday Light 4U, LLC DBA Holiday Light Co
- **Address**: 720 N Golden Key St, STE C4, Gilbert, AZ 85234
- **Phone**: 602-478-9410

This dashboard represents a significant advancement in workforce planning and financial modeling for the holiday lighting industry, providing the tools needed to optimize operations, improve recruitment, and maximize profitability.

