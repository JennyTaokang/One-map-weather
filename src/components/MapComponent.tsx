import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationItem, RouteData, TravelMode, WeatherData } from '../types';
import { decodePolyline } from '../utils/polyline';
import { Layers, Navigation, MapPin } from 'lucide-react';

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  selectedLocation: LocationItem | null;
  startLocation: LocationItem | null;
  destination: LocationItem | null;
  currentRoute: RouteData | null;
  travelMode: TravelMode;
  currentWeather: WeatherData | null;
  onSetStart: (loc: LocationItem) => void;
  onSetDestination: (loc: LocationItem) => void;
  onMapClickLocation?: (loc: LocationItem) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 14,
  selectedLocation,
  startLocation,
  destination,
  currentRoute,
  travelMode,
  currentWeather,
  onSetStart,
  onSetDestination,
  onMapClickLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const routeOutlineLayerRef = useRef<L.Polyline | null>(null);

  const [basemap, setBasemap] = useState<'Default' | 'Night' | 'Grey'>('Default');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);

  // Basemap URLs from OneMap Singapore
  const basemapUrls: Record<string, string> = {
    Default: 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png',
    Night: 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png',
    Grey: 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png',
  };

  // Helper to create HTML DivIcon for markers
  const createCustomIcon = (
    label: string,
    bgColor: string,
    textColor: string = 'text-white'
  ) => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background-color: ${bgColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2px solid #ffffff; width: 34px; height: 34px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #ffffff;">
            ${label}
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${bgColor}; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [34, 42],
      iconAnchor: [17, 42],
      popupAnchor: [0, -42],
    });
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Raffles Place coordinates as initial center
    const map = L.map(mapContainerRef.current, {
      center: [1.28435, 103.85107],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Add zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add OneMap SLA official attribution at bottom-left
    L.control
      .attribution({
        position: 'bottomleft',
        prefix:
          '<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer" class="hover:underline text-neutral-400">OneMap</a> &copy; Singapore Land Authority | <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" class="hover:underline text-neutral-400">data.gov.sg</a>',
      })
      .addTo(map);

    // Tile layer
    const tileLayer = L.tileLayer(basemapUrls[basemap], {
      maxZoom: 19,
      minZoom: 11,
      detectRetina: true,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (onMapClickLocation) {
        onMapClickLocation({
          name: `Pinned Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lng,
          address: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Switch Basemap
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(basemapUrls[basemap]);
  }, [basemap]);

  // 3. Update Map Center when prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Only flyTo if not actively viewing route bounds
    if (!currentRoute) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, zoom, currentRoute]);

  // 4. Render Markers and Popups
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    // Start Location Marker (Green A)
    if (startLocation) {
      const markerA = L.marker([startLocation.lat, startLocation.lng], {
        icon: createCustomIcon('A', '#10B981'),
        title: `Start: ${startLocation.name}`,
      }).addTo(layer);

      markerA.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: #10B981; text-transform: uppercase; margin-bottom: 2px;">Start Point</div>
          <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px;">${startLocation.name}</div>
          <div style="font-size: 11px; color: #6B7280; line-height: 1.3;">${startLocation.address}</div>
        </div>
      `);
    }

    // Destination Marker (Red B)
    if (destination) {
      const markerB = L.marker([destination.lat, destination.lng], {
        icon: createCustomIcon('B', '#EF4444'),
        title: `Destination: ${destination.name}`,
      }).addTo(layer);

      markerB.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: #EF4444; text-transform: uppercase; margin-bottom: 2px;">Destination</div>
          <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px;">${destination.name}</div>
          <div style="font-size: 11px; color: #6B7280; line-height: 1.3;">${destination.address}</div>
        </div>
      `);
    }

    // Selected Location Marker (Blue Pin)
    if (
      selectedLocation &&
      (!startLocation || selectedLocation.name !== startLocation.name) &&
      (!destination || selectedLocation.name !== destination.name)
    ) {
      const markerSelected = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: createCustomIcon('★', '#3B82F6'),
        title: selectedLocation.name,
      }).addTo(layer);

      const popupDiv = document.createElement('div');
      popupDiv.innerHTML = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: #3B82F6; text-transform: uppercase; margin-bottom: 2px;">Selected Location</div>
          <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px;">${selectedLocation.name}</div>
          <div style="font-size: 11px; color: #6B7280; margin-bottom: 8px; line-height: 1.3;">${selectedLocation.address}</div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-set-start" style="flex: 1; background: #10B981; color: white; border: none; border-radius: 4px; padding: 4px 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Set as Start</button>
            <button id="btn-set-dest" style="flex: 1; background: #EF4444; color: white; border: none; border-radius: 4px; padding: 4px 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Set as Dest</button>
          </div>
        </div>
      `;

      popupDiv.querySelector('#btn-set-start')?.addEventListener('click', () => {
        onSetStart(selectedLocation);
        markerSelected.closePopup();
      });

      popupDiv.querySelector('#btn-set-dest')?.addEventListener('click', () => {
        onSetDestination(selectedLocation);
        markerSelected.closePopup();
      });

      markerSelected.bindPopup(popupDiv);
      markerSelected.openPopup();
    }
  }, [selectedLocation, startLocation, destination]);

  // 5. Draw Route Polyline and Fit Bounds
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean up previous route layers
    if (routeOutlineLayerRef.current) {
      map.removeLayer(routeOutlineLayerRef.current);
      routeOutlineLayerRef.current = null;
    }
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (!currentRoute || !currentRoute.route_geometry) return;

    // Decode polyline points
    const points = decodePolyline(currentRoute.route_geometry);
    if (!points || points.length === 0) return;

    // Color by travel mode
    const modeColors: Record<TravelMode, string> = {
      walk: '#059669', // Emerald
      drive: '#2563EB', // Blue
      cycle: '#D97706', // Amber
      pt: '#7C3AED', // Purple
    };
    const routeColor = modeColors[travelMode] || '#2563EB';

    // Outer casing (white / dark contrast outline)
    const outline = L.polyline(points, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Main route line
    const polyline = L.polyline(points, {
      color: routeColor,
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routeOutlineLayerRef.current = outline;
    routeLayerRef.current = polyline;

    // Zoom map to fit complete route with comfortable padding
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      padding: [48, 48],
      maxZoom: 16,
      animate: true,
      duration: 1.0,
    });
  }, [currentRoute, travelMode]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden shadow-sm border border-neutral-800 bg-neutral-950">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Basemap Style Picker */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end">
        <button
          onClick={() => setShowBasemapMenu(!showBasemapMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 shadow-md backdrop-blur transition-colors"
          title="Switch Basemap Style"
        >
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <span>{basemap} Style</span>
        </button>

        {showBasemapMenu && (
          <div className="mt-1.5 bg-neutral-900/95 border border-neutral-700 rounded-lg shadow-xl p-1 flex flex-col gap-0.5 backdrop-blur min-w-[120px]">
            {(['Default', 'Night', 'Grey'] as const).map((style) => (
              <button
                key={style}
                onClick={() => {
                  setBasemap(style);
                  setShowBasemapMenu(false);
                }}
                className={`px-2.5 py-1.5 text-xs text-left rounded-md transition-colors ${
                  basemap === style
                    ? 'bg-neutral-700 text-white font-medium'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                OneMap {style}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Center on Singapore / Raffles Place Button */}
      <div className="absolute top-3 left-3 z-[400]">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([1.28435, 103.85107], 15);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 shadow-md backdrop-blur transition-colors"
          title="Reset View to Raffles Place (Downtown Singapore)"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Raffles Place</span>
        </button>
      </div>

      {/* Live Route Mode Indicator Pill (if route active) */}
      {currentRoute && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] bg-neutral-900/95 text-neutral-100 text-xs font-medium px-3.5 py-1.5 rounded-full border border-neutral-700 shadow-lg backdrop-blur flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {travelMode === 'walk'
              ? 'Walking'
              : travelMode === 'drive'
              ? 'Driving'
              : travelMode === 'cycle'
              ? 'Cycling'
              : 'Transit'}{' '}
            Route Active
          </span>
          <span className="text-neutral-400">·</span>
          <span className="font-mono tabular-nums">
            {(currentRoute.route_summary.total_distance / 1000).toFixed(2)} km
          </span>
        </div>
      )}
    </div>
  );
};
