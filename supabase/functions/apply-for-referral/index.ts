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

    // Verify user is a student
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'student')
      .maybeSingle();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only students can apply for referrals' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { referralId, message, resumeUrl } = await req.json();

    if (!referralId || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: referralId, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating application for referral:', referralId);

    // Check if user already applied
    const { data: existingApp } = await supabaseClient
      .from('applications')
      .select('id')
      .eq('student_id', user.id)
      .eq('referral_id', referralId)
      .maybeSingle();

    if (existingApp) {
      return new Response(
        JSON.stringify({ success: false, error: 'You have already applied for this referral' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create application (RLS will enforce student_id = auth.uid())
    const { data: application, error: insertError } = await supabaseClient
      .from('applications')
      .insert({
        student_id: user.id,
        referral_id: referralId,
        message: message,
        resume_url: resumeUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application:', insertError);
      throw insertError;
    }

    console.log('Application created successfully:', application.id);

    return new Response(
      JSON.stringify({ success: true, data: application }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in apply-for-referral function:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
