import React, { useState } from 'react';
import {
  CloudSun,
  CloudRain,
  CloudLightning,
  Sun,
  Cloud,
  Clock,
  MapPin,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WeatherData } from '../types';
import { formatTimeOnly } from '../utils/polyline';

interface WeatherCardProps {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectArea?: (areaName: string) => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  isLoading,
  error,
  onRefresh,
  onSelectArea,
}) => {
  const [showAllAreas, setShowAllAreas] = useState(false);

  // Pick weather icon based on Singapore data.gov.sg forecast text
  const getWeatherIcon = (forecastText: string) => {
    const text = (forecastText || '').toLowerCase();
    if (text.includes('thunder') || text.includes('heavy')) {
      return <CloudLightning className="w-6 h-6 text-amber-400 shrink-0" />;
    }
    if (text.includes('rain') || text.includes('shower')) {
      return <CloudRain className="w-6 h-6 text-sky-400 shrink-0" />;
    }
    if (text.includes('partly cloudy')) {
      return <CloudSun className="w-6 h-6 text-amber-300 shrink-0" />;
    }
    if (text.includes('cloudy')) {
      return <Cloud className="w-6 h-6 text-neutral-300 shrink-0" />;
    }
    return <Sun className="w-6 h-6 text-yellow-400 shrink-0" />;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">2-Hour Weather</h2>
            <div className="text-[10px] text-neutral-400">Official data.gov.sg live forecast</div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
          title="Refresh 2-hour forecast"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Main Weather Display */}
      {isLoading && !weather ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-neutral-400">
          <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
          <span className="text-xs">Fetching Singapore 2-hour forecast...</span>
        </div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs text-center">
          {error}
        </div>
      ) : weather ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weather.forecast)}
              <div>
                <div className="text-sm font-bold text-neutral-100">{weather.forecast}</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{weather.area} Area</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">
                2-Hr Window
              </span>
            </div>
          </div>

          {/* Valid Period & Update Time */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-400" />
              <span>
                {weather.valid_period?.text ||
                  `${formatTimeOnly(weather.valid_period?.start)} – ${formatTimeOnly(
                    weather.valid_period?.end
                  )}`}
              </span>
            </div>
            {weather.update_timestamp && (
              <span className="text-[10px] text-neutral-400">
                Updated {formatTimeOnly(weather.update_timestamp)}
              </span>
            )}
          </div>

          {/* Explore Other Singapore Areas Accordion */}
          {weather.all_areas && weather.all_areas.length > 0 && (
            <div className="pt-1">
              <button
                onClick={() => setShowAllAreas(!showAllAreas)}
                className="w-full flex items-center justify-between text-[11px] font-medium text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
              >
                <span>View all 47 Singapore weather zones</span>
                {showAllAreas ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAllAreas && (
                <div className="mt-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-1.5 p-1 bg-neutral-950/60 border border-neutral-800/60 rounded-lg">
                  {weather.all_areas.map((item) => (
                    <button
                      key={item.area}
                      onClick={() => onSelectArea && onSelectArea(item.area)}
                      className={`text-left p-1.5 rounded transition-colors text-[11px] flex flex-col ${
                        weather.area === item.area
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="font-semibold truncate">{item.area}</span>
                      <span className="text-[10px] text-neutral-400 truncate">{item.forecast}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
