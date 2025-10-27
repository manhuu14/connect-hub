-- Create applications table for students to apply to opportunities
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT NOT NULL,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, referral_id)
);

-- Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for applications
CREATE POLICY "Students can create applications"
ON public.applications FOR INSERT
WITH CHECK (auth.uid() = student_id AND has_role(auth.uid(), 'student'));

CREATE POLICY "Students can view their own applications"
ON public.applications FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Alumni can view applications to their referrals"
ON public.applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referrals.id = applications.referral_id
    AND referrals.alumnus_id = auth.uid()
  )
);

CREATE POLICY "Alumni can update application status"
ON public.applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referrals.id = applications.referral_id
    AND referrals.alumnus_id = auth.uid()
  )
);

-- Add trigger for applications updated_at
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Update community_members policies to allow everyone to join
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
CREATE POLICY "Authenticated users can join communities"
ON public.community_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update posts policies to work with communities
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Community members can view posts"
ON public.posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = posts.community_id
    AND community_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Community members can create posts"
ON public.posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = posts.community_id
    AND community_members.user_id = auth.uid()
  )
);

-- Update comments policies for community posts
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Community members can view comments"
ON public.comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    JOIN public.community_members ON community_members.community_id = posts.community_id
    WHERE posts.id = comments.post_id
    AND community_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Community members can create comments"
ON public.comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.posts
    JOIN public.community_members ON community_members.community_id = posts.community_id
    WHERE posts.id = comments.post_id
    AND community_members.user_id = auth.uid()
  )
);