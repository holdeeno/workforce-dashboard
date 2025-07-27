# Problem Description for AI Coding Assistants

## Business Context

**Company**: Holiday Light 4U, LLC DBA Holiday Light Co  
**Industry**: Seasonal holiday lighting and decorating services  
**Location**: Gilbert, Arizona  
**Business Model**: Residential and commercial property decoration

### Core Business Challenge

Holiday Light 4U operates a seasonal business with complex workforce planning requirements. The company needed to transition from static spreadsheet-based payroll forecasting to a dynamic, interactive system that could:

1. **Model Production-Based Compensation**: Handle a unique pay structure combining guaranteed per-diem rates with performance-based bonuses
2. **Support Recruitment**: Provide professional tools for explaining compensation to potential hires
3. **Optimize Crew Composition**: Determine optimal mix of experience levels to meet revenue targets
4. **Enable Scenario Planning**: Model best/worst/base case business scenarios
5. **Integrate with Broader Financial Planning**: Support larger operating budget models

## Technical Problem Statement

### Original System Limitations
- Static Excel spreadsheet with fixed assumptions
- Single scenario planning (no best/worst case modeling)
- No real-time calculation capabilities
- Limited recruitment presentation tools
- No crew composition optimization
- Difficult to share and collaborate on

### Required Solution Architecture
- **Web-based dashboard** with multiple views and real-time calculations
- **Dynamic parameter configuration** for seasonal dates, rates, and thresholds
- **Interactive scenario modeling** with instant feedback
- **Professional recruitment presentation** tools
- **Advanced analytics** for crew optimization and break-even analysis
- **Responsive design** for desktop and mobile access

## Business Model Details

### Compensation Structure
- **Crew Leaders**: Production-based pay with guaranteed per-diem + percentage of attributed revenue
- **Junior Installers**: Hourly pay ($18-$25/hour) for 12-hour guaranteed days
- **Total Labor Allocation**: 20% of project revenue (includes all labor costs, taxes, insurance)
- **Commercial Revenue Exclusion**: Only residential installations count toward production bonuses

### Experience Levels and Capacity
| Level | Per-Diem Rate | Daily Revenue Capacity | Production Rate |
|-------|---------------|----------------------|-----------------|
| Beginner | $200/day | $2,500-$4,000 | 10-15% (sliding scale) |
| Intermediate | $225/day | $4,000-$5,500 | 10-15% (sliding scale) |
| Advanced | $275/day | $5,500-$7,000 | 10-15% (sliding scale) |
| Expert | $300/day | $7,000-$8,500 | 10-15% (sliding scale) |

### Seasonal Operations
- **Pre-Season**: August-September (setup, training, early installations)
- **In-Season**: October-December (peak installation period)
- **Post-Season**: January-February (removal and storage)
- **Off-Season**: March-July (maintenance, planning, equipment prep)

### Revenue Scenarios
- **Worst Case**: $1,200,000 (conservative market conditions)
- **Base Case**: $1,500,000 (expected performance)
- **Best Case**: $1,800,000 (optimal market conditions)

## Technical Requirements

### Core Functionality
1. **Dynamic Dashboard**: 5 integrated views (Overview, Workforce Planning, Recruitment, Financial Analysis, Configuration)
2. **Real-Time Calculations**: Instant updates as parameters change
3. **Scenario Modeling**: Compare multiple revenue and crew composition scenarios
4. **Break-Even Analysis**: Calculate revenue requirements for profitability
5. **Crew Optimization**: AI-powered recommendations for optimal team composition
6. **Recruitment Tools**: Interactive compensation calculator for candidate presentations

### Technical Stack
- **Backend**: Flask (Python 3.11+)
- **Frontend**: HTML/CSS/JavaScript with Chart.js for visualizations
- **Data Processing**: Pandas, NumPy for calculations
- **Deployment**: Designed for local development, cloud hosting (Replit), or professional cloud deployment

### Key Calculations
1. **Production Bonus Calculation**: 
   - Base: 10% of attributed residential revenue per crew leader
   - Sliding scale: Increases to 15% based on performance thresholds
   - Retroactive application: Higher rates apply to all season revenue

