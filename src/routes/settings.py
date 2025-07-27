from flask import Blueprint, request, jsonify
import json
import os
from datetime import datetime, timedelta

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

def validate_season_dates(season_data):
    """Validate that season dates are chronological and consecutive"""
    seasons = ['pre_season', 'in_season', 'post_season', 'off_season']
    season_names = {
        'pre_season': 'Pre-Season',
        'in_season': 'In-Season',
        'post_season': 'Post-Season',
        'off_season': 'Off-Season'
    }
    
    # Check if all dates are filled and valid
    for season in seasons:
        if not season_data[season]['start_date'] or not season_data[season]['end_date']:
            return False, f"Please fill in all start and end dates for {season_names[season]}."
        
        try:
            start_date = datetime.strptime(season_data[season]['start_date'], '%Y-%m-%d')
            end_date = datetime.strptime(season_data[season]['end_date'], '%Y-%m-%d')
        except ValueError:
            return False, f"Invalid date format for {season_names[season]}. Use YYYY-MM-DD format."
        
        # Check if end date is after start date
        if end_date <= start_date:
            return False, f"End date must be after start date for {season_names[season]}."
    
    # Check for proper chronological order and no gaps
    for i in range(len(seasons) - 1):
        current_season = seasons[i]
        next_season = seasons[i + 1]
        
        try:
            current_end = datetime.strptime(season_data[current_season]['end_date'], '%Y-%m-%d')
            next_start = datetime.strptime(season_data[next_season]['start_date'], '%Y-%m-%d')
        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD format."
        
        # Check if seasons are in chronological order
        if current_end >= next_start:
            return False, f"{season_names[current_season]} must end before {season_names[next_season]} begins."
        
        # Check for gaps between seasons (should be exactly 1 day)
        day_difference = (next_start - current_end).days
        if day_difference != 1:
            if day_difference > 1:
                return False, f"There is a {day_difference - 1} day gap between {season_names[current_season]} and {season_names[next_season]}. Seasons must be consecutive with no gaps."
    
    return True, "Valid"

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
        
        # Validate season dates are chronological and consecutive
        is_valid, error_message = validate_season_dates(data)
        if not is_valid:
            return jsonify({'success': False, 'error': error_message}), 400
        
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
