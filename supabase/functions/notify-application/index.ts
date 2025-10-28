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

    const { applicationId } = await req.json();

    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    // Fetch application details with related data
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        student:student_id (
          id,
          email
        ),
        referral:referral_id (
          id,
          job_title,
          company,
          alumnus_id
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Get student profile
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', application.student_id)
      .single();

    // Get alumni details
    const { data: alumni } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', application.referral.alumnus_id)
      .single();

    console.log(`New application from ${studentProfile?.name} for ${application.referral.job_title} at ${application.referral.company}`);
    console.log(`Alumni to notify: ${alumni?.name}`);

    // Here you would integrate with an email service like SendGrid, Resend, etc.
    // For now, we'll just log the notification
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        data: {
          studentName: studentProfile?.name,
          jobTitle: application.referral.job_title,
          company: application.referral.company,
          alumniName: alumni?.name
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in notify-application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
