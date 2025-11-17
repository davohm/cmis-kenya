import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const demoUsers = [
      {
        email: 'admin@cmis.go.ke',
        password: 'Admin@2024',
        full_name: 'John Kamau',
        role: 'SUPER_ADMIN',
        tenant_name: 'State Department for Cooperatives - National HQ'
      },
      {
        email: 'nairobi@cmis.go.ke',
        password: 'County@2024',
        full_name: 'Sarah Wanjiru',
        role: 'COUNTY_ADMIN',
        tenant_name: 'Nairobi County'
      },
      {
        email: 'coop@example.com',
        password: 'Coop@2024',
        full_name: 'Peter Ochieng',
        role: 'COOPERATIVE_ADMIN',
        tenant_name: 'Nairobi County'
      },
      {
        email: 'auditor@example.com',
        password: 'Audit@2024',
        full_name: 'Grace Njeri',
        role: 'AUDITOR',
        tenant_name: 'Nairobi County'
      },
      {
        email: 'trainer@example.com',
        password: 'Train@2024',
        full_name: 'David Mwangi',
        role: 'TRAINER',
        tenant_name: 'State Department for Cooperatives - National HQ'
      },
      {
        email: 'citizen@example.com',
        password: 'Citizen@2024',
        full_name: 'Lucy Akinyi',
        role: 'CITIZEN',
        tenant_name: null
      }
    ];

    const results = [];

    for (const user of demoUsers) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users.find(u => u.email === user.email);

      if (!userExists) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (authError) {
          results.push({ email: user.email, status: 'error', error: authError.message });
          continue;
        }

        const { data: tenantData } = await supabase
          .from('tenants')
          .select('id')
          .eq('name', user.tenant_name || '')
          .maybeSingle();

        await supabase.from('users').insert({
          id: authData.user!.id,
          email: user.email,
          full_name: user.full_name,
          tenant_id: tenantData?.id || null,
        });

        if (tenantData?.id) {
          await supabase.from('user_roles').insert({
            user_id: authData.user!.id,
            tenant_id: tenantData.id,
            role: user.role,
            is_active: true,
          });
        }

        results.push({ email: user.email, status: 'created' });
      } else {
        results.push({ email: user.email, status: 'already_exists' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
