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

// ============================================================
// LINES (dla offline sync)
// ============================================================

export interface LineFullData {
  line: {
    id: string;
    number: string;
    description: string | null;
    operation_note: string | null;
    carrier: {
      id: string;
      name: string;
      logo_url: string | null;
      is_verified: boolean;
    };
  };
  schedules: {
    id: string;
    direction: string;
    version: number;
    status: string;
    is_incomplete: boolean;
    is_verified: boolean;
    days: string[];
    excludes_holidays: boolean;
    created_at: string;
    last_modified_at: string;
    net_score: number;
    first_departure: string | null;
  }[];
  routeStops: {
    id: string;
    schedule_id: string;
    stop_id: string;
    order_index: number;
    offset_minutes: number;
  }[];
  stops: {
    id: string;
    city: string;
    name: string;
    is_verified: boolean;
  }[];
  courses: {
    id: string;
    schedule_id: string;
    departure_time: string;
    use_offsets: boolean;
  }[];
  courseTimes: {
    id: string;
    course_id: string;
    stop_id: string;
    arrival_time: string | null;
    order_index: number;
  }[];
}

export async function getLineFullData(lineId: string): Promise<LineFullData | null> {
  const supabase = createClient();

  // 1. Pobierz linię z przewoźnikiem
  const { data: line, error: lineError } = await supabase
    .from('lines')
    .select(`
      id,
      number,
      description,
      operation_note,
      carrier:carriers(id, name, logo_url, is_verified)
    `)
    .eq('id', lineId)
    .single();

  if (lineError || !line) {
    console.error('Error fetching line:', lineError?.message);
    return null;
  }

  // 2. Pobierz rozkłady tej linii (active + pending)
  const { data: schedulesRaw } = await supabase
    .from('schedules')
    .select('id, direction, version, status, is_incomplete, is_verified, days, excludes_holidays, created_at, last_modified_at')
    .eq('line_id', lineId)
    .in('status', ['active', 'pending']);

  const scheduleIds = schedulesRaw?.map(s => s.id) ?? [];

  if (scheduleIds.length === 0) {
    // Linia bez rozkładów - nadal zwracamy
    const carrier = Array.isArray(line.carrier) ? line.carrier[0] : line.carrier;
    return {
      line: {
        id: line.id,
        number: line.number,
        description: line.description,
        operation_note: line.operation_note,
        carrier,
      },
      schedules: [],
      routeStops: [],
      stops: [],
      courses: [],
      courseTimes: [],
    };
  }

  // 3. Pobierz net_score z verification_stats_view
  let verificationStats: Record<string, number> = {};
  const { data: stats } = await supabase
    .from('verification_stats_view')
    .select('schedule_id, net_score')
    .in('schedule_id', scheduleIds);
  
  if (stats) {
    verificationStats = Object.fromEntries(
      stats.map(s => [s.schedule_id, s.net_score])
    );
  }

  // 4. Pobierz first_departure z courses
  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, schedule_id, departure_time, use_offsets')
    .in('schedule_id', scheduleIds)
    .order('departure_time', { ascending: true });

  let firstDepartures: Record<string, string | null> = {};
  if (allCourses) {
    for (const course of allCourses) {
      if (!firstDepartures[course.schedule_id]) {
        firstDepartures[course.schedule_id] = course.departure_time;
      }
    }
  }

  // Połącz dane rozkładów
  const schedules = schedulesRaw?.map(s => ({
    ...s,
    net_score: verificationStats[s.id] ?? 0,
    first_departure: firstDepartures[s.id] ?? null,
  })) ?? [];

  // 5. Pobierz route_stops dla wszystkich schedules
  const { data: routeStops } = await supabase
    .from('route_stops')
    .select('id, schedule_id, stop_id, order_index, offset_minutes')
    .in('schedule_id', scheduleIds);

  // 6. Pobierz unikalne stops
  const stopIds = [...new Set(routeStops?.map(rs => rs.stop_id) ?? [])];
  
  const { data: stops } = stopIds.length > 0
    ? await supabase
        .from('stops')
        .select('id, city, name, is_verified')
        .in('id', stopIds)
    : { data: [] };

  // 7. Pobierz course_times (tylko dla use_offsets=false)
  const manualCourseIds = allCourses?.filter(c => !c.use_offsets).map(c => c.id) ?? [];
  
  const { data: courseTimes } = manualCourseIds.length > 0
    ? await supabase
        .from('course_times')
        .select('id, course_id, stop_id, arrival_time, order_index')
        .in('course_id', manualCourseIds)
    : { data: [] };

  const carrier = Array.isArray(line.carrier) ? line.carrier[0] : line.carrier;

  return {
    line: {
      id: line.id,
      number: line.number,
      description: line.description,
      operation_note: line.operation_note,
      carrier,
    },
    schedules: schedules ?? [],
    routeStops: routeStops ?? [],
    stops: stops ?? [],
    courses: allCourses ?? [],
    courseTimes: courseTimes ?? [],
  };
}

// Pobierz listę wszystkich linii (do przeglądarki "Do pobrania")
export async function getAllLinesBasic() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('lines')
    .select(`
      id,
      number,
      description,
      carrier:carriers(id, name, is_verified)
    `)
    .order('number', { ascending: true });

  if (error) {
    console.error('Error fetching lines:', error.message);
    return [];
  }

  return data ?? [];
}