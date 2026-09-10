// frontend/src/components/StaticMap.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Settings,
  Navigation2,
  Layers,
  RefreshCcw,
  X,
  Compass,
  Box,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * MAPRESTORE IMPLEMENTATION
 * Reverts to MapLibre for stability while maintaining Elite features.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || 'czxQ6wrMV3cG7qUo9FzK';
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
const DARK_STYLE_URL = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

export default function StaticMap({ venue, lat, lon, zones = [], onZoneClick }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // --- REFS ---
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const zoneMarkersRef = useRef({}); // Using object for efficient sync

  // --- STATE ---
  const [zoom, setZoom] = useState(17);
  const [menuOpen, setMenuOpen] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [locStatus, setLocStatus] = useState('idle');
  const [userPos, setUserPos] = useState(null); // Track user coords for bounds fitting

  // --- MARKER HELPERS ---
  const createStadiumMarkerEl = () => {
    const el = document.createElement('div');
    el.className = 'flex flex-col items-center group cursor-pointer';
    el.innerHTML = `
      <div class="relative w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
        <div class="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse"></div>
        <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-white shadow-[0_0_20px_rgba(147,51,234,0.5)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
      </div>
      <div class="mt-2 px-3 py-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-premium animate-in fade-in slide-in-from-top-2">
        <span class="text-[9px] font-black uppercase tracking-widest text-slate-800">Stadium</span>
      </div>
    `;
    return el;
  };

  const createUserMarkerEl = () => {
    const el = document.createElement('div');
    el.className = 'relative w-8 h-8';
    el.innerHTML = `
      <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
      <div class="relative w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `;
    return el;
  };

  const createZoneMarkerEl = (zone, onClick) => {
    const el = document.createElement('div');
    el.className = `group flex items-center justify-center cursor-pointer w-10 h-10 rounded-2xl shadow-xl border-2 border-white/40 transition-all hover:scale-110 active:scale-95 ${zone.status === 'critical' ? 'bg-red-600' : zone.status === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'
      }`;
    el.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        ${zone.type === 'gate' ? '<polygon points="3 11 22 2 13 21 11 13 3 11"/>' : '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'}
      </svg>
    `;
    el.onclick = (e) => { e.stopPropagation(); onClick(); };
    return el;
  };

  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocStatus('loading');

    const success = (pos) => {
      const { latitude: uLat, longitude: uLng } = pos.coords;
      setLocStatus('found');
      setUserPos({ lat: uLat, lng: uLng });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([uLng, uLat]);
      } else if (mapRef.current) {
        userMarkerRef.current = new maplibregl.Marker({ element: createUserMarkerEl() })
          .setLngLat([uLng, uLat])
          .addTo(mapRef.current);
      }
    };

    const watchId = navigator.geolocation.watchPosition(success, () => setLocStatus('denied'), {
      enableHighAccuracy: true,
      timeout: 10000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: isDark ? DARK_STYLE_URL : STYLE_URL,
      center: [lon, lat],
      zoom: 17.2,
      pitch: 62,
      bearing: -15,
      antialias: true
    });

    mapRef.current = map;

    map.on('load', () => {
      // ── KEY FIX: find the first symbol (label) layer in the style so every
      //    fill-extrusion we add is inserted BEFORE it. Labels always render on top.
      const getFirstSymbolId = () => {
        const layers = map.getStyle().layers || [];
        return layers.find(l => l.type === 'symbol')?.id;
      };

      // Add Central Stadium Marker
      new maplibregl.Marker({ element: createStadiumMarkerEl() })
        .setLngLat([lon, lat])
        .addTo(map);

      // Add Crowd Heatmap Layer
      map.addSource('crowd-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Heatmap sits below labels too
      map.addLayer({
        id: 'crowd-heatmap',
        type: 'heatmap',
        source: 'crowd-data',
        maxzoom: 20,
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 20, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0, 255, 0, 0)',
            0.2, 'rgba(0, 228, 0, 0.4)',
            0.4, 'rgba(255, 255, 0, 0.5)',
            0.6, 'rgba(255, 126, 0, 0.6)',
            0.8, 'rgba(255, 0, 0, 0.7)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 20, 50],
          'heatmap-opacity': 0.6
        }
      }, getFirstSymbolId());

      // --- 3D VOLUMETRIC STADIUM (Ring/Bowl — annular polygon) ---
      const outerR_lon = 0.00105;
      const outerR_lat = 0.00082;
      const innerR_lon = 0.00060;
      const innerR_lat = 0.00046;
      const SEGS = 72;

      // Outer ring: counter-clockwise (exterior)
      const outerRing = Array.from({ length: SEGS }, (_, i) => {
        const angle = (i / SEGS) * Math.PI * 2;
        return [lon + Math.cos(angle) * outerR_lon, lat + Math.sin(angle) * outerR_lat];
      });
      outerRing.push(outerRing[0]);

      // Inner ring: clockwise (GeoJSON hole = bowl opening)
      const innerRing = Array.from({ length: SEGS }, (_, i) => {
        const angle = -(i / SEGS) * Math.PI * 2;
        return [lon + Math.cos(angle) * innerR_lon, lat + Math.sin(angle) * innerR_lat];
      });
      innerRing.push(innerRing[0]);

      // Playing field disc (inner solid, bright green)
      const fieldRing = Array.from({ length: SEGS }, (_, i) => {
        const angle = (i / SEGS) * Math.PI * 2;
        return [lon + Math.cos(angle) * innerR_lon * 0.92, lat + Math.sin(angle) * innerR_lat * 0.92];
      });
      fieldRing.push(fieldRing[0]);

      map.addSource('stadium-volume', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { part: 'walls' },
              geometry: { type: 'Polygon', coordinates: [outerRing, innerRing] }
            },
            {
              type: 'Feature',
              properties: { part: 'field' },
              geometry: { type: 'Polygon', coordinates: [fieldRing] }
            }
          ]
        }
      });

      const firstSymId = getFirstSymbolId();

      // Stadium bowl walls — inserted before first symbol layer
      map.addLayer({
        id: 'stadium-3d',
        type: 'fill-extrusion',
        source: 'stadium-volume',
        filter: ['==', ['get', 'part'], 'walls'],
        paint: {
          'fill-extrusion-color': isDark ? '#2d4a3e' : '#a8c4a0',
          'fill-extrusion-height': 28,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.92,
        }
      }, firstSymId);

      // Playing field — inserted before first symbol layer
      map.addLayer({
        id: 'stadium-field',
        type: 'fill-extrusion',
        source: 'stadium-volume',
        filter: ['==', ['get', 'part'], 'field'],
        paint: {
          'fill-extrusion-color': isDark ? '#1a4731' : '#4ade80',
          'fill-extrusion-height': 2,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.95,
        }
      }, firstSymId);

      // --- 3D BUILDINGS (Premium warm tan — before labels) ---
      const addBuildingLayer = () => {
        if (map.getLayer('3d-buildings')) return;

        // Remove flat building footprint layers that conflict with extrusion
        ['building', 'building-top'].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });

        const symId = getFirstSymbolId();

        map.addLayer({
          'id': '3d-buildings',
          'source': 'openmaptiles',
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 14,
          'paint': {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'render_height'],
              0, isDark ? '#1e293b' : '#d4c4a8',
              15, isDark ? '#2d3f55' : '#c8b898',
              35, isDark ? '#3d5068' : '#b8a888',
              60, isDark ? '#4a6080' : '#a89878'
            ],
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              14, 0, 14.5, ['get', 'render_height']
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              14, 0, 14.5, ['get', 'render_min_height']
            ],
            'fill-extrusion-opacity': 0.95,
          }
        }, symId); // ← inserted BEFORE labels = names stay on top
      };

      if (map.isStyleLoaded()) {
        addBuildingLayer();
      } else {
        map.once('style.load', addBuildingLayer);
      }

      // --- LIGHTING (Angled sun for dramatic 3D depth) ---
      map.setLight({
        anchor: 'map',
        color: isDark ? '#b0c4de' : '#ffffff',
        intensity: isDark ? 0.35 : 0.55,
        position: [1.5, 210, 30]
      });

      // SYNC Telemetry
      startWatchingLocation();
    });

    map.on('zoom', () => setZoom(map.getZoom()));

    return () => map.remove();
  }, [lat, lon, isDark]);

  // --- ZONE SYNC ---
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Update Heatmap Source
    const heatmapData = {
      type: 'FeatureCollection',
      features: zones.map(z => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [z.lon, z.lat] },
        properties: { weight: (z.density || 0.5) * 10 }
      }))
    };
    const source = mapRef.current.getSource('crowd-data');
    if (source) source.setData(heatmapData);

    // 2. Update Markers
    zones.forEach(z => {
      if (!z.lat || !z.lon) return;
      if (zoneMarkersRef.current[z.id]) {
        zoneMarkersRef.current[z.id].setLngLat([z.lon, z.lat]);
      } else {
        const marker = new maplibregl.Marker({ element: createZoneMarkerEl(z, () => onZoneClick(z)) })
          .setLngLat([z.lon, z.lat])
          .addTo(mapRef.current);
        zoneMarkersRef.current[z.id] = marker;
      }
    });

    // Cleanup missing zones
    Object.keys(zoneMarkersRef.current).forEach(id => {
      if (!zones.find(z => z.id === id)) {
        zoneMarkersRef.current[id].remove();
        delete zoneMarkersRef.current[id];
      }
    });

  }, [zones, onZoneClick]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative group shadow-premium border border-accent-blue/10 bg-slate-50">
      <div ref={containerRef} className="w-full h-full" />

      {/* ── SETTINGS DROP-DOWN ── */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`w-12 h-12 rounded-[1.2rem] border backdrop-blur-md shadow-2xl flex items-center justify-center transition-all duration-300 ${isDark
            ? 'bg-slate-900/90 border-slate-700 text-white hover:bg-slate-800'
            : 'bg-white/95 border-gray-100 text-slate-700 hover:bg-gray-50'
            } ${menuOpen ? 'rotate-90 scale-110 !border-accent-blue/50' : ''}`}
        >
          {menuOpen ? <X size={20} /> : <Settings size={20} />}
        </button>

        {menuOpen && (
          <div className={`mt-3 absolute top-12 right-0 w-72 rounded-1xl border shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-6 ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-white'
            }`}>
            <div className="pt-5 pb-4 px-6 flex items-center border-b border-theme-main/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Map Controls
              </p>
            </div>

            <div className="p-3 flex flex-col gap-1.5">
              <button
                onClick={() => { mapRef.current?.flyTo({ center: [lon, lat], zoom: 17.2, pitch: is3D ? 62 : 0, bearing: is3D ? -15 : 0 }); setMenuOpen(false); }}
                className={`group w-full flex items-center gap-4 px-6 py-4 text-sm font-bold rounded-[1.5rem] transition-all duration-200 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="p-2 bg-accent-blue/10 rounded-xl text-accent-blue group-hover:scale-110 transition-transform">
                  <Navigation2 size={18} />
                </div>
                <span>Go to Stadium</span>
              </button>

              <button
                onClick={() => {
                  if (userPos) {
                    mapRef.current?.flyTo({ center: [userPos.lng, userPos.lat], zoom: 18, pitch: is3D ? 45 : 0 });
                  } else {
                    alert("Location not found. Please enable GPS permissions.");
                  }
                  setMenuOpen(false);
                }}
                className={`group w-full flex items-center gap-4 px-6 py-4 text-sm font-bold rounded-[1.5rem] transition-all duration-200 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                  <Compass size={18} />
                </div>
                <span>My Location</span>
              </button>

              <button
                onClick={() => {
                  const next = !is3D; setIs3D(next);
                  mapRef.current?.easeTo({ pitch: next ? 62 : 0, bearing: next ? -15 : 0 });
                  setMenuOpen(false);
                }}
                className={`group w-full flex items-center justify-between px-6 py-4 text-sm font-bold rounded-[1.5rem] transition-all duration-200 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                    {is3D ? <Box size={18} /> : <Layers size={18} />}
                  </div>
                  <span>{is3D ? '3D Perspective' : '2D Perspective'}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${is3D ? 'bg-accent-blue shadow-[0_0_8px_rgba(26,115,232,1)]' : 'bg-slate-300'}`} />
              </button>

              <button
                onClick={() => {
                  if (userPos) {
                    const bounds = new maplibregl.LngLatBounds()
                      .extend([lon, lat])
                      .extend([userPos.lng, userPos.lat]);
                    mapRef.current?.fitBounds(bounds, { padding: 100 });
                  } else {
                    alert("Location not found yet.");
                  }
                  setMenuOpen(false);
                }}
                className={`group w-full flex items-center gap-4 px-6 py-4 text-sm font-bold rounded-[1.5rem] transition-all duration-200 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform">
                  <Maximize2 size={18} />
                </div>
                <span>Show Both Locations</span>
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('venueflow:reset'));
                  setMenuOpen(false);
                }}
                className="group w-full flex items-center gap-4 px-6 py-4 text-sm font-bold rounded-[1.5rem] text-rose-500 hover:bg-rose-50 transition-all duration-200"
              >
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 group-hover:rotate-180 transition-transform duration-500">
                  <RefreshCcw size={18} />
                </div>
                <span>Reset View</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ZOOM BUTTONS ── */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-12 h-12 rounded-[1.2rem] bg-white/90 border border-white shadow-premium flex items-center justify-center text-slate-600 backdrop-blur-xl hover:bg-accent-blue hover:text-white transition-all duration-300 group active:scale-90"
        >
          <Plus size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-12 h-12 rounded-[1.2rem] bg-white/90 border border-white shadow-premium flex items-center justify-center text-slate-600 backdrop-blur-xl hover:bg-accent-blue hover:text-white transition-all duration-300 group active:scale-90"
        >
          <Minus size={20} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}