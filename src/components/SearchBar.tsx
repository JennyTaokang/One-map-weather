import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation, CornerDownRight } from 'lucide-react';
import { LocationItem } from '../types';

interface SearchBarProps {
  onSelectLocation: (loc: LocationItem) => void;
  onSetStart?: (loc: LocationItem) => void;
  onSetDestination?: (loc: LocationItem) => void;
  selectedLocation: LocationItem | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectLocation,
  onSetStart,
  onSetDestination,
  selectedLocation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search with debounce
  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setErrorMsg(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/onemap-search?searchVal=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setResults(data.results.slice(0, 7)); // Show top 7 relevant matches
        setIsOpen(true);
      } else {
        setResults([]);
        setErrorMsg(`No locations found matching "${searchTerm}"`);
        setIsOpen(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to OneMap Search');
      setResults([]);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        executeSearch(val);
      }, 350);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (query.trim()) {
      executeSearch(query);
    }
  };

  const handleItemSelect = (item: any) => {
    const loc: LocationItem = {
      name: item.BUILDING && item.BUILDING !== 'NIL' ? item.BUILDING : item.SEARCHVAL || item.ROAD_NAME,
      lat: Number(item.LATITUDE),
      lng: Number(item.LONGITUDE),
      address: item.ADDRESS || item.ROAD_NAME,
      postal: item.POSTAL !== 'NIL' ? item.POSTAL : undefined,
      building: item.BUILDING !== 'NIL' ? item.BUILDING : undefined,
    };
    onSelectLocation(loc);
    setQuery(loc.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleFormSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-neutral-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0 || errorMsg) setIsOpen(true);
          }}
          placeholder="Search location, building, MRT or postal code (e.g. Marina Bay Sands, Orchard, 048616)..."
          className="w-full pl-10 pr-24 py-2.5 bg-neutral-900/90 text-neutral-100 text-sm rounded-xl border border-neutral-700/80 shadow-sm placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all backdrop-blur"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin mr-1" />}

          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="p-1 text-neutral-400 hover:text-neutral-200 rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </form>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-neutral-800 backdrop-blur">
          {errorMsg ? (
            <div className="p-4 text-xs text-neutral-400 text-center">{errorMsg}</div>
          ) : results.length > 0 ? (
            <div className="max-h-72 overflow-y-auto">
              {results.map((item, idx) => {
                const title =
                  item.BUILDING && item.BUILDING !== 'NIL' ? item.BUILDING : item.SEARCHVAL || item.ROAD_NAME;
                const postalText = item.POSTAL && item.POSTAL !== 'NIL' ? `Singapore ${item.POSTAL}` : '';

                return (
                  <div
                    key={`${item.SEARCHVAL}-${idx}`}
                    className="p-3 hover:bg-neutral-800/80 cursor-pointer transition-colors flex items-start justify-between group"
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-neutral-800 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-100 truncate group-hover:text-emerald-400 transition-colors">
                          {title}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">{item.ADDRESS}</div>
                        {postalText && (
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{postalText}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {onSetStart && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const loc: LocationItem = {
                              name: title,
                              lat: Number(item.LATITUDE),
                              lng: Number(item.LONGITUDE),
                              address: item.ADDRESS,
                            };
                            onSetStart(loc);
                            setIsOpen(false);
                          }}
                          className="px-2 py-1 text-[10px] font-medium bg-emerald-950/70 hover:bg-emerald-800 text-emerald-300 rounded border border-emerald-700/50"
                          title="Set as Route Start"
                        >
                          Start
                        </button>
                      )}
                      {onSetDestination && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const loc: LocationItem = {
                              name: title,
                              lat: Number(item.LATITUDE),
                              lng: Number(item.LONGITUDE),
                              address: item.ADDRESS,
                            };
                            onSetDestination(loc);
                            setIsOpen(false);
                          }}
                          className="px-2 py-1 text-[10px] font-medium bg-rose-950/70 hover:bg-rose-800 text-rose-300 rounded border border-rose-700/50"
                          title="Set as Route Destination"
                        >
                          Dest
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
