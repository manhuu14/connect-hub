import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Since verify_jwt = true in config, the JWT is already verified by Supabase
    // We just need to create a client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { searchQuery } = await req.json();

    console.log('Searching alumni with query:', searchQuery);

    // Get alumni user IDs
    const { data: alumniRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'alumni');

    if (rolesError) {
      console.error('Error fetching alumni roles:', rolesError);
      throw rolesError;
    }

    const alumniIds = alumniRoles?.map(r => r.user_id) || [];

    if (alumniIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search profiles
    let query = supabaseClient
      .from('profiles')
      .select('id, name, bio, title, profile_pic_url, github_url, linkedin_url')
      .in('id', alumniIds);

    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery}%`;
      query = query.or(`name.ilike.${searchTerm},title.ilike.${searchTerm},bio.ilike.${searchTerm}`);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Get skills for each profile
    const profilesWithSkills = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: skills } = await supabaseClient
          .from('skills')
          .select('skill_name')
          .eq('user_id', profile.id);

        return {
          ...profile,
          skills: skills?.map(s => s.skill_name) || [],
        };
      })
    );

    // Filter by skills if searchQuery exists
    let results = profilesWithSkills;
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      results = profilesWithSkills.filter(profile => 
        profile.skills.some(skill => skill.toLowerCase().includes(searchTerm)) ||
        profile.name?.toLowerCase().includes(searchTerm) ||
        profile.title?.toLowerCase().includes(searchTerm) ||
        profile.bio?.toLowerCase().includes(searchTerm)
      );
    }

    console.log('Found alumni:', results.length);

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-alumni function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
