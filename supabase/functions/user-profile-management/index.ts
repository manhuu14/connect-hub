import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, userId, profileData } = await req.json();

    // Ensure user can only access their own profile unless admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = roleData?.role === 'admin';
    const targetUserId = userId || user.id;

    if (targetUserId !== user.id && !isAdmin) {
      throw new Error('Unauthorized to access this profile');
    }

    let result;

    switch (action) {
      case 'get-full-profile':
        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (profileError) throw profileError;

        // Get role
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', targetUserId)
          .single();

        // Get skills
        const { data: skills } = await supabase
          .from('skills')
          .select('*')
          .eq('user_id', targetUserId);

        // Get communities joined
        const { data: communities } = await supabase
          .from('community_members')
          .select(`
            community_id,
            joined_at,
            communities:community_id (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', targetUserId);

        // If alumni, get posted referrals
        let referrals = null;
        if (role?.role === 'alumni') {
          const { data: referralData } = await supabase
            .from('referrals')
            .select('*')
            .eq('alumnus_id', targetUserId)
            .order('created_at', { ascending: false });
          referrals = referralData;
        }

        // If student, get applications
        let applications = null;
        if (role?.role === 'student') {
          const { data: appData } = await supabase
            .from('applications')
            .select(`
              *,
              referral:referral_id (
                job_title,
                company,
                location
              )
            `)
            .eq('student_id', targetUserId)
            .order('created_at', { ascending: false });
          applications = appData;
        }

        result = {
          profile,
          role: role?.role,
          skills: skills || [],
          communities: communities || [],
          referrals,
          applications
        };

        console.log('Full profile retrieved for user:', targetUserId);
        break;

      case 'update-profile':
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);

        if (updateError) throw updateError;

        result = { message: 'Profile updated successfully' };
        console.log('Profile updated for user:', user.id);
        break;

      case 'add-skill':
        const { error: skillError } = await supabase
          .from('skills')
          .insert({
            user_id: user.id,
            skill_name: profileData.skill_name
          });

        if (skillError) throw skillError;

        result = { message: 'Skill added successfully' };
        console.log('Skill added for user:', user.id);
        break;

      case 'remove-skill':
        const { error: removeSkillError } = await supabase
          .from('skills')
          .delete()
          .eq('id', profileData.skill_id)
          .eq('user_id', user.id);

        if (removeSkillError) throw removeSkillError;

        result = { message: 'Skill removed successfully' };
        console.log('Skill removed for user:', user.id);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in user-profile-management:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage.includes('Unauthorized') ? 401 : 400 
      }
    );
  }
});
