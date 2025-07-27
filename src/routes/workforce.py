"""
Workforce Planning API Routes
"""
from flask import Blueprint, request, jsonify
from src.models.workforce import WorkforceModel, CrewComposition
import json

workforce_bp = Blueprint('workforce', __name__)

# Global workforce model instance
workforce_model = WorkforceModel()

@workforce_bp.route('/config', methods=['GET'])
def get_configuration():
    """Get current workforce planning configuration"""
    try:
        config = workforce_model.export_configuration()
        return jsonify({
            'success': True,
            'data': config
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/config', methods=['POST'])
def update_configuration():
    """Update workforce planning configuration"""
    try:
        config_data = request.get_json()
        workforce_model.update_configuration(config_data)
        
        return jsonify({
            'success': True,
            'message': 'Configuration updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/compensation/<experience_level>/<scenario>', methods=['GET'])
def calculate_compensation(experience_level, scenario):
    """Calculate compensation for a specific experience level and scenario"""
    try:
        performance_multiplier = float(request.args.get('performance_multiplier', 1.0))
        
        result = workforce_model.calculate_crew_leader_compensation(
            experience_level, scenario, performance_multiplier
        )
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/compensation/all', methods=['POST'])
def calculate_all_compensation():
    """Calculate compensation for all experience levels and scenarios"""
    try:
        request_data = request.get_json() or {}
        performance_multiplier = request_data.get('performance_multiplier', 1.0)
        
        results = {}
        
        for exp_level in workforce_model.experience_levels.keys():
            results[exp_level] = {}
            for scenario in workforce_model.revenue_scenarios.keys():
                results[exp_level][scenario] = workforce_model.calculate_crew_leader_compensation(
                    exp_level, scenario, performance_multiplier
                )
        
        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/capacity', methods=['POST'])
def calculate_capacity():
    """Calculate capacity for a given crew composition"""
    try:
        data = request.get_json()
        
        composition = CrewComposition(
            beginner_crews=data.get('beginner_crews', 0),
            intermediate_crews=data.get('intermediate_crews', 0),
            advanced_crews=data.get('advanced_crews', 0),
            expert_crews=data.get('expert_crews', 0)
        )
        
        scenario = data.get('scenario', 'base_case')
        
        result = workforce_model.calculate_crew_capacity(composition, scenario)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/recommend-crews', methods=['POST'])
def recommend_crews():
    """Recommend optimal crew composition for target revenue"""
    try:
        data = request.get_json()
        target_revenue = data.get('target_revenue')
        scenario = data.get('scenario', 'base_case')
        
        if not target_revenue:
            return jsonify({
                'success': False,
                'error': 'target_revenue is required'
            }), 400
        
        result = workforce_model.recommend_crew_composition(target_revenue, scenario)
        
        # Convert CrewComposition objects to dictionaries for JSON serialization
        for rec in result['recommendations']:
            rec['composition'] = {
                'beginner_crews': rec['composition'].beginner_crews,
                'intermediate_crews': rec['composition'].intermediate_crews,
                'advanced_crews': rec['composition'].advanced_crews,
                'expert_crews': rec['composition'].expert_crews
            }
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/break-even/<experience_level>', methods=['GET'])
def calculate_break_even(experience_level):
    """Calculate break-even analysis for an experience level"""
    try:
        result = workforce_model.calculate_break_even_analysis(experience_level)
        
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/break-even/all', methods=['GET'])
def calculate_all_break_even():
    """Calculate break-even analysis for all experience levels"""
    try:
        results = {}
        
        for exp_level in workforce_model.experience_levels.keys():
            results[exp_level] = workforce_model.calculate_break_even_analysis(exp_level)
        
        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/scenarios/compare', methods=['POST'])
def compare_scenarios():
    """Compare multiple scenarios for workforce planning"""
    try:
        data = request.get_json()
        compositions = data.get('compositions', [])
        scenarios = data.get('scenarios', ['worst_case', 'base_case', 'best_case'])
        
        results = {}
        
        for i, comp_data in enumerate(compositions):
            composition = CrewComposition(
                beginner_crews=comp_data.get('beginner_crews', 0),
                intermediate_crews=comp_data.get('intermediate_crews', 0),
                advanced_crews=comp_data.get('advanced_crews', 0),
                expert_crews=comp_data.get('expert_crews', 0)
            )
            
            comp_name = comp_data.get('name', f'Composition {i+1}')
            results[comp_name] = {}
            
            for scenario in scenarios:
                results[comp_name][scenario] = workforce_model.calculate_crew_capacity(
                    composition, scenario
                )
        
        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/recruitment-data/<experience_level>', methods=['GET'])
def get_recruitment_data(experience_level):
    """Get comprehensive recruitment data for an experience level"""
    try:
        performance_multipliers = [0.8, 1.0, 1.2]  # Worst, base, best performance
        
        results = {}
        
        for multiplier in performance_multipliers:
            scenario_name = 'worst_case' if multiplier == 0.8 else 'base_case' if multiplier == 1.0 else 'best_case'
            
            compensation_data = workforce_model.calculate_crew_leader_compensation(
                experience_level, scenario_name, multiplier
            )
            
            # Calculate bi-weekly pay
            total_weeks = compensation_data['total_working_days'] / 5  # Assuming 5 working days per week
            bi_weekly_periods = total_weeks / 2
            bi_weekly_per_diem = compensation_data['total_per_diem'] / bi_weekly_periods if bi_weekly_periods > 0 else 0
            
            results[scenario_name] = {
                **compensation_data,
                'bi_weekly_per_diem': bi_weekly_per_diem,
                'performance_multiplier': multiplier
            }
        
        # Add break-even analysis
        break_even = workforce_model.calculate_break_even_analysis(experience_level)
        
        return jsonify({
            'success': True,
            'data': {
                'scenarios': results,
                'break_even': break_even,
                'experience_config': workforce_model.experience_levels[experience_level].__dict__
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@workforce_bp.route('/financial-summary', methods=['POST'])
def get_financial_summary():
    """Get comprehensive financial summary for planning"""
    try:
        data = request.get_json()
        
        composition = CrewComposition(
            beginner_crews=data.get('beginner_crews', 0),
            intermediate_crews=data.get('intermediate_crews', 0),
            advanced_crews=data.get('advanced_crews', 0),
            expert_crews=data.get('expert_crews', 0)
        )
        
        results = {}
        
        # Calculate for all scenarios
        for scenario in workforce_model.revenue_scenarios.keys():
            capacity_data = workforce_model.calculate_crew_capacity(composition, scenario)
            
            if 'error' not in capacity_data:
                # Calculate profit margins
                revenue = capacity_data['total_seasonal_revenue']
                labor_cost = capacity_data['total_labor_cost']
                
                # Estimate material costs (assuming 30% of revenue)
                material_cost = revenue * 0.30
                direct_costs = labor_cost + material_cost
                gross_profit = revenue - direct_costs
                gross_margin = (gross_profit / revenue * 100) if revenue > 0 else 0
                
                # Estimate operating costs (assuming 25% of revenue)
                operating_costs = revenue * 0.25
                net_profit = gross_profit - operating_costs
                net_margin = (net_profit / revenue * 100) if revenue > 0 else 0
                
                results[scenario] = {
                    **capacity_data,
                    'material_cost': material_cost,
                    'direct_costs': direct_costs,
                    'gross_profit': gross_profit,
                    'gross_margin': gross_margin,
                    'operating_costs': operating_costs,
                    'net_profit': net_profit,
                    'net_margin': net_margin
                }
        
        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

