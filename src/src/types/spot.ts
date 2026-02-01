// ===========================================
// Database Types (Supabase)
// ===========================================

export interface Spot {
  id: string;
  title: string;
  description: string | null;
  rating: number;
  best_time: number[] | null;
  lat: number;
  lng: number;
  audience_attributes: string[] | null;
  car_accessibility: 'allowed' | 'brief_stop' | 'not_allowed';
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface SpotHistory {
  id: string;
  spot_id: string;
  snapshot: Spot;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  created_at: string;
}

// ===========================================
// Form Types
// ===========================================

export interface SpotFormData {
  title: string;
  description: string;
  rating: number;
  best_time: number[];
  lat: number;
  lng: number;
  audience_attributes: string[];
  car_accessibility: 'allowed' | 'brief_stop' | 'not_allowed';
  images: File[];
}

// ===========================================
// API Response Types
// ===========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
