# Database Migrations

Run these SQL scripts in order in your Supabase SQL Editor.

## Migration Order

| # | File | Description |
|---|------|-------------|
| 001 | `001-core-schema.sql` | Core database schema - profiles, auth, basic tables |
| 002 | `002-missing-tables.sql` | Additional tables (workout_ratings, etc.) |
| 003 | `003-profile-images.sql` | Avatar and cover photo support |
| 004 | `004-exercises-update.sql` | Add columns to exercises table |
| 005 | `005-comprehensive-exercises.sql` | Insert 100+ exercises with instructions |
| 006 | `006-foods-exercises.sql` | Foods table and exercise enhancements |
| 007 | `007-workout-templates.sql` | Create workout templates tables |
| 008 | `008-workout-templates-update.sql` | Update workout templates structure |
| 009 | `009-comments-schema.sql` | Workout comments feature |
| 010 | `010-social-features.sql` | Social features (notifications, reactions, buddies) |
| 011 | `011-user-goals-columns.sql` | Add missing columns to user_goals |
| 012 | `012-user-goals-constraints.sql` | Fix user_goals check constraints |
| 013 | `013-test-data-david-workout.sql` | (Optional) Test data for David Turner |

## How to Run

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste each file's contents in order
4. Run each script and verify no errors

## Notes

- Run migrations in numerical order
- Each migration is designed to be idempotent (safe to run multiple times)
- Migration 013 is optional test data
