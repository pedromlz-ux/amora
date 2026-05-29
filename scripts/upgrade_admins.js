const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://gifztywicarguetvtukt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnp0eXdpY2FyZ3VldHZ0dWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ2NjgzNSwiZXhwIjoyMDk1MDQyODM1fQ._faMg9nmzwqeUbYxmOpaorkhSaBI1aQwUgg7r8PdMSY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function upgradeUsers() {
  const emails = ['pedromlzaparoli@gmail.com', 'gabimb0506@gmail.com'];
  
  console.log("Listing users from auth.admin...");
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth error:", authError);
    return;
  }

  for (const email of emails) {
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.error(`User with email ${email} not found.`);
      continue;
    }

    console.log(`Found user ${email} with ID: ${user.id}. Upgrading to 'admin'...`);
    
    // Check if record exists
    const { data: usageRecord } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (usageRecord) {
      const { error: updateError } = await supabase
        .from('user_usage')
        .update({ plan: 'admin', questions_count: 0 })
        .eq('user_id', user.id);
      if (updateError) {
        console.error(`Error updating plan for ${email}:`, updateError);
      } else {
        console.log(`Successfully upgraded ${email} to 'admin' (existing record)!`);
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_usage')
        .insert({ user_id: user.id, plan: 'admin', questions_count: 0 });
      if (insertError) {
        console.error(`Error inserting plan for ${email}:`, insertError);
      } else {
        console.log(`Successfully upgraded ${email} to 'admin' (new record)!`);
      }
    }
  }
}

upgradeUsers();
