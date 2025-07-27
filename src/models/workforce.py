"""
Workforce Planning Data Models
"""
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
import pandas as pd
import numpy as np

@dataclass
class SeasonConfig:
    """Configuration for seasonal periods"""
    name: str
    start_date: date
    end_date: date
    working_days_per_week: float
    production_eligible: bool

@dataclass
class ExperienceLevel:
    """Installer experience level configuration"""
    name: str
    per_diem_rate: float
    revenue_range_min: float
    revenue_range_max: float
    revenue_range_base: float

@dataclass
class SlidingScaleConfig:
    """Configuration for production bonus sliding scale"""
    base_percentage: float = 0.10
    max_percentage: float = 0.15
    thresholds: List[Tuple[float, float]] = None  # (revenue_threshold, bonus_percentage)

@dataclass
class LaborCostConfig:
    """Labor cost configuration"""
    total_labor_percentage: float = 0.20
    junior_hourly_rate_min: float = 18.0
    junior_hourly_rate_max: float = 25.0
    hours_per_day: float = 12.0
    payroll_tax_rate: float = 0.15  # Estimated for taxes, workers comp, etc.

@dataclass
class CrewComposition:
    """Crew composition for capacity planning"""
    beginner_crews: int = 0
    intermediate_crews: int = 0
    advanced_crews: int = 0
    expert_crews: int = 0

@dataclass
class RevenueScenario:
    """Revenue scenario configuration"""
    name: str
    total_revenue: float
    description: str

