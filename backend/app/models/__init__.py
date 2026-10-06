"""Models package init — imports all models so Base.metadata is complete."""
from .core import User, Profile, Conversation, Message, AIRecommendation, DeviceToken
from .fitness import Exercise, Workout, WorkoutExercise, WorkoutSet, PersonalRecord
from .nutrition import Meal, MealItem, HydrationEntry
from .wellness import SleepEntry, MoodEntry, Habit, HabitCompletion
from .goals import Goal, GoalMilestone
from .school import SchoolClass, Assignment, StudySession
from .notes import Note
from .finance import FinanceEntry, SavingsGoal
from .gamification import XPEvent, Achievement, UserAchievement, WeeklyReview
from .reminders import Reminder

__all__ = [
    "User",
    "Profile",
    "Conversation",
    "Message",
    "AIRecommendation",
    "DeviceToken",
    "Exercise",
    "Workout",
    "WorkoutExercise",
    "WorkoutSet",
    "PersonalRecord",
    "Meal",
    "MealItem",
    "HydrationEntry",
    "SleepEntry",
    "MoodEntry",
    "Habit",
    "HabitCompletion",
    "Goal",
    "GoalMilestone",
    "SchoolClass",
    "Assignment",
    "StudySession",
    "Note",
    "FinanceEntry",
    "SavingsGoal",
    "XPEvent",
    "Achievement",
    "UserAchievement",
    "WeeklyReview",
    "Reminder",
]
