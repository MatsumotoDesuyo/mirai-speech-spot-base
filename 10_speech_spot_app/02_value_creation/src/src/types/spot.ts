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

// ===========================================
// External API Types
// ===========================================

export interface ApiKey {
  id: string;
  app_name: string;
  api_key_hash: string;
  api_key_prefix: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiAccessLog {
  id: string;
  api_key_id: string;
  accessed_at: string;
  response_status: number;
  ip_address: string | null;
}

export interface ApiKeyWithUsage extends ApiKey {
  today_access_count: number;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  metadata: {
    attribution: string;
    license: string;
    license_url: string;
    generated_at: string;
    total_count: number;
  };
  features: GeoJsonFeature[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: string;
    title: string;
    description: string | null;
    rating: number;
    best_time: number[] | null;
    audience_attributes: string[] | null;
    car_accessibility: 'allowed' | 'brief_stop' | 'not_allowed';
    images: string[];
    created_at: string;
    updated_at: string;
  };
}
