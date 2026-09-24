import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Info,
  MapPin,
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

// Popular Singapore landmarks for 1-click selection
const PRESET_DESTINATIONS: LocationItem[] = [
  {
    name: 'Marina Bay Sands',
    lat: 1.283994,
    lng: 103.85945,
    address: '10 Bayfront Avenue, Singapore 018956',
    building: 'Marina Bay Sands',
  },
  {
    name: 'Gardens by the Bay',
    lat: 1.281568,
    lng: 103.863613,
    address: '18 Marina Gardens Drive, Singapore 018953',
    building: 'Gardens by the Bay',
  },
  {
    name: 'Orchard Road (ION)',
    lat: 1.304026,
    lng: 103.831964,
    address: '2 Orchard Turn, Singapore 238801',
    building: 'ION Orchard',
  },
  {
    name: 'Changi Airport Jewel',
    lat: 1.360208,
    lng: 103.989759,
    address: '78 Airport Boulevard, Singapore 819666',
    building: 'Jewel Changi Airport',
  },
];

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
  const [editingTarget, setEditingTarget] = useState<'start' | 'dest' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const modes: { id: TravelMode; label: string; icon: React.ReactNode }[] = [
    { id: 'walk', label: 'Walk', icon: <Footprints className="w-3.5 h-3.5" /> },
    { id: 'drive', label: 'Drive', icon: <Car className="w-3.5 h-3.5" /> },
    { id: 'cycle', label: 'Cycle', icon: <Bike className="w-3.5 h-3.5" /> },
    { id: 'pt', label: 'Transit', icon: <Bus className="w-3.5 h-3.5" /> },
  ];

  // Focus input when editing starts
  useEffect(() => {
    if (editingTarget && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [editingTarget]);

  // Click outside listener for search popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setEditingTarget(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search OneMap
  useEffect(() => {
    if (!searchQuery.trim() || !editingTarget) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/onemap-search?searchVal=${encodeURIComponent(searchQuery)}`);
        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
        if (data && data.results) {
          setSearchResults(data.results.slice(0, 5));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, editingTarget]);

  const handleSelectLocation = (loc: LocationItem) => {
    if (editingTarget === 'start') {
      onSetStart(loc);
    } else if (editingTarget === 'dest') {
      onSetDestination(loc);
    }
    setEditingTarget(null);
    setSearchQuery('');
    setSearchResults([]);
  };

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
      <div className="relative flex flex-col gap-2.5" ref={searchContainerRef}>
        {/* Start Point Input Card */}
        <div
          onClick={() => {
            if (editingTarget !== 'start') {
              setEditingTarget('start');
              setSearchQuery('');
            }
          }}
          className={`flex items-center gap-2.5 bg-neutral-950/70 border rounded-lg p-2.5 cursor-pointer transition-all ${
            editingTarget === 'start'
              ? 'border-emerald-500/80 ring-1 ring-emerald-500/50'
              : 'border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold text-neutral-400">From (Start)</div>
            {editingTarget === 'start' ? (
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type start landmark or address..."
                className="w-full bg-transparent text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <div className="text-xs font-medium text-neutral-100 truncate">
                  {startLocation ? startLocation.name : 'Click to select or search start...'}
                </div>
                {startLocation?.address && (
                  <div className="text-[10px] text-neutral-400 truncate">{startLocation.address}</div>
                )}
              </>
            )}
          </div>
          {startLocation && editingTarget !== 'start' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetStart(null);
              }}
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
        <div
          onClick={() => {
            if (editingTarget !== 'dest') {
              setEditingTarget('dest');
              setSearchQuery('');
            }
          }}
          className={`flex items-center gap-2.5 bg-neutral-950/70 border rounded-lg p-2.5 cursor-pointer transition-all ${
            editingTarget === 'dest'
              ? 'border-rose-500/80 ring-1 ring-rose-500/50'
              : 'border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] font-bold shrink-0">
            B
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-bold text-neutral-400">To (Destination)</div>
            {editingTarget === 'dest' ? (
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type destination landmark or address..."
                className="w-full bg-transparent text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <div className="text-xs font-medium text-neutral-100 truncate">
                  {destination ? destination.name : 'Click to select or search destination...'}
                </div>
                {destination?.address && (
                  <div className="text-[10px] text-neutral-400 truncate">{destination.address}</div>
                )}
              </>
            )}
          </div>
          {destination && editingTarget !== 'dest' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDestination(null);
              }}
              className="text-[11px] text-neutral-400 hover:text-neutral-300 p-1"
              title="Remove destination"
            >
              &times;
            </button>
          )}
        </div>

        {/* Inline Search Popup / Presets Dropdown */}
        {editingTarget && (
          <div className="bg-neutral-950 border border-neutral-700/80 rounded-lg p-2.5 shadow-xl flex flex-col gap-2 z-20">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-neutral-800 text-[10px] text-neutral-400">
              <span className="font-semibold text-neutral-300">
                Choose {editingTarget === 'start' ? 'Start (A)' : 'Destination (B)'}
              </span>
              <button
                onClick={() => setEditingTarget(null)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                Close
              </button>
            </div>

            {/* Live Search Results */}
            {isSearching ? (
              <div className="flex items-center gap-2 p-2 text-xs text-neutral-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Searching OneMap...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-1 max-h-44 overflow-y-auto">
                {searchResults.map((r, i) => {
                  const title = r.BUILDING !== 'NIL' ? r.BUILDING : r.SEARCHVAL || r.ROAD_NAME;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        handleSelectLocation({
                          name: title,
                          lat: Number(r.LATITUDE),
                          lng: Number(r.LONGITUDE),
                          address: r.ADDRESS || r.ROAD_NAME,
                          building: r.BUILDING !== 'NIL' ? r.BUILDING : undefined,
                        })
                      }
                      className="text-left p-1.5 rounded hover:bg-neutral-800 transition-colors flex items-center gap-2 text-xs text-neutral-200"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1 truncate">
                        <div className="font-medium truncate">{title}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{r.ADDRESS}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-xs text-neutral-400 p-2">No matching locations found</div>
            ) : (
              <div>
                <div className="text-[10px] font-semibold text-neutral-400 px-1 py-0.5">
                  Quick Landmark Presets:
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {PRESET_DESTINATIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(preset)}
                      className="text-left p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-200 font-medium truncate transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
            <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
              Route Summary
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium capitalize">
              {travelMode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-900/90 rounded-md p-2 border border-neutral-800">
              <div className="text-[10px] text-neutral-400">Total Distance</div>
              <div className="text-sm font-bold text-neutral-100">
                {formatDistance(currentRoute.route_summary.total_distance)}
              </div>
            </div>
            <div className="bg-neutral-900/90 rounded-md p-2 border border-neutral-800">
              <div className="text-[10px] text-neutral-400">Est. Travel Time</div>
              <div className="text-sm font-bold text-emerald-400">
                {formatDuration(currentRoute.route_summary.total_time)}
              </div>
            </div>
          </div>

          {currentRoute.notice && (
            <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 bg-neutral-900/50 p-1.5 rounded">
              <Info className="w-3 h-3 text-neutral-400 shrink-0" />
              <span className="truncate">{currentRoute.notice}</span>
            </div>
          )}

          {/* Turn-by-Turn Collapsible */}
          {currentRoute.route_instructions && currentRoute.route_instructions.length > 0 && (
            <div className="border-t border-neutral-800/80 pt-2">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between text-xs text-neutral-300 hover:text-neutral-100 py-1 font-medium transition-colors"
              >
                <span>Turn-by-Turn Steps ({currentRoute.route_instructions.length})</span>
                {showInstructions ? (
                  <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </button>

              {showInstructions && (
                <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {currentRoute.route_instructions.map((step, idx) => {
                    const stepType = step[0] || 'Proceed';
                    const street = step[1];
                    const distStr = step[5] || `${step[2]}m`;
                    const instructionText = step[9] || (street ? `${stepType} on ${street}` : stepType);

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs py-1.5 px-2 rounded bg-neutral-900 border border-neutral-800/80"
                      >
                        <span className="w-4 h-4 rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
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
