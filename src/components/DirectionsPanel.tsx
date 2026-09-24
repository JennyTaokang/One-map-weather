import React, { useState } from 'react';
import {
  ArrowUpDown,
  Footprints,
  Car,
  Bike,
  Bus,
  Navigation,
  RotateCcw,
  Clock,
  Compass,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { LocationItem, RouteData, TravelMode } from '../types';
import { formatDistance, formatDuration } from '../utils/polyline';

interface DirectionsPanelProps {
  startLocation: LocationItem | null;
  destination: LocationItem | null;
  travelMode: TravelMode;
  currentRoute: RouteData | null;
  isLoadingRoute: boolean;
  routeError: string | null;
  onSetStart: (loc: LocationItem | null) => void;
  onSetDestination: (loc: LocationItem | null) => void;
  onSetTravelMode: (mode: TravelMode) => void;
  onSwapLocations: () => void;
  onRequestRoute: () => void;
  onClearRoute: () => void;
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  startLocation,
  destination,
  travelMode,
  currentRoute,
  isLoadingRoute,
  routeError,
  onSetStart,
  onSetDestination,
  onSetTravelMode,
  onSwapLocations,
  onRequestRoute,
  onClearRoute,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const modes: { id: TravelMode; label: string; icon: React.ReactNode }[] = [
    { id: 'walk', label: 'Walk', icon: <Footprints className="w-3.5 h-3.5" /> },
    { id: 'drive', label: 'Drive', icon: <Car className="w-3.5 h-3.5" /> },
    { id: 'cycle', label: 'Cycle', icon: <Bike className="w-3.5 h-3.5" /> },
    { id: 'pt', label: 'Transit', icon: <Bus className="w-3.5 h-3.5" /> },
  ];

  const canRequestRoute = !!(startLocation && destination);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col gap-3.5">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">Directions</h2>
        </div>
        {currentRoute && (
          <button
            onClick={onClearRoute}
            className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Clear active route"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Route</span>
          </button>
        )}
      </div>

      {/* Start and Destination Selection */}
      <div className="relative flex flex-col gap-2.5">
        {/* Start Point Input Card */}
        <div className="flex items-center gap-2.5 bg-neutral-950/70 border border-neutral-800 rounded-lg p-2.5">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold text-neutral-400">From (Start)</div>
            <div className="text-xs font-medium text-neutral-100 truncate">
              {startLocation ? startLocation.name : 'Select or search start location...'}
            </div>
            {startLocation?.address && (
              <div className="text-[10px] text-neutral-400 truncate">{startLocation.address}</div>
            )}
          </div>
          {startLocation && (
            <button
              onClick={() => onSetStart(null)}
              className="text-[11px] text-neutral-400 hover:text-neutral-300 p-1"
              title="Remove start location"
            >
              &times;
            </button>
          )}
        </div>

        {/* Swap Button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            onClick={onSwapLocations}
            disabled={!startLocation && !destination}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Swap start and destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Input Card */}
        <div className="flex items-center gap-2.5 bg-neutral-950/70 border border-neutral-800 rounded-lg p-2.5">
          <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
            B
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold text-neutral-400">To (Destination)</div>
            <div className="text-xs font-medium text-neutral-100 truncate">
              {destination ? destination.name : 'Select or search destination...'}
            </div>
            {destination?.address && (
              <div className="text-[10px] text-neutral-400 truncate">{destination.address}</div>
            )}
          </div>
          {destination && (
            <button
              onClick={() => onSetDestination(null)}
              className="text-[11px] text-neutral-400 hover:text-neutral-300 p-1"
              title="Remove destination"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Travel Mode Selector Tabs */}
      <div className="flex items-center justify-between bg-neutral-950 p-1 rounded-lg border border-neutral-800">
        {modes.map((m) => {
          const isActive = travelMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSetTravelMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-800 text-emerald-400 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Button: Get Directions */}
      <button
        onClick={onRequestRoute}
        disabled={!canRequestRoute || isLoadingRoute}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
      >
        {isLoadingRoute ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Calculating Route...</span>
          </>
        ) : (
          <>
            <Compass className="w-4 h-4" />
            <span>Get Directions</span>
          </>
        )}
      </button>

      {/* Error state */}
      {routeError && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">{routeError}</div>
        </div>
      )}

      {/* Route Information Card */}
      {currentRoute && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Route Summary
            </span>
            {currentRoute.provider && (
              <span className="text-[10px] text-neutral-500 font-mono">
                {currentRoute.provider === 'onemap' ? 'OneMap Routing' : 'OSM Network'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-900/80 p-2 rounded-md border border-neutral-800/80">
              <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-emerald-400" />
                <span>Distance</span>
              </div>
              <div className="text-base font-bold text-neutral-100 font-mono tabular-nums mt-0.5">
                {formatDistance(currentRoute.route_summary.total_distance)}
              </div>
            </div>

            <div className="bg-neutral-900/80 p-2 rounded-md border border-neutral-800/80">
              <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Travel Time</span>
              </div>
              <div className="text-base font-bold text-neutral-100 font-mono tabular-nums mt-0.5">
                {formatDuration(currentRoute.route_summary.total_time)}
              </div>
            </div>
          </div>

          {currentRoute.notice && (
            <div className="text-[10px] text-neutral-400 flex items-center gap-1 italic">
              <Info className="w-3 h-3 text-neutral-400 shrink-0" />
              <span>{currentRoute.notice}</span>
            </div>
          )}

          {/* Turn-by-Turn Instruction Toggle */}
          {currentRoute.route_instructions && currentRoute.route_instructions.length > 0 && (
            <div>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between text-[11px] font-medium text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
              >
                <span>Turn-by-Turn Directions ({currentRoute.route_instructions.length} steps)</span>
                {showInstructions ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showInstructions && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-800/50">
                  {currentRoute.route_instructions.map((step, idx) => {
                    // step structure: [maneuver, street, distanceMeters, coords, timeSeconds, distanceStr, ...]
                    const instructionText =
                      typeof step === 'string'
                        ? step
                        : step[9] || step[0] || `Proceed ${step[5] || ''}`;
                    const distStr = step[5] || `${step[2]}m`;

                    return (
                      <div key={idx} className="pt-1.5 flex items-start gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-[9px] font-mono shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 text-neutral-300">{instructionText}</div>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {distStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
