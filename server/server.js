import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Env
const PORT = process.env.PORT || 10000;
const ORIGIN = process.env.CORS_ORIGIN || '*';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// CORS & JSON
app.use(cors({
  origin: ORIGIN,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));
app.use(express.json());

// Health
app.get('/health', (_req, res) => res.status(200).send('OK'));

// Ping
app.get('/api/ping', (_req, res) => res.status(200).json({ ok: true }));

// Supabase server client (optional)
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// Example POST demonstrating JSON body
app.post('/api/login', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, error: 'email required' });

  // Optionally use supabase admin/server logic here
  // e.g., check or create profile rows via service role

  return res.status(200).json({ ok: true, received: { email } });
});

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on ${PORT}`);
  console.log(`CORS Origin: ${ORIGIN}`);
});
