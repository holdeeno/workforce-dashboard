"""
API routes for installer management and tracking.
"""

from flask import Blueprint, request, jsonify
from src.models.installer import InstallerDatabase, RevenueTracker

installer_bp = Blueprint('installer', __name__)

# Initialize database and tracker
installer_db = InstallerDatabase()
revenue_tracker = RevenueTracker(installer_db)

@installer_bp.route('/api/installers', methods=['GET'])
def get_all_installers():
    """Get all active installers."""
    try:
        installers = installer_db.get_all_active_installers()
        return jsonify({
            'success': True,
            'installers': installers,
            'count': len(installers)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/installers', methods=['POST'])
def add_installer():
    """Add a new installer."""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'experience_level']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False, 
                    'error': f'Missing required field: {field}'
                }), 400
        
        installer = installer_db.add_installer(
            name=data['name'],
            experience_level=data['experience_level'],
            committed_days=data.get('committed_days', [])
        )
        
        return jsonify({
            'success': True,
            'installer': installer,
            'message': f'Installer {data["name"]} added successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/installers/<int:installer_id>', methods=['GET'])
def get_installer(installer_id):
    """Get specific installer by ID."""
    try:
        installer = installer_db.get_installer(installer_id)
        if not installer:
            return jsonify({
                'success': False, 
                'error': 'Installer not found'
            }), 404
        
        return jsonify({
            'success': True,
            'installer': installer
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/installers/<int:installer_id>', methods=['PUT'])
def update_installer(installer_id):
    """Update installer information."""
    try:
        data = request.get_json()
        
        success = installer_db.update_installer(installer_id, data)
        if not success:
            return jsonify({
                'success': False, 
                'error': 'Installer not found'
            }), 404
        
        updated_installer = installer_db.get_installer(installer_id)
        return jsonify({
            'success': True,
            'installer': updated_installer,
            'message': 'Installer updated successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/installers/<int:installer_id>', methods=['DELETE'])
def remove_installer(installer_id):
    """Remove (deactivate) or permanently delete installer."""
    try:
        # Check if permanent deletion is requested
        permanent = request.args.get('permanent', 'false').lower() == 'true'
        
        if permanent:
            # Permanently delete the installer
            success = installer_db.delete_installer(installer_id)
            message = 'Installer permanently deleted'
        else:
            # Just mark as inactive
            success = installer_db.remove_installer(installer_id)
            message = 'Installer removed successfully'
            
        if not success:
            return jsonify({
                'success': False, 
                'error': 'Installer not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': message
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/revenue/dashboard', methods=['GET'])
def get_revenue_dashboard():
    """Get revenue tracking dashboard data."""
    try:
        scenario = request.args.get('scenario', 'base')
        target_revenue = int(request.args.get('target_revenue', 1500000))
        
        # Get committed revenue breakdown
        committed_data = revenue_tracker.calculate_total_committed_revenue(scenario)
        
        # Get remaining capacity analysis
        remaining_data = revenue_tracker.calculate_remaining_capacity(target_revenue, scenario)
        
        return jsonify({
            'success': True,
            'scenario': scenario,
            'target_revenue': target_revenue,
            'committed_revenue': committed_data['total_committed_revenue'],
            'remaining_revenue': remaining_data['remaining_revenue'],
            'percentage_committed': remaining_data['percentage_committed'],
            'installer_count': committed_data['installer_count'],
            'installer_breakdown': committed_data['installer_breakdown'],
            'additional_needed': remaining_data['additional_installers_needed']
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/recruitment/presentation', methods=['POST'])
def get_recruitment_presentation():
    """Generate recruitment presentation data."""
    try:
        data = request.get_json()
        
        required_fields = ['experience_level', 'committed_days']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False, 
                    'error': f'Missing required field: {field}'
                }), 400
        
        presentation_data = revenue_tracker.get_recruitment_presentation_data(
            experience_level=data['experience_level'],
            committed_days=int(data['committed_days'])
        )
        
        return jsonify({
            'success': True,
            'presentation_data': presentation_data
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/revenue/scenarios', methods=['GET'])
def get_revenue_scenarios():
    """Get revenue scenarios for all experience levels."""
    try:
        scenarios_data = {
            'experience_levels': list(revenue_tracker.revenue_ranges.keys()),
            'scenarios': ['worst', 'base', 'best'],
            'revenue_ranges': revenue_tracker.revenue_ranges,
            'per_diem_rates': revenue_tracker.per_diem_rates
        }
        
        return jsonify({
            'success': True,
            'data': scenarios_data
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/revenue/capacity-analysis', methods=['POST'])
def get_capacity_analysis():
    """Analyze capacity for different revenue targets."""
    try:
        data = request.get_json()
        
        revenue_targets = data.get('revenue_targets', {
            'worst': 1200000,
            'base': 1500000,
            'best': 1800000
        })
        
        analysis = {}
        for scenario, target in revenue_targets.items():
            analysis[scenario] = revenue_tracker.calculate_remaining_capacity(target, scenario)
        
        return jsonify({
            'success': True,
            'capacity_analysis': analysis
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@installer_bp.route('/api/installers/by-experience/<experience_level>', methods=['GET'])
def get_installers_by_experience(experience_level):
    """Get installers by experience level."""
    try:
        installers = installer_db.get_installers_by_experience(experience_level)
        return jsonify({
            'success': True,
            'experience_level': experience_level,
            'installers': installers,
            'count': len(installers)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

