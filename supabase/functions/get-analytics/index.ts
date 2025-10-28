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

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = roleData?.role === 'admin';

    // Get total counts
    const [
      { count: totalUsers },
      { count: totalCommunities },
      { count: totalPosts },
      { count: totalReferrals },
      { count: totalApplications }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('communities').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('referrals').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true })
    ]);

    // Get role distribution
    const { data: roleDistribution } = await supabase
      .from('user_roles')
      .select('role');

    const roleCounts = {
      student: 0,
      alumni: 0,
      admin: 0
    };

    roleDistribution?.forEach(r => {
      roleCounts[r.role as keyof typeof roleCounts]++;
    });

    // Get recent activity (posts created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: recentApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get top communities by member count
    const { data: communities } = await supabase
      .from('communities')
      .select('id, name, slug');

    const communitiesWithMembers = await Promise.all(
      (communities || []).map(async (community) => {
        const { count } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', community.id);

        return {
          ...community,
          memberCount: count || 0
        };
      })
    );

    const topCommunities = communitiesWithMembers
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 5);

    const analytics = {
      overview: {
        totalUsers: totalUsers || 0,
        totalCommunities: totalCommunities || 0,
        totalPosts: totalPosts || 0,
        totalReferrals: totalReferrals || 0,
        totalApplications: totalApplications || 0
      },
      roleDistribution: roleCounts,
      recentActivity: {
        postsLastWeek: recentPosts || 0,
        applicationsLastWeek: recentApplications || 0
      },
      topCommunities: topCommunities,
      isAdmin: isAdmin
    };

    console.log('Analytics generated for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: analytics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in get-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage === 'Unauthorized' ? 401 : 400 
      }
    );
  }
});
