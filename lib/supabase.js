// lib/supabase.js — подключение к Supabase (сервер: чтение для страниц, браузер: админка и счётчик посещений)
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config';

export const serverClient = () => createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

let browser;
export function browserClient() {
  if (!browser) browser = createClient(SUPABASE_URL, SUPABASE_KEY);
  return browser;
}
