from flask import Blueprint, request, jsonify
import json
import os

settings_bp = Blueprint('settings', __name__)

# Define the settings file path
SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'settings.json')

def ensure_settings_file():
    """Ensure the settings file exists"""
    if not os.path.exists(SETTINGS_FILE):
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump({}, f)

def load_settings():
    """Load settings from the JSON file"""
    ensure_settings_file()
    try:
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_settings(settings):
    """Save settings to the JSON file"""
    ensure_settings_file()
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f, indent=2)

@settings_bp.route('/settings/revenue-ranges', methods=['GET'])
def get_revenue_ranges():
    """Get saved revenue range settings"""
    settings = load_settings()
    revenue_ranges = settings.get('revenue_ranges', {})
    
    return jsonify({
        'success': True,
        'data': revenue_ranges
    })

@settings_bp.route('/settings/revenue-ranges', methods=['POST'])
def save_revenue_ranges():
    """Save revenue range settings"""
    try:
        data = request.get_json()
        
        # Validate the data structure
        if not isinstance(data, dict):
            return jsonify({'success': False, 'error': 'Invalid data format'}), 400
        
        # Load existing settings
        settings = load_settings()
        
        # Update revenue ranges
        settings['revenue_ranges'] = data
        
        # Save settings
        save_settings(settings)
        
        return jsonify({
            'success': True,
            'data': data,
            'message': 'Revenue ranges saved successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@settings_bp.route('/settings/season-dates', methods=['GET'])
def get_season_dates():
    """Get saved season dates"""
    settings = load_settings()
    season_dates = settings.get('season_dates', {})
    
    return jsonify({
        'success': True,
        'data': season_dates
    })

@settings_bp.route('/settings/season-dates', methods=['POST'])
def save_season_dates():
    """Save season dates"""
    try:
        data = request.get_json()
        
        # Validate the data structure
        if not isinstance(data, dict):
            return jsonify({'success': False, 'error': 'Invalid data format'}), 400
        
        # Validate that all required seasons are present
        required_seasons = ['pre_season', 'in_season', 'post_season', 'off_season']
        for season in required_seasons:
            if season not in data:
                return jsonify({'success': False, 'error': f'Missing season: {season}'}), 400
            if 'start_date' not in data[season] or 'end_date' not in data[season]:
                return jsonify({'success': False, 'error': f'Missing dates for {season}'}), 400
        
        # Load existing settings
        settings = load_settings()
        
        # Update season dates
        settings['season_dates'] = data
        
        # Save settings
        save_settings(settings)
        
        return jsonify({
            'success': True,
            'data': data,
            'message': 'Season dates saved successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
