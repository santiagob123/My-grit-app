-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  goal_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create habits table
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  frequency TEXT DEFAULT 'daily', -- daily, weekly
  category TEXT,
  reminder_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create completions table to track when a habit is finished
CREATE TABLE completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completed_at DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, completed_at)
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Habits Policies
CREATE POLICY "Users can view their own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- Completions Policies
CREATE POLICY "Users can view their own completions" ON completions FOR SELECT 
USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = completions.habit_id AND habits.user_id = auth.uid()));

CREATE POLICY "Users can insert their own completions" ON completions FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM habits WHERE habits.id = completions.habit_id AND habits.user_id = auth.uid()));

CREATE POLICY "Users can delete their own completions" ON completions FOR DELETE 
USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = completions.habit_id AND habits.user_id = auth.uid()));

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'report', -- report, achievement, general
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_hypes table (reactions)
CREATE TABLE post_hypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- RLS for Social
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hypes ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Hypes Policies
CREATE POLICY "Anyone can view hypes" ON post_hypes FOR SELECT USING (true);
CREATE POLICY "Users can toggle hypes" ON post_hypes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their hypes" ON post_hypes FOR DELETE USING (auth.uid() = user_id);
