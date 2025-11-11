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

    // CRITICAL: Check if user is admin using the has_role function
    const { data: isAdmin, error: roleCheckError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleCheckError) {
      console.error('Error checking admin role:', roleCheckError);
      throw roleCheckError;
    }

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Only admins can manage user roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { targetUserId, newRole } = await req.json();

    if (!targetUserId || !newRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: targetUserId, newRole' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validRoles = ['student', 'alumni', 'admin'];
    if (!validRoles.includes(newRole)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid role. Must be: student, alumni, or admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin changing user role:', targetUserId, 'to', newRole);

    // Get existing role
    const { data: existingRole, error: fetchError } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing role:', fetchError);
      throw fetchError;
    }

    if (existingRole) {
      // Update existing role
      const { data: updatedRole, error: updateError } = await supabaseClient
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating role:', updateError);
        throw updateError;
      }

      console.log('User role updated successfully');

      return new Response(
        JSON.stringify({ success: true, data: updatedRole }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Insert new role
      const { data: newRoleData, error: insertError } = await supabaseClient
        .from('user_roles')
        .insert({ user_id: targetUserId, role: newRole })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting role:', insertError);
        throw insertError;
      }

      console.log('User role created successfully');

      return new Response(
        JSON.stringify({ success: true, data: newRoleData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in manage-user-role function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
