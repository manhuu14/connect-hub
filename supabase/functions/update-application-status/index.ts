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

    const { applicationId, status } = await req.json();

    if (!applicationId || !status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: applicationId, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid status. Must be: pending, accepted, or rejected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating application status:', applicationId, 'to', status);

    // Get application and verify user owns the referral
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select('*, referrals!inner(alumnus_id)')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('Error fetching application:', appError);
      return new Response(
        JSON.stringify({ success: false, error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the authenticated user is the alumnus who posted the referral
    if (application.referrals.alumnus_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'You can only update applications for your own referrals' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the application status (RLS will enforce alumni can update their referral applications)
    const { data: updatedApp, error: updateError } = await supabaseClient
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      throw updateError;
    }

    console.log('Application status updated successfully');

    return new Response(
      JSON.stringify({ success: true, data: updatedApp }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-application-status function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
