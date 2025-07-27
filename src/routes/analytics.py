"""
Advanced Analytics Routes for Workforce Planning
"""
from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from src.models.workforce import WorkforceModel, CrewComposition
import io
import base64
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

analytics_bp = Blueprint('analytics', __name__)

# Global workforce model instance
workforce_model = WorkforceModel()

@analytics_bp.route('/capacity-matrix', methods=['POST'])
def generate_capacity_matrix():
    """Generate capacity analysis matrix for different crew compositions"""
    try:
        data = request.get_json()
        max_crews_per_level = data.get('max_crews_per_level', 5)
        scenario = data.get('scenario', 'base_case')
        
        results = []
        
        # Generate all possible combinations up to max_crews_per_level
        for expert in range(max_crews_per_level + 1):
            for advanced in range(max_crews_per_level + 1):
                for intermediate in range(max_crews_per_level + 1):
                    for beginner in range(max_crews_per_level + 1):
                        total_crews = expert + advanced + intermediate + beginner
                        
                        # Skip if no crews or too many crews
                        if total_crews == 0 or total_crews > 10:
                            continue
                        
                        composition = CrewComposition(
                            expert_crews=expert,
                            advanced_crews=advanced,
                            intermediate_crews=intermediate,
                            beginner_crews=beginner
                        )
                        
                        capacity = workforce_model.calculate_crew_capacity(composition, scenario)
                        
                        if 'error' not in capacity:
                            results.append({
                                'expert_crews': expert,
                                'advanced_crews': advanced,
                                'intermediate_crews': intermediate,
                                'beginner_crews': beginner,
                                'total_crews': total_crews,
                                'total_revenue': capacity['total_seasonal_revenue'],
                                'total_labor_cost': capacity['total_labor_cost'],
                                'labor_percentage': capacity['labor_percentage'],
                                'daily_capacity': capacity['total_daily_capacity'],
                                'efficiency_score': capacity['total_seasonal_revenue'] / capacity['total_labor_cost'] if capacity['total_labor_cost'] > 0 else 0
                            })
        
        # Sort by efficiency score
        results.sort(key=lambda x: x['efficiency_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'scenario': scenario,
                'total_combinations': len(results),
                'combinations': results[:50]  # Return top 50 combinations
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/optimal-crew-size', methods=['POST'])
def find_optimal_crew_size():
    """Find optimal crew size for different revenue targets"""
    try:
        data = request.get_json()
        revenue_targets = data.get('revenue_targets', [1000000, 1200000, 1500000, 1800000, 2000000])
        scenario = data.get('scenario', 'base_case')
        
        results = {}
        
        for target in revenue_targets:
            recommendations = workforce_model.recommend_crew_composition(target, scenario)
            
            if recommendations['recommendations']:
                best_rec = recommendations['recommendations'][0]
                
                results[str(target)] = {
                    'target_revenue': target,
                    'recommended_composition': {
                        'expert_crews': best_rec['composition'].expert_crews,
                        'advanced_crews': best_rec['composition'].advanced_crews,
                        'intermediate_crews': best_rec['composition'].intermediate_crews,
                        'beginner_crews': best_rec['composition'].beginner_crews
                    },
                    'projected_revenue': best_rec['capacity']['total_seasonal_revenue'],
                    'total_crews': best_rec['capacity']['total_crews'],
                    'labor_cost': best_rec['capacity']['total_labor_cost'],
                    'labor_percentage': best_rec['capacity']['labor_percentage'],
                    'revenue_gap_pct': best_rec['revenue_gap_pct'],
                    'efficiency_score': best_rec['efficiency_score']
                }
        
        return jsonify({
            'success': True,
            'data': {
                'scenario': scenario,
                'optimal_compositions': results
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/sensitivity-analysis', methods=['POST'])
def perform_sensitivity_analysis():
    """Perform sensitivity analysis on key parameters"""
    try:
        data = request.get_json()
        base_composition = CrewComposition(
            expert_crews=data.get('expert_crews', 1),
            advanced_crews=data.get('advanced_crews', 1),
            intermediate_crews=data.get('intermediate_crews', 2),
            beginner_crews=data.get('beginner_crews', 0)
        )
        
        # Test different performance multipliers
        performance_multipliers = np.arange(0.7, 1.4, 0.1)
        scenarios = ['worst_case', 'base_case', 'best_case']
        
        results = {}
        
        for scenario in scenarios:
            scenario_results = []
            
            for multiplier in performance_multipliers:
                # Calculate capacity with modified revenue ranges
                # This is a simplified sensitivity analysis
                capacity = workforce_model.calculate_crew_capacity(base_composition, scenario)
                
                if 'error' not in capacity:
                    # Apply multiplier to revenue
                    adjusted_revenue = capacity['total_seasonal_revenue'] * multiplier
                    adjusted_labor_cost = capacity['total_labor_cost']  # Labor cost stays same
                    
                    scenario_results.append({
                        'performance_multiplier': round(multiplier, 1),
                        'revenue': adjusted_revenue,
                        'labor_cost': adjusted_labor_cost,
                        'labor_percentage': (adjusted_labor_cost / adjusted_revenue * 100) if adjusted_revenue > 0 else 0,
                        'profit': adjusted_revenue - adjusted_labor_cost
                    })
            
            results[scenario] = scenario_results
        
        return jsonify({
            'success': True,
            'data': {
                'base_composition': {
                    'expert_crews': base_composition.expert_crews,
                    'advanced_crews': base_composition.advanced_crews,
                    'intermediate_crews': base_composition.intermediate_crews,
                    'beginner_crews': base_composition.beginner_crews
                },
                'sensitivity_results': results
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/break-even-chart', methods=['GET'])
def generate_break_even_chart():
    """Generate break-even analysis chart"""
    try:
        # Get break-even data for all experience levels
        break_even_data = {}
        for level in workforce_model.experience_levels.keys():
            break_even_data[level] = workforce_model.calculate_break_even_analysis(level)
        
        # Create chart
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Chart 1: Break-even revenue by experience level
        levels = list(break_even_data.keys())
        revenues = [break_even_data[level]['break_even_revenue'] for level in levels]
        daily_revenues = [break_even_data[level]['break_even_daily_revenue'] for level in levels]
        
        colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
        
        bars1 = ax1.bar(levels, revenues, color=colors, alpha=0.7)
        ax1.set_title('Break-Even Revenue by Experience Level', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Break-Even Revenue ($)', fontsize=12)
        ax1.set_xlabel('Experience Level', fontsize=12)
        
        # Add value labels on bars
        for bar, revenue in zip(bars1, revenues):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                    f'${revenue:,.0f}', ha='center', va='bottom', fontsize=10)
        
        # Chart 2: Daily revenue needed
        bars2 = ax2.bar(levels, daily_revenues, color=colors, alpha=0.7)
        ax2.set_title('Daily Revenue Needed for Break-Even', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Daily Revenue ($)', fontsize=12)
        ax2.set_xlabel('Experience Level', fontsize=12)
        
        # Add value labels on bars
        for bar, daily_rev in zip(bars2, daily_revenues):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                    f'${daily_rev:,.0f}', ha='center', va='bottom', fontsize=10)
        
        plt.tight_layout()
        
        # Convert to base64 string
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        img_string = base64.b64encode(img_buffer.read()).decode()
        plt.close()
        
        return jsonify({
            'success': True,
            'data': {
                'chart_image': img_string,
                'break_even_data': break_even_data
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/revenue-scenarios-chart', methods=['POST'])
def generate_revenue_scenarios_chart():
    """Generate revenue scenarios comparison chart"""
    try:
        data = request.get_json()
        composition = CrewComposition(
            expert_crews=data.get('expert_crews', 1),
            advanced_crews=data.get('advanced_crews', 1),
            intermediate_crews=data.get('intermediate_crews', 2),
            beginner_crews=data.get('beginner_crews', 0)
        )
        
        scenarios = ['worst_case', 'base_case', 'best_case']
        scenario_labels = ['Worst Case', 'Base Case', 'Best Case']
        
        revenues = []
        labor_costs = []
        profits = []
        
        for scenario in scenarios:
            capacity = workforce_model.calculate_crew_capacity(composition, scenario)
            if 'error' not in capacity:
                revenues.append(capacity['total_seasonal_revenue'])
                labor_costs.append(capacity['total_labor_cost'])
                profits.append(capacity['total_seasonal_revenue'] - capacity['total_labor_cost'])
            else:
                revenues.append(0)
                labor_costs.append(0)
                profits.append(0)
        
        # Create chart
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Chart 1: Revenue vs Labor Cost
        x = np.arange(len(scenario_labels))
        width = 0.35
        
        bars1 = ax1.bar(x - width/2, revenues, width, label='Revenue', color='#3b82f6', alpha=0.8)
        bars2 = ax1.bar(x + width/2, labor_costs, width, label='Labor Cost', color='#ef4444', alpha=0.8)
        
        ax1.set_title('Revenue vs Labor Cost by Scenario', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Amount ($)', fontsize=12)
        ax1.set_xlabel('Scenario', fontsize=12)
        ax1.set_xticks(x)
        ax1.set_xticklabels(scenario_labels)
        ax1.legend()
        
        # Add value labels
        for bar in bars1:
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                    f'${height/1000000:.1f}M', ha='center', va='bottom', fontsize=9)
        
        for bar in bars2:
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                    f'${height/1000:.0f}K', ha='center', va='bottom', fontsize=9)
        
        # Chart 2: Profit by scenario
        colors = ['#ef4444', '#3b82f6', '#22c55e']
        bars3 = ax2.bar(scenario_labels, profits, color=colors, alpha=0.8)
        
        ax2.set_title('Profit by Scenario', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Profit ($)', fontsize=12)
        ax2.set_xlabel('Scenario', fontsize=12)
        
        # Add value labels
        for bar in bars3:
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                    f'${height/1000000:.1f}M', ha='center', va='bottom', fontsize=10)
        
        plt.tight_layout()
        
        # Convert to base64 string
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        img_string = base64.b64encode(img_buffer.read()).decode()
        plt.close()
        
        return jsonify({
            'success': True,
            'data': {
                'chart_image': img_string,
                'scenario_data': {
                    'revenues': revenues,
                    'labor_costs': labor_costs,
                    'profits': profits,
                    'scenarios': scenario_labels
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/crew-efficiency-analysis', methods=['POST'])
def analyze_crew_efficiency():
    """Analyze crew efficiency across different compositions"""
    try:
        data = request.get_json()
        scenario = data.get('scenario', 'base_case')
        
        # Test different crew compositions
        compositions = [
            {'name': 'All Beginners', 'beginner': 6, 'intermediate': 0, 'advanced': 0, 'expert': 0},
            {'name': 'Mixed Low', 'beginner': 3, 'intermediate': 2, 'advanced': 1, 'expert': 0},
            {'name': 'Balanced', 'beginner': 1, 'intermediate': 2, 'advanced': 2, 'expert': 1},
            {'name': 'Mixed High', 'beginner': 0, 'intermediate': 1, 'advanced': 2, 'expert': 2},
            {'name': 'All Experts', 'beginner': 0, 'intermediate': 0, 'advanced': 0, 'expert': 4},
        ]
        
        results = []
        
        for comp in compositions:
            composition = CrewComposition(
                beginner_crews=comp['beginner'],
                intermediate_crews=comp['intermediate'],
                advanced_crews=comp['advanced'],
                expert_crews=comp['expert']
            )
            
            capacity = workforce_model.calculate_crew_capacity(composition, scenario)
            
            if 'error' not in capacity:
                total_crews = capacity['total_crews']
                revenue_per_crew = capacity['total_seasonal_revenue'] / total_crews if total_crews > 0 else 0
                cost_per_crew = capacity['total_labor_cost'] / total_crews if total_crews > 0 else 0
                
                results.append({
                    'composition_name': comp['name'],
                    'total_crews': total_crews,
                    'total_revenue': capacity['total_seasonal_revenue'],
                    'total_labor_cost': capacity['total_labor_cost'],
                    'revenue_per_crew': revenue_per_crew,
                    'cost_per_crew': cost_per_crew,
                    'efficiency_ratio': revenue_per_crew / cost_per_crew if cost_per_crew > 0 else 0,
                    'labor_percentage': capacity['labor_percentage'],
                    'composition': comp
                })
        
        # Sort by efficiency ratio
        results.sort(key=lambda x: x['efficiency_ratio'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'scenario': scenario,
                'efficiency_analysis': results
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/export-analysis', methods=['POST'])
def export_analysis_data():
    """Export comprehensive analysis data for external use"""
    try:
        data = request.get_json()
        
        # Get all break-even data
        break_even_data = {}
        for level in workforce_model.experience_levels.keys():
            break_even_data[level] = workforce_model.calculate_break_even_analysis(level)
        
        # Get capacity matrix
        capacity_matrix = []
        for expert in range(3):
            for advanced in range(3):
                for intermediate in range(4):
                    for beginner in range(3):
                        total_crews = expert + advanced + intermediate + beginner
                        if total_crews > 0 and total_crews <= 8:
                            composition = CrewComposition(
                                expert_crews=expert,
                                advanced_crews=advanced,
                                intermediate_crews=intermediate,
                                beginner_crews=beginner
                            )
                            
                            for scenario in ['worst_case', 'base_case', 'best_case']:
                                capacity = workforce_model.calculate_crew_capacity(composition, scenario)
                                if 'error' not in capacity:
                                    capacity_matrix.append({
                                        'scenario': scenario,
                                        'expert_crews': expert,
                                        'advanced_crews': advanced,
                                        'intermediate_crews': intermediate,
                                        'beginner_crews': beginner,
                                        'total_crews': total_crews,
                                        'total_revenue': capacity['total_seasonal_revenue'],
                                        'total_labor_cost': capacity['total_labor_cost'],
                                        'labor_percentage': capacity['labor_percentage'],
                                        'daily_capacity': capacity['total_daily_capacity']
                                    })
        
        # Get configuration
        config = workforce_model.export_configuration()
        
        return jsonify({
            'success': True,
            'data': {
                'break_even_analysis': break_even_data,
                'capacity_matrix': capacity_matrix,
                'configuration': config,
                'export_timestamp': pd.Timestamp.now().isoformat()
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

