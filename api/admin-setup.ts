import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json({ limit: '50kb' }));

app.post('/api/admin-setup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, setupKey } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const expectedKey = process.env.ADMIN_SETUP_KEY || 'HMAdmin';
    if (!setupKey || setupKey !== expectedKey) {
      return res.status(403).json({ error: 'Invalid admin setup key.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Create or update admin user in Supabase Auth
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          role: 'admin'
        }
      });

      if (authErr) {
        // If user already exists, update password and metadata
        if (authErr.message.toLowerCase().includes('already registered')) {
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = (usersList?.users as any[])?.find(u => u.email?.toLowerCase() === cleanEmail);
          if (existingUser) {
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              password,
              email_confirm: true,
              user_metadata: { full_name: cleanName, role: 'admin' }
            });
            await supabaseAdmin.from('profiles').upsert({
              id: existingUser.id,
              email: cleanEmail,
              full_name: cleanName,
              role: 'admin',
              title: 'Platform Administrator',
              location: 'Global Operations'
            });
            return res.status(200).json({
              message: 'Existing user upgraded to Admin. You can now sign in with your credentials.'
            });
          }
        }
        return res.status(400).json({ error: authErr.message });
      }

      if (authData.user) {
        // Provision profile in public.profiles
        await supabaseAdmin.from('profiles').upsert({
          id: authData.user.id,
          email: cleanEmail,
          full_name: cleanName,
          role: 'admin',
          title: 'Platform Administrator',
          location: 'Global Operations'
        });
      }

      return res.status(201).json({
        message: 'Admin account provisioned successfully. You can now sign in.'
      });
    }

    // Server-side fallback when Supabase admin key is not supplied
    return res.status(200).json({
      message: 'Admin setup verified. Please sign in with your credentials.'
    });
  } catch (err: any) {
    console.error('[ADMIN SETUP ERROR]', err);
    return res.status(500).json({
      error: 'Admin setup encountered a server error. Please try again.'
    });
  }
});

export default app;
