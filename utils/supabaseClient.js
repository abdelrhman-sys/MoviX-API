import { createClient } from '@supabase/supabase-js'
import env from 'dotenv';
env.config();

const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_KEY);
export default supabase;