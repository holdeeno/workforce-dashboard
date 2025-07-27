"""
Revenue Goals Management Routes
Handles storage and retrieval of revenue goals for different scenarios
"""
from flask import Blueprint, request, jsonify
import json
import os

revenue_goals_bp = Blueprint('revenue_goals', __name__)

# Storage file for revenue goals
REVENUE_GOALS_FILE = 'revenue_goals.json'

def get_revenue_goals():
    """Load revenue goals from storage"""
    if os.path.exists(REVENUE_GOALS_FILE):
        try:
            with open(REVENUE_GOALS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    
    # Default values
    return {
        'worst_case': 1200000,
        'base_case': 1500000,
        'best_case': 1800000
    }

def save_revenue_goals(goals):
    """Save revenue goals to storage"""
    with open(REVENUE_GOALS_FILE, 'w') as f:
        json.dump(goals, f)

@revenue_goals_bp.route('/revenue-goals', methods=['GET'])
def get_goals():
    """Get current revenue goals"""
    try:
        goals = get_revenue_goals()
        return jsonify({
            'success': True,
            'data': goals
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@revenue_goals_bp.route('/revenue-goals', methods=['POST'])
def update_goals():
    """Update revenue goals"""
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['worst_case', 'base_case', 'best_case']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
            
            # Ensure values are numbers
            try:
                data[field] = float(data[field])
            except:
                return jsonify({
                    'success': False,
                    'error': f'Invalid value for {field}: must be a number'
                }), 400
        
        # Validate that worst < base < best
        if not (data['worst_case'] < data['base_case'] < data['best_case']):
            return jsonify({
                'success': False,
                'error': 'Invalid values: worst_case must be less than base_case, which must be less than best_case'
            }), 400
        
        # Save the goals
        save_revenue_goals(data)
        
        return jsonify({
            'success': True,
            'data': data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
