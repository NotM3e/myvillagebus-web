import { createClient } from './client';
import type { 
  ActiveScheduleView, 
  Carrier, 
  Verification,
  VoteType,
  NegativeReason 
} from '@/types/database';

// ============================================================
// SCHEDULES
// ============================================================

export async function getActiveSchedules(): Promise<ActiveScheduleView[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('active_schedules_view')
    .select('*')
    .order('carrier_name', { ascending: true });

  if (error) {
    console.error('Error fetching schedules:', error.message);
    return [];
  }

  return data ?? [];
}

export async function getScheduleWithStops(scheduleId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('active_schedules_view')
    .select('*')
    .eq('id', scheduleId)
    .single();

  if (error) {
    console.error('Error fetching schedule:', error.message);
    return null;
  }

  // Pobierz przystanki na trasie
  const { data: routeStops } = await supabase
    .from('route_stops')
    .select(`
      *,
      stop:stops(*)
    `)
    .eq('schedule_id', scheduleId)
    .order('order_index', { ascending: true });

  // Pobierz kursy
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('departure_time', { ascending: true });

  return {
    ...data,
    route_stops: routeStops ?? [],
    courses: courses ?? [],
  };
}

// ============================================================
// CARRIERS
// ============================================================

export async function getCarriers(): Promise<Carrier[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('carriers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching carriers:', error.message);
    return [];
  }

  return data ?? [];
}

// ============================================================
// VOTING
// ============================================================

export async function voteOnSchedule(
  scheduleId: string, 
  voteType: VoteType,
  negativeReason?: NegativeReason
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Musisz być zalogowany' };
  }

  const { error } = await supabase
    .from('verifications')
    .upsert({
      schedule_id: scheduleId,
      user_id: user.id,
      vote_type: voteType,
      negative_reason: voteType === 'negative' ? negativeReason : null,
    }, {
      onConflict: 'schedule_id,user_id',
    });

  if (error) {
    console.error('Error voting:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUserVote(scheduleId: string): Promise<Verification | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data } = await supabase
    .from('verifications')
    .select('*')
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id)
    .single();

  return data;
}

export async function removeVote(scheduleId: string): Promise<{ success: boolean }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false };

  const { error } = await supabase
    .from('verifications')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id);

  return { success: !error };
}

// ============================================================
// FAVORITES
// ============================================================

export async function toggleFavorite(scheduleId: string): Promise<{ isFavorite: boolean }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { isFavorite: false };

  // Sprawdź czy już jest w ulubionych
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id);
    return { isFavorite: false };
  } else {
    await supabase.from('favorites').insert({
      schedule_id: scheduleId,
      user_id: user.id,
    });
    return { isFavorite: true };
  }
}