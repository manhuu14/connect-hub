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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user is authenticated and admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { action, communityData } = await req.json();

    let result;

    switch (action) {
      case 'create':
        const { data: newCommunity, error: createError } = await supabase
          .from('communities')
          .insert({
            name: communityData.name,
            description: communityData.description,
            slug: communityData.slug || communityData.name.toLowerCase().replace(/\s+/g, '-')
          })
          .select()
          .single();

        if (createError) throw createError;
        result = { community: newCommunity, message: 'Community created successfully' };
        console.log('Community created:', newCommunity.name);
        break;

      case 'update':
        const { data: updatedCommunity, error: updateError } = await supabase
          .from('communities')
          .update({
            name: communityData.name,
            description: communityData.description,
            slug: communityData.slug
          })
          .eq('id', communityData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = { community: updatedCommunity, message: 'Community updated successfully' };
        console.log('Community updated:', updatedCommunity.name);
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('communities')
          .delete()
          .eq('id', communityData.id);

        if (deleteError) throw deleteError;
        result = { message: 'Community deleted successfully' };
        console.log('Community deleted:', communityData.id);
        break;

      case 'get-stats':
        const { data: community } = await supabase
          .from('communities')
          .select('*')
          .eq('id', communityData.id)
          .single();

        const { count: memberCount } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityData.id);

        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityData.id);

        result = {
          community,
          stats: {
            members: memberCount || 0,
            posts: postCount || 0
          }
        };
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
    console.error('Error in manage-community:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errorMessage.includes('Unauthorized') || errorMessage.includes('Admin') ? 403 : 400 
      }
    );
  }
});