2. **Break-Even Analysis**:
   - Revenue required to cover guaranteed per-diem costs
   - Total labor cost vs. 20% allocation budget
   - Individual crew leader profitability thresholds

3. **Crew Capacity Planning**:
   - Total seasonal revenue capacity by crew composition
   - Optimal crew mix recommendations for target revenue
   - "What-if" scenario analysis for different team configurations

4. **Recruitment Projections**:
   - Worst/base/best case earning scenarios by experience level
   - Effective hourly rate calculations
   - Seasonal compensation breakdown

## Data Flow and Integration

### Input Parameters
- **Seasonal Configuration**: Start/end dates, working days per week
- **Experience Level Settings**: Per-diem rates, revenue capacity ranges
- **Revenue Targets**: Worst/base/best case scenario amounts
- **Sliding Scale Thresholds**: Performance-based bonus breakpoints
- **Crew Composition**: Number of each experience level

### Output Deliverables
- **Workforce Planning Reports**: Crew recommendations, capacity analysis
- **Financial Projections**: Labor costs, break-even analysis, profit margins
- **Recruitment Materials**: Compensation calculators, earning scenarios
- **Scenario Comparisons**: Side-by-side analysis of different configurations

### Integration Points
- **Field Service Management Software**: Revenue attribution data
- **Payroll Systems**: Bi-weekly payment calculations
- **Operating Budget Models**: Labor cost inputs for broader financial planning
- **Recruitment Processes**: Professional presentation tools

## Success Criteria

### Functional Requirements
- ✅ Replace static spreadsheet with dynamic web application
- ✅ Support real-time scenario planning and "what-if" analysis
- ✅ Provide professional recruitment presentation tools
- ✅ Calculate accurate break-even points and profitability metrics
- ✅ Optimize crew composition for revenue targets
- ✅ Enable team collaboration and remote access

### Performance Requirements
- ✅ Instant calculation updates (< 1 second response time)
- ✅ Support multiple concurrent users
- ✅ Work on desktop and mobile devices
- ✅ Handle seasonal data volumes without performance degradation

### Business Impact
- **Improved Hiring Decisions**: Data-driven crew composition optimization
- **Enhanced Recruitment**: Professional presentation tools increase candidate conversion
- **Better Financial Planning**: Accurate labor cost projections and scenario analysis
- **Increased Efficiency**: Eliminate manual spreadsheet maintenance and errors

## Implementation Notes

### Development Approach
The solution was built using a progressive enhancement approach:
1. **Core calculations** implemented in Python with pandas/numpy
2. **Web interface** built with Flask and responsive HTML/CSS/JavaScript
3. **Interactive features** added with Chart.js and real-time updates
4. **Professional presentation** tools for recruitment use cases

### Deployment Strategy
- **Local Development**: For testing and customization
- **Cloud Hosting (Replit)**: For team access and collaboration
- **Professional Cloud**: For production use with enhanced security and performance

### Maintenance Considerations
- **Annual Configuration Updates**: Seasonal dates, rates, revenue targets
- **Performance Monitoring**: Track calculation accuracy against actual results
- **Feature Enhancements**: Add new capabilities based on business needs
- **Integration Opportunities**: Connect with other business systems

## Files and Structure

### Key Application Files
- `src/main.py`: Flask application entry point
- `src/models/workforce.py`: Core business logic and calculations
- `src/routes/workforce.py`: API endpoints for workforce planning
- `src/routes/analytics.py`: Advanced analytics and optimization
- `src/static/`: Web interface files (HTML, CSS, JavaScript)

### Documentation Files
- `README.md`: Comprehensive system documentation
- `PROBLEM_DESCRIPTION.md`: This file - context for AI assistants
- `requirements.txt`: Python dependencies
- Deployment guides: Step-by-step setup instructions

### Configuration Data
- Default seasonal settings (August-February operations)
- Experience level definitions and revenue ranges
- Sliding scale bonus thresholds
- Revenue scenario templates ($1.2M-$1.8M range)

This problem description provides the complete context needed for AI coding assistants to understand, maintain, and enhance the workforce planning dashboard system.

