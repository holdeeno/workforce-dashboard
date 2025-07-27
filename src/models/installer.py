"""
Installer model for tracking individual installers and their revenue commitments.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class InstallerDatabase:
    """Simple file-based database for installer tracking."""
    
    def __init__(self, db_path: str = "data/installers.json"):
        self.db_path = db_path
        self.ensure_data_directory()
        self.installers = self.load_installers()
    
    def ensure_data_directory(self):
        """Ensure the data directory exists."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
    
    def load_installers(self) -> List[Dict]:
        """Load installers from JSON file."""
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                return []
        return []
    
    def save_installers(self):
        """Save installers to JSON file."""
        with open(self.db_path, 'w') as f:
            json.dump(self.installers, f, indent=2)
    
    def add_installer(self, name: str, experience_level: str, committed_days: List[str] = None) -> Dict:
        """Add a new installer to the database."""
        installer = {
            'id': len(self.installers) + 1,
            'name': name,
            'experience_level': experience_level,
            'committed_days': committed_days or [],
            'date_added': datetime.now().isoformat(),
            'status': 'active'
        }
        
        self.installers.append(installer)
        self.save_installers()
        return installer
    
    def get_installer(self, installer_id: int) -> Optional[Dict]:
        """Get installer by ID."""
        for installer in self.installers:
            if installer['id'] == installer_id:
                return installer
        return None
    
    def get_installers_by_experience(self, experience_level: str) -> List[Dict]:
        """Get all installers of a specific experience level."""
        return [i for i in self.installers if i['experience_level'] == experience_level and i['status'] == 'active']
    
    def get_all_active_installers(self) -> List[Dict]:
        """Get all active installers."""
        return [i for i in self.installers if i['status'] == 'active']
    
    def update_installer(self, installer_id: int, updates: Dict) -> bool:
        """Update installer information."""
        for i, installer in enumerate(self.installers):
            if installer['id'] == installer_id:
                self.installers[i].update(updates)
                self.save_installers()
                return True
        return False
    
    def remove_installer(self, installer_id: int) -> bool:
        """Mark installer as inactive."""
        return self.update_installer(installer_id, {'status': 'inactive'})


class RevenueTracker:
    """Track revenue commitments and remaining capacity."""
    
    def __init__(self, installer_db: InstallerDatabase):
        self.installer_db = installer_db
        
        # Default revenue ranges by experience level
        self.revenue_ranges = {
            'Beginner': {'worst': 2500, 'base': 3250, 'best': 4000},
            'Intermediate': {'worst': 4000, 'base': 4750, 'best': 5500},
            'Advanced': {'worst': 5500, 'base': 6250, 'best': 7000},
            'Expert': {'worst': 7000, 'base': 7750, 'best': 8500}
        }
        
        # Default per-diem rates
        self.per_diem_rates = {
            'Beginner': 200,
            'Intermediate': 225,
            'Advanced': 275,
            'Expert': 300
        }
    
    def get_installer_revenue_capacity(self, installer: Dict, scenario: str = 'base') -> Dict:
        """Calculate installer's revenue capacity and compensation."""
        experience_level = installer['experience_level']
        committed_days = len(installer.get('committed_days', []))
        
        daily_revenue = self.revenue_ranges[experience_level][scenario]
        total_revenue_capacity = daily_revenue * committed_days
        
        per_diem_rate = self.per_diem_rates[experience_level]
        guaranteed_pay = per_diem_rate * committed_days
        
        # Calculate production bonus (10% base rate)
        production_bonus = total_revenue_capacity * 0.10
        
        # Total potential compensation
        total_compensation = guaranteed_pay + production_bonus
        
        return {
            'daily_revenue': daily_revenue,
            'committed_days': committed_days,
            'total_revenue_capacity': total_revenue_capacity,
            'per_diem_rate': per_diem_rate,
            'guaranteed_pay': guaranteed_pay,
            'production_bonus': production_bonus,
            'total_compensation': total_compensation,
            'effective_hourly_rate': total_compensation / (committed_days * 12) if committed_days > 0 else 0
        }
    
    def calculate_total_committed_revenue(self, scenario: str = 'base') -> Dict:
        """Calculate total committed revenue across all installers."""
        active_installers = self.installer_db.get_all_active_installers()
        
        total_committed = 0
        installer_breakdown = []
        
        for installer in active_installers:
            capacity = self.get_installer_revenue_capacity(installer, scenario)
            total_committed += capacity['total_revenue_capacity']
            
            installer_breakdown.append({
                'installer': installer,
                'capacity': capacity
            })
        
        return {
            'total_committed_revenue': total_committed,
            'installer_count': len(active_installers),
            'installer_breakdown': installer_breakdown
        }
    
    def calculate_remaining_capacity(self, target_revenue: int, scenario: str = 'base') -> Dict:
        """Calculate remaining revenue capacity needed."""
        committed = self.calculate_total_committed_revenue(scenario)
        remaining_revenue = target_revenue - committed['total_committed_revenue']
        
        # Calculate how many more installers needed by experience level
        additional_needed = {}
        for level, ranges in self.revenue_ranges.items():
            daily_capacity = ranges[scenario]
            # Assume 60 working days in season (rough estimate)
            seasonal_capacity = daily_capacity * 60
            additional_needed[level] = max(0, remaining_revenue // seasonal_capacity)
        
        return {
            'target_revenue': target_revenue,
            'committed_revenue': committed['total_committed_revenue'],
            'remaining_revenue': remaining_revenue,
            'percentage_committed': (committed['total_committed_revenue'] / target_revenue * 100) if target_revenue > 0 else 0,
            'additional_installers_needed': additional_needed,
            'current_installers': committed['installer_breakdown']
        }
    
    def get_recruitment_presentation_data(self, experience_level: str, committed_days: int) -> Dict:
        """Generate data for recruitment presentations."""
        scenarios = ['worst', 'base', 'best']
        presentation_data = {
            'experience_level': experience_level,
            'committed_days': committed_days,
            'per_diem_rate': self.per_diem_rates[experience_level],
            'scenarios': {}
        }
        
        for scenario in scenarios:
            daily_revenue = self.revenue_ranges[experience_level][scenario]
            total_revenue = daily_revenue * committed_days
            guaranteed_pay = self.per_diem_rates[experience_level] * committed_days
            production_bonus = total_revenue * 0.10
            total_compensation = guaranteed_pay + production_bonus
            
            presentation_data['scenarios'][scenario] = {
                'daily_revenue_responsibility': daily_revenue,
                'total_revenue_responsibility': total_revenue,
                'guaranteed_pay': guaranteed_pay,
                'production_bonus': production_bonus,
                'total_compensation': total_compensation,
                'effective_hourly_rate': total_compensation / (committed_days * 12) if committed_days > 0 else 0,
                'hours_per_day': 12,
                'total_hours': committed_days * 12
            }
        
        return presentation_data

