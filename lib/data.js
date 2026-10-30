// lib/data.js — получение товаров и категорий для публичного сайта (на сервере)
import { serverClient } from './supabase';
import { slugify, idFromSlug } from './utils';

export async function getCategories() {
  try {
    const { data } = await serverClient().from('categories').select('*').order('position');
    return data || [];
  } catch { return []; }
}
// Только видимые товары (скрытые и черновики не показываем)
export async function getProducts() {
  try {
    const { data } = await serverClient().from('products').select('*').eq('hidden', false).order('created_at', { ascending: false });
    return data || [];
  } catch { return []; }
}
export async function getProductBySlug(slug) {
  try {
    const { data } = await serverClient().from('products').select('*').eq('id', idFromSlug(slug)).eq('hidden', false).maybeSingle();
    return data || null;
  } catch { return null; }
}
export const categorySlug = (c) => slugify(c.name);
export async function getCategoryBySlug(slug) {
  return (await getCategories()).find((c) => categorySlug(c) === slug) || null;
}
