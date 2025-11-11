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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { communityId } = await req.json();

    if (!communityId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: communityId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching community feed for:', communityId);

    // Verify user is a member of the community
    const { data: membership, error: memberError } = await supabaseClient
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ success: false, error: 'You must be a member of this community to view posts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch posts with author info (RLS will enforce community membership)
    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          name,
          profile_pic_url
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      throw postsError;
    }

    // Get likes and comments counts for each post
    const postsWithMetrics = await Promise.all(
      (posts || []).map(async (post) => {
        // Get likes count
        const { count: likesCount } = await supabaseClient
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Get comments count
        const { count: commentsCount } = await supabaseClient
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Check if current user liked the post
        const { data: userLike } = await supabaseClient
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          user_has_liked: !!userLike,
        };
      })
    );

    console.log('Found posts:', postsWithMetrics.length);

    return new Response(
      JSON.stringify({ success: true, data: postsWithMetrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-community-feed function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
