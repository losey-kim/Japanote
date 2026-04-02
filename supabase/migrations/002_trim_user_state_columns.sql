-- Japanote: remove Supabase sync columns that are no longer used by the app.
-- Run this after 001_user_state.sql if your project previously synced match/theme UI state.

alter table if exists public.user_state
  drop column if exists match_state,
  drop column if exists theme_mode;
