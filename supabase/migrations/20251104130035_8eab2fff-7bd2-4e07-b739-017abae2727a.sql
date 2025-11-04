-- Create required extension for UUID generation
create extension if not exists pgcrypto;

-- 1) Roles enum aligned with app usage
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'alumni', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Profiles table (public)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles RLS policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3) User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check roles (SECURITY DEFINER to bypass RLS safely)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS: users can view their own roles; admins can view all
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Disallow direct insert/update/delete from clients to prevent elevation
-- (no policies created for those -> blocked). Inserts happen via trigger below.

-- 4) Communities and membership
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Anyone can view communities
DROP POLICY IF EXISTS "Communities are public" ON public.communities;
CREATE POLICY "Communities are public"
ON public.communities FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Allow selecting all for counts and visibility
DROP POLICY IF EXISTS "Anyone can view membership" ON public.community_members;
CREATE POLICY "Anyone can view membership"
ON public.community_members FOR SELECT USING (true);

-- Allow users to join themselves
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Users can join communities"
ON public.community_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5) Posts and comments
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Only community members can view posts
DROP POLICY IF EXISTS "Members can view posts" ON public.posts;
CREATE POLICY "Members can view posts"
ON public.posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_members m
    WHERE m.community_id = posts.community_id AND m.user_id = auth.uid()
  )
);

-- Members can create posts they author
DROP POLICY IF EXISTS "Members can create posts" ON public.posts;
CREATE POLICY "Members can create posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.community_members m
    WHERE m.community_id = posts.community_id AND m.user_id = auth.uid()
  )
);

-- Authors can update/delete their posts
DROP POLICY IF EXISTS "Authors can update posts" ON public.posts;
CREATE POLICY "Authors can update posts"
ON public.posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete posts" ON public.posts;
CREATE POLICY "Authors can delete posts"
ON public.posts FOR DELETE
TO authenticated
USING (author_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Members can view comments via membership of the post's community
DROP POLICY IF EXISTS "Members can view comments" ON public.comments;
CREATE POLICY "Members can view comments"
ON public.comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.community_members m ON m.community_id = p.community_id
    WHERE p.id = comments.post_id AND m.user_id = auth.uid()
  )
);

-- Members can create comments
DROP POLICY IF EXISTS "Members can create comments" ON public.comments;
CREATE POLICY "Members can create comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.community_members m ON m.community_id = p.community_id
    WHERE p.id = comments.post_id AND m.user_id = auth.uid()
  )
);

-- 6) Referrals and applications
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumnus_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  referral_link text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Anyone can view open referrals
DROP POLICY IF EXISTS "Anyone can view referrals" ON public.referrals;
CREATE POLICY "Anyone can view referrals"
ON public.referrals FOR SELECT USING (true);

-- Only alumni can create referrals for themselves
DROP POLICY IF EXISTS "Alumni can create referrals" ON public.referrals;
CREATE POLICY "Alumni can create referrals"
ON public.referrals FOR INSERT
TO authenticated
WITH CHECK (alumnus_id = auth.uid() AND public.has_role(auth.uid(), 'alumni'));

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referral_id, student_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Students can view their own applications
DROP POLICY IF EXISTS "Students can view own applications" ON public.applications;
CREATE POLICY "Students can view own applications"
ON public.applications FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can create own applications
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;
CREATE POLICY "Students can create applications"
ON public.applications FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- 7) Skills
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Users can view their own skills; admins can view all
DROP POLICY IF EXISTS "Users can view own skills" ON public.skills;
CREATE POLICY "Users can view own skills"
ON public.skills FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Users can manage their own skills
DROP POLICY IF EXISTS "Users can manage own skills" ON public.skills;
CREATE POLICY "Users can manage own skills"
ON public.skills FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own skills" ON public.skills;
CREATE POLICY "Users can delete own skills"
ON public.skills FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 8) On new auth user -> create profile and default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role_text text;
  _role public.app_role;
  _name text;
BEGIN
  _name := COALESCE(new.raw_user_meta_data->>'name', '');
  _role_text := COALESCE(new.raw_user_meta_data->>'role', 'student');
  -- Safely cast to enum, defaulting to 'student' when invalid
  BEGIN
    _role := _role_text::public.app_role;
  EXCEPTION WHEN others THEN
    _role := 'student';
  END;

  INSERT INTO public.profiles (id, name)
  VALUES (new.id, _name)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9) Seed a couple of communities for testing
INSERT INTO public.communities (name, description, slug)
VALUES 
  ('Tech Talks', 'Discuss the latest in technology and development', 'tech-talks'),
  ('Career Growth', 'Share tips and opportunities for advancing your career', 'career-growth')
ON CONFLICT (slug) DO NOTHING;
