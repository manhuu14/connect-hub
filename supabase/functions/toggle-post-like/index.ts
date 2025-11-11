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

    const { postId } = await req.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required field: postId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Toggling like for post:', postId);

    // Check if like exists
    const { data: existingLike, error: likeError } = await supabaseClient
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (likeError) {
      console.error('Error checking existing like:', likeError);
      throw likeError;
    }

    if (existingLike) {
      // Unlike - delete the like
      const { error: deleteError } = await supabaseClient
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error deleting like:', deleteError);
        throw deleteError;
      }

      console.log('Post unliked successfully');

      return new Response(
        JSON.stringify({ success: true, action: 'unliked', liked: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Like - insert new like
      const { data: newLike, error: insertError } = await supabaseClient
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating like:', insertError);
        throw insertError;
      }

      console.log('Post liked successfully');

      return new Response(
        JSON.stringify({ success: true, action: 'liked', liked: true, data: newLike }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in toggle-post-like function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
