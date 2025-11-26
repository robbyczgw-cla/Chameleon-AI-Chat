-- =========================================================================
-- Simple Mode Gamification Tables
-- Features: Pet Companion, Streaks, Achievements, Stats
-- =========================================================================

-- =========================================================================
-- 1. PET COMPANION TABLE
-- Stores user's virtual pet companion
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_type TEXT NOT NULL CHECK (pet_type IN ('chameleon', 'dog', 'cat')),
  pet_name TEXT NOT NULL,
  personality TEXT NOT NULL CHECK (personality IN ('loyal', 'playful', 'lazy', 'curious', 'calm', 'energetic')),
  happiness INTEGER DEFAULT 100 CHECK (happiness >= 0 AND happiness <= 100),
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One pet per user
  UNIQUE(user_id)
);

-- =========================================================================
-- 2. STREAKS TABLE
-- Tracks daily activity streaks
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_days_active INTEGER DEFAULT 0,
  last_active_date DATE,
  -- Store last 7 days activity as array of booleans
  weekly_activity BOOLEAN[] DEFAULT ARRAY[false, false, false, false, false, false, false],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One streak record per user
  UNIQUE(user_id)
);

-- =========================================================================
-- 3. ACHIEVEMENTS TABLE
-- Tracks unlocked achievements and progress
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One record per achievement per user
  UNIQUE(user_id, achievement_id)
);

-- =========================================================================
-- 4. GAMIFICATION SETTINGS TABLE
-- User preferences for gamification features
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_gamification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievements_enabled BOOLEAN DEFAULT TRUE,
  streaks_enabled BOOLEAN DEFAULT TRUE,
  pet_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One settings record per user
  UNIQUE(user_id)
);

-- =========================================================================
-- 5. SIMPLE STATS TABLE
-- Tracks usage statistics for Simple Mode
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_simple_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_messages INTEGER DEFAULT 0,
  total_images INTEGER DEFAULT 0,
  personas_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  creative_corner_uses INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One stats record per user
  UNIQUE(user_id)
);

-- =========================================================================
-- INDEXES for better performance
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_user_pets_user_id ON public.user_pets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_active ON public.user_streaks(last_active_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_settings_user_id ON public.user_gamification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_simple_stats_user_id ON public.user_simple_stats(user_id);

-- =========================================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================================
ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_simple_stats ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS POLICIES FOR USER_PETS
-- =========================================================================
CREATE POLICY "Users can view their own pet" ON public.user_pets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pet" ON public.user_pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pet" ON public.user_pets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pet" ON public.user_pets
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================================
-- RLS POLICIES FOR USER_STREAKS
-- =========================================================================
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own streaks" ON public.user_streaks
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================================
-- RLS POLICIES FOR USER_ACHIEVEMENTS
-- =========================================================================
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own achievements" ON public.user_achievements
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================================
-- RLS POLICIES FOR USER_GAMIFICATION_SETTINGS
-- =========================================================================
CREATE POLICY "Users can view their own gamification settings" ON public.user_gamification_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own gamification settings" ON public.user_gamification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gamification settings" ON public.user_gamification_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gamification settings" ON public.user_gamification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================================
-- RLS POLICIES FOR USER_SIMPLE_STATS
-- =========================================================================
CREATE POLICY "Users can view their own simple stats" ON public.user_simple_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own simple stats" ON public.user_simple_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own simple stats" ON public.user_simple_stats
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own simple stats" ON public.user_simple_stats
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =========================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updated_at
CREATE TRIGGER update_user_pets_updated_at
  BEFORE UPDATE ON public.user_pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
  BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_settings_updated_at
  BEFORE UPDATE ON public.user_gamification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_simple_stats_updated_at
  BEFORE UPDATE ON public.user_simple_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- HELPER FUNCTION: Record daily activity and update streak
-- =========================================================================
CREATE OR REPLACE FUNCTION record_user_activity(p_user_id UUID)
RETURNS public.user_streaks AS $$
DECLARE
  v_streak public.user_streaks;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
BEGIN
  -- Get or create streak record
  INSERT INTO public.user_streaks (user_id, last_active_date, current_streak, total_days_active, weekly_activity)
  VALUES (p_user_id, v_today, 1, 1, ARRAY[true, false, false, false, false, false, false])
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN user_streaks.last_active_date = v_today THEN user_streaks.current_streak
      WHEN user_streaks.last_active_date = v_yesterday THEN user_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE
        WHEN user_streaks.last_active_date = v_today THEN user_streaks.current_streak
        WHEN user_streaks.last_active_date = v_yesterday THEN user_streaks.current_streak + 1
        ELSE 1
      END
    ),
    total_days_active = CASE
      WHEN user_streaks.last_active_date = v_today THEN user_streaks.total_days_active
      ELSE user_streaks.total_days_active + 1
    END,
    last_active_date = v_today,
    weekly_activity = CASE
      WHEN user_streaks.last_active_date = v_today THEN user_streaks.weekly_activity
      ELSE ARRAY[true] || user_streaks.weekly_activity[1:6]
    END,
    updated_at = NOW()
  RETURNING * INTO v_streak;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- HELPER FUNCTION: Unlock achievement
-- =========================================================================
CREATE OR REPLACE FUNCTION unlock_achievement(p_user_id UUID, p_achievement_id TEXT)
RETURNS public.user_achievements AS $$
DECLARE
  v_achievement public.user_achievements;
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
  VALUES (p_user_id, p_achievement_id, NOW())
  ON CONFLICT (user_id, achievement_id) DO UPDATE SET
    unlocked_at = COALESCE(user_achievements.unlocked_at, NOW()),
    updated_at = NOW()
  RETURNING * INTO v_achievement;

  RETURN v_achievement;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- HELPER FUNCTION: Update achievement progress
-- =========================================================================
CREATE OR REPLACE FUNCTION update_achievement_progress(
  p_user_id UUID,
  p_achievement_id TEXT,
  p_progress INTEGER,
  p_max_progress INTEGER DEFAULT NULL
)
RETURNS public.user_achievements AS $$
DECLARE
  v_achievement public.user_achievements;
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_id, progress)
  VALUES (p_user_id, p_achievement_id, p_progress)
  ON CONFLICT (user_id, achievement_id) DO UPDATE SET
    progress = p_progress,
    unlocked_at = CASE
      WHEN p_max_progress IS NOT NULL AND p_progress >= p_max_progress THEN COALESCE(user_achievements.unlocked_at, NOW())
      ELSE user_achievements.unlocked_at
    END,
    updated_at = NOW()
  RETURNING * INTO v_achievement;

  RETURN v_achievement;
END;
$$ LANGUAGE plpgsql;
