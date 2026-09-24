export type TravelMode = 'walk' | 'drive' | 'cycle' | 'pt';

export interface LocationItem {
  name: string;
  lat: number;
  lng: number;
  address: string;
  postal?: string;
  building?: string;
}

export interface RouteSummary {
  start_point: string;
  end_point: string;
  total_time: number; // in seconds
  total_distance: number; // in meters
}

export interface RouteData {
  status: number;
  status_message: string;
  route_geometry: string;
  route_instructions: any[];
  route_summary: RouteSummary;
  route_name?: string[];
  provider?: string;
  notice?: string;
  coordinates?: [number, number][];
}

export interface WeatherData {
  area: string;
  forecast: string;
  valid_period: {
    start: string;
    end: string;
    text?: string;
  };
  update_timestamp?: string;
  label_location?: {
    latitude: number;
    longitude: number;
  };
  all_areas?: {
    area: string;
    forecast: string;
    lat: number;
    lng: number;
  }[];
}

export interface AgentAction {
  tool: string;
  status: 'executing' | 'success' | 'error';
  summary: string;
  data?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AgentAction[];
}