class WorkforceModel:
    """Main workforce planning model"""
    
    def __init__(self):
        # Default configurations
        self.seasons = self._default_seasons()
        self.experience_levels = self._default_experience_levels()
        self.sliding_scale = self._default_sliding_scale()
        self.labor_config = LaborCostConfig()
        self.revenue_scenarios = self._default_revenue_scenarios()
        
    def _default_seasons(self) -> Dict[str, SeasonConfig]:
        """Default seasonal configuration"""
        return {
            'pre_season': SeasonConfig(
                name='Pre-Season',
                start_date=date(2025, 8, 18),
                end_date=date(2025, 9, 28),
                working_days_per_week=5.0,
                production_eligible=False
            ),
            'in_season': SeasonConfig(
                name='In-Season',
                start_date=date(2025, 9, 29),
                end_date=date(2025, 12, 7),
                working_days_per_week=6.0,
                production_eligible=True
            ),
            'post_season': SeasonConfig(
                name='Post-Season',
                start_date=date(2025, 12, 8),
                end_date=date(2026, 2, 1),
                working_days_per_week=5.0,
                production_eligible=False
            ),
            'off_season': SeasonConfig(
                name='Off-Season',
                start_date=date(2026, 2, 2),
                end_date=date(2026, 3, 1),
                working_days_per_week=4.0,
                production_eligible=False
            )
        }
    
    def _default_experience_levels(self) -> Dict[str, ExperienceLevel]:
        """Default experience level configuration"""
        return {
            'beginner': ExperienceLevel(
                name='Beginner',
                per_diem_rate=200.0,
                revenue_range_min=2500.0,
                revenue_range_max=4000.0,
                revenue_range_base=3250.0
            ),
            'intermediate': ExperienceLevel(
                name='Intermediate',
                per_diem_rate=225.0,
                revenue_range_min=4000.0,
                revenue_range_max=5500.0,
                revenue_range_base=4750.0
            ),
            'advanced': ExperienceLevel(
                name='Advanced',
                per_diem_rate=275.0,
                revenue_range_min=5500.0,
                revenue_range_max=7000.0,
                revenue_range_base=6250.0
            ),
            'expert': ExperienceLevel(
                name='Expert',
                per_diem_rate=300.0,
                revenue_range_min=7000.0,
                revenue_range_max=8500.0,
                revenue_range_base=7750.0
            )
        }
    
    def _default_sliding_scale(self) -> SlidingScaleConfig:
        """Default sliding scale configuration"""
        # Based on daily revenue performance relative to base
        return SlidingScaleConfig(
            base_percentage=0.10,
            max_percentage=0.15,
            thresholds=[
                (1.0, 0.10),   # Base performance = 10%
                (1.1, 0.11),   # 110% of base = 11%
                (1.2, 0.12),   # 120% of base = 12%
                (1.3, 0.13),   # 130% of base = 13%
                (1.4, 0.14),   # 140% of base = 14%
                (1.5, 0.15),   # 150%+ of base = 15%
            ]
        )
    
    def _default_revenue_scenarios(self) -> Dict[str, RevenueScenario]:
        """Default revenue scenarios"""
        return {
            'worst_case': RevenueScenario(
                name='Worst Case',
                total_revenue=1200000.0,
                description='Conservative scenario with market challenges'
            ),
            'base_case': RevenueScenario(
                name='Base Case',
                total_revenue=1500000.0,
                description='Expected performance scenario'
            ),
            'best_case': RevenueScenario(
                name='Best Case',
                total_revenue=1800000.0,
                description='Optimistic scenario with strong market conditions'
            )
        }
    
    def calculate_season_working_days(self, season_config: SeasonConfig) -> int:
        """Calculate total working days for a season"""
        total_days = (season_config.end_date - season_config.start_date).days + 1
        total_weeks = total_days / 7
        return int(total_weeks * season_config.working_days_per_week)
    
    def calculate_crew_leader_compensation(self, 
                                         experience_level: str,
                                         scenario: str,
                                         performance_multiplier: float = 1.0) -> Dict:
        """Calculate compensation for a crew leader"""
        exp_config = self.experience_levels[experience_level]
        revenue_scenario = self.revenue_scenarios[scenario]
        
        # Calculate seasonal breakdown
        total_working_days = 0
        seasonal_breakdown = {}
        
        for season_name, season_config in self.seasons.items():
            working_days = self.calculate_season_working_days(season_config)
            total_working_days += working_days
            
            seasonal_breakdown[season_name] = {
                'working_days': working_days,
                'per_diem_total': working_days * exp_config.per_diem_rate,
                'production_eligible': season_config.production_eligible
            }
        
        # Calculate revenue attribution based on scenario
        if scenario == 'worst_case':
            daily_revenue = exp_config.revenue_range_min * performance_multiplier
        elif scenario == 'base_case':
            daily_revenue = exp_config.revenue_range_base * performance_multiplier
        else:  # best_case
            daily_revenue = exp_config.revenue_range_max * performance_multiplier
        
        # Only in-season gets production revenue
        in_season_days = seasonal_breakdown['in_season']['working_days']
        total_production_revenue = daily_revenue * in_season_days
        
        # Calculate sliding scale bonus percentage
        performance_ratio = daily_revenue / exp_config.revenue_range_base
        bonus_percentage = self._calculate_sliding_scale_percentage(performance_ratio)
        
        # Calculate production bonus
        production_bonus = total_production_revenue * bonus_percentage
        
        # Calculate total compensation
        total_per_diem = sum(s['per_diem_total'] for s in seasonal_breakdown.values())
        
        # Bonus is only paid if production exceeds per-diem
        bonus_payment = max(0, production_bonus - total_per_diem)
        total_compensation = total_per_diem + bonus_payment
        
        # Calculate implicit hourly rate
        implicit_hourly = total_compensation / (total_working_days * self.labor_config.hours_per_day)
        
        return {
            'experience_level': experience_level,
            'scenario': scenario,
            'performance_multiplier': performance_multiplier,
            'daily_revenue': daily_revenue,
            'total_working_days': total_working_days,
            'total_per_diem': total_per_diem,
            'total_production_revenue': total_production_revenue,
            'bonus_percentage': bonus_percentage,
            'production_bonus': production_bonus,
            'bonus_payment': bonus_payment,
            'total_compensation': total_compensation,
            'implicit_hourly_rate': implicit_hourly,
            'seasonal_breakdown': seasonal_breakdown
        }
    
    def _calculate_sliding_scale_percentage(self, performance_ratio: float) -> float:
        """Calculate bonus percentage based on performance ratio"""
        for threshold, percentage in reversed(self.sliding_scale.thresholds):
            if performance_ratio >= threshold:
                return percentage
        return self.sliding_scale.base_percentage
    
    def calculate_crew_capacity(self, crew_composition: CrewComposition, scenario: str) -> Dict:
        """Calculate total capacity for a crew composition"""
        total_crews = (crew_composition.beginner_crews + 
                      crew_composition.intermediate_crews + 
                      crew_composition.advanced_crews + 
                      crew_composition.expert_crews)
        
        if total_crews == 0:
            return {'error': 'No crews specified'}
        
        # Calculate capacity for each experience level
        capacity_data = {}
        total_daily_capacity = 0
        total_labor_cost = 0
        
        for exp_level, crew_count in [
            ('beginner', crew_composition.beginner_crews),
            ('intermediate', crew_composition.intermediate_crews),
            ('advanced', crew_composition.advanced_crews),
            ('expert', crew_composition.expert_crews)
        ]:
            if crew_count > 0:
                crew_data = self.calculate_crew_leader_compensation(exp_level, scenario)
                daily_capacity = crew_data['daily_revenue'] * crew_count
                total_daily_capacity += daily_capacity
                
                # Add junior installer costs
                junior_cost_per_crew = (self.labor_config.junior_hourly_rate_min * 
                                      self.labor_config.hours_per_day)
                total_junior_cost = junior_cost_per_crew * crew_count
                
                capacity_data[exp_level] = {
                    'crew_count': crew_count,
                    'daily_revenue_per_crew': crew_data['daily_revenue'],
                    'total_daily_revenue': daily_capacity,
                    'crew_leader_compensation': crew_data['total_compensation'],
                    'junior_installer_cost': total_junior_cost,
                    'total_crew_cost': crew_data['total_compensation'] + total_junior_cost
                }
                
                total_labor_cost += capacity_data[exp_level]['total_crew_cost']
        
        # Calculate seasonal totals
        in_season_days = self.calculate_season_working_days(self.seasons['in_season'])
        total_seasonal_revenue = total_daily_capacity * in_season_days
        
        return {
            'scenario': scenario,
            'total_crews': total_crews,
            'total_daily_capacity': total_daily_capacity,
            'total_seasonal_revenue': total_seasonal_revenue,
            'total_labor_cost': total_labor_cost,
            'labor_percentage': (total_labor_cost / total_seasonal_revenue * 100) if total_seasonal_revenue > 0 else 0,
            'capacity_by_level': capacity_data,
            'in_season_days': in_season_days
        }
    
    def recommend_crew_composition(self, target_revenue: float, scenario: str) -> Dict:
        """Recommend optimal crew composition for target revenue"""
        in_season_days = self.calculate_season_working_days(self.seasons['in_season'])
        required_daily_revenue = target_revenue / in_season_days
        
        recommendations = []
        
        # Try different compositions prioritizing higher experience levels
        for expert_ratio in [0.4, 0.3, 0.2, 0.1, 0.0]:
            for advanced_ratio in [0.3, 0.4, 0.3, 0.2, 0.1]:
                remaining_ratio = 1.0 - expert_ratio - advanced_ratio
                if remaining_ratio < 0:
                    continue
                
                intermediate_ratio = min(remaining_ratio, 0.4)
                beginner_ratio = remaining_ratio - intermediate_ratio
                
                if beginner_ratio < 0:
                    continue
                
                # Calculate required crews
                # Start with expert crews and work down
                expert_daily_revenue = self.experience_levels['expert'].revenue_range_base
                advanced_daily_revenue = self.experience_levels['advanced'].revenue_range_base
                intermediate_daily_revenue = self.experience_levels['intermediate'].revenue_range_base
                beginner_daily_revenue = self.experience_levels['beginner'].revenue_range_base
                
                # Estimate total crews needed
                estimated_crews = max(1, int(required_daily_revenue / 
                    (expert_ratio * expert_daily_revenue + 
                     advanced_ratio * advanced_daily_revenue + 
                     intermediate_ratio * intermediate_daily_revenue + 
                     beginner_ratio * beginner_daily_revenue)))
                
                expert_crews = int(estimated_crews * expert_ratio)
                advanced_crews = int(estimated_crews * advanced_ratio)
                intermediate_crews = int(estimated_crews * intermediate_ratio)
                beginner_crews = estimated_crews - expert_crews - advanced_crews - intermediate_crews
                
                composition = CrewComposition(
                    expert_crews=expert_crews,
                    advanced_crews=advanced_crews,
                    intermediate_crews=intermediate_crews,
                    beginner_crews=beginner_crews
                )
                
                capacity = self.calculate_crew_capacity(composition, scenario)
                
                if 'error' not in capacity:
                    revenue_gap = abs(capacity['total_seasonal_revenue'] - target_revenue)
                    revenue_gap_pct = revenue_gap / target_revenue * 100
                    
                    recommendations.append({
                        'composition': composition,
                        'capacity': capacity,
                        'revenue_gap': revenue_gap,
                        'revenue_gap_pct': revenue_gap_pct,
                        'efficiency_score': (capacity['total_seasonal_revenue'] / capacity['total_labor_cost']) if capacity['total_labor_cost'] > 0 else 0
                    })
        
        # Sort by revenue gap and efficiency
        recommendations.sort(key=lambda x: (x['revenue_gap_pct'], -x['efficiency_score']))
        
        return {
            'target_revenue': target_revenue,
            'scenario': scenario,
            'recommendations': recommendations[:5]  # Top 5 recommendations
        }
    
    def calculate_break_even_analysis(self, experience_level: str) -> Dict:
        """Calculate break-even analysis for an installer"""
        exp_config = self.experience_levels[experience_level]
        
        # Calculate total per-diem for the season
        total_working_days = sum(
            self.calculate_season_working_days(season) 
            for season in self.seasons.values()
        )
        total_per_diem = total_working_days * exp_config.per_diem_rate
        
        # Break-even is when production bonus equals per-diem
        # production_bonus = revenue * bonus_percentage
        # break_even when: revenue * 0.10 = total_per_diem
        break_even_revenue = total_per_diem / self.sliding_scale.base_percentage
        
        in_season_days = self.calculate_season_working_days(self.seasons['in_season'])
        break_even_daily_revenue = break_even_revenue / in_season_days
        
        return {
            'experience_level': experience_level,
            'total_per_diem': total_per_diem,
            'break_even_revenue': break_even_revenue,
            'break_even_daily_revenue': break_even_daily_revenue,
            'in_season_days': in_season_days,
            'base_bonus_percentage': self.sliding_scale.base_percentage
        }
    
    def export_configuration(self) -> Dict:
        """Export current configuration for frontend"""
        return {
            'seasons': {k: asdict(v) for k, v in self.seasons.items()},
            'experience_levels': {k: asdict(v) for k, v in self.experience_levels.items()},
            'sliding_scale': asdict(self.sliding_scale),
            'labor_config': asdict(self.labor_config),
            'revenue_scenarios': {k: asdict(v) for k, v in self.revenue_scenarios.items()}
        }
    
    def update_configuration(self, config_data: Dict):
        """Update configuration from frontend data"""
        if 'seasons' in config_data:
            for season_name, season_data in config_data['seasons'].items():
                if season_name in self.seasons:
                    # Convert date strings back to date objects
                    if isinstance(season_data['start_date'], str):
                        season_data['start_date'] = datetime.strptime(season_data['start_date'], '%Y-%m-%d').date()
                    if isinstance(season_data['end_date'], str):
                        season_data['end_date'] = datetime.strptime(season_data['end_date'], '%Y-%m-%d').date()
                    
                    self.seasons[season_name] = SeasonConfig(**season_data)
        
        if 'experience_levels' in config_data:
            for level_name, level_data in config_data['experience_levels'].items():
                if level_name in self.experience_levels:
                    self.experience_levels[level_name] = ExperienceLevel(**level_data)
        
        if 'sliding_scale' in config_data:
            self.sliding_scale = SlidingScaleConfig(**config_data['sliding_scale'])
        
        if 'labor_config' in config_data:
            self.labor_config = LaborCostConfig(**config_data['labor_config'])
        
        if 'revenue_scenarios' in config_data:
            for scenario_name, scenario_data in config_data['revenue_scenarios'].items():
                if scenario_name in self.revenue_scenarios:
                    self.revenue_scenarios[scenario_name] = RevenueScenario(**scenario_data)

