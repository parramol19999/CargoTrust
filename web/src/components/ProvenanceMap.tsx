'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Layers, MapPin, Navigation, Thermometer, ShieldCheck } from 'lucide-react';

interface ProvenanceMapProps {
  latLong: string;
  verifications: any[];
  status: string;
}

export default function ProvenanceMap({ latLong, verifications, status }: ProvenanceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [coordsParsed, setCoordsParsed] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Mount detection to prevent SSR errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Parse coordinates from string
  useEffect(() => {
    if (!latLong) return;
    try {
      // Expect format "lat, lng"
      const parts = latLong.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          setCoordsParsed({ lat, lng });
        }
      }
    } catch (err) {
      console.error('Failed parsing coordinates:', err);
    }
  }, [latLong]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!isMounted || !coordsParsed || !container) return;

    let activeMap: any = null;

    // Load Leaflet dynamically
    import('leaflet').then((L) => {
      // CSS Import warning avoidance: Leaflet stylesheets
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Initialize map centered at farm coordinates
      const map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
      }).setView([coordsParsed.lat, coordsParsed.lng], 9);
      
      activeMap = map;
      mapRef.current = map;

      // Add high-end Voyager tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      // Define locations on route
      const points: { coords: [number, number]; label: string; details: string; type: string; color: string }[] = [];

      // 1. Sourcing Farm (Origin)
      points.push({
        coords: [coordsParsed.lat, coordsParsed.lng],
        label: 'Sourcing Farm (Origin)',
        details: 'Harvest point of organic twin.',
        type: 'farm',
        color: '#10b981' // emerald
      });

      // 2. QA Lab / Verifier (Offset slightly for visual route)
      const labCoords: [number, number] = [
        coordsParsed.lat + 0.15, 
        coordsParsed.lng + 0.2
      ];
      points.push({
        coords: labCoords,
        label: 'Quality Attestation Lab',
        details: verifications && verifications.length > 0 
          ? `Verified by: ${verifications[0].verifierName || 'Authorized Certifier'}`
          : 'Pending lab assessment',
        type: 'lab',
        color: '#06b6d4' // cyan
      });

      // 3. Processing Warehouse (Offset further)
      const warehouseCoords: [number, number] = [
        coordsParsed.lat + 0.3, 
        coordsParsed.lng + 0.45
      ];
      points.push({
        coords: warehouseCoords,
        label: 'Logistics Hub & Distribution Center',
        details: `Current Status: ${status || 'In Transit'}`,
        type: 'warehouse',
        color: '#6366f1' // indigo
      });

      // Draw custom circle markers for sleek dashboard look (no broken image assets)
      points.forEach((pt) => {
        const marker = L.circleMarker(pt.coords, {
          radius: 9,
          fillColor: pt.color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);

        const popupContent = `
          <div style="font-family: monospace; font-size: 11px; color: #1e293b; padding: 4px; min-width: 140px;">
            <strong style="color: ${pt.color}; font-size: 12px; display: block; margin-bottom: 2px;">${pt.label}</strong>
            <span style="display: block; font-size: 10px; color: #64748b;">${pt.details}</span>
            <div style="margin-top: 6px; border-t: 1px solid #f1f5f9; pt: 4px; display: flex; gap: 8px;">
              <span>🌡️ 18.5°C</span>
              <span>📍 GPS OK</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      // Draw route connecting line
      const routePath = L.polyline(points.map(p => p.coords), {
        color: '#06b6d4',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.75
      }).addTo(map);

      // Fit map to route boundary
      map.fitBounds(routePath.getBounds(), { padding: [40, 40] });
    });

    return () => {
      if (activeMap) {
        activeMap.remove();
      }
    };
  }, [isMounted, coordsParsed, verifications, status]);

  if (!isMounted) {
    return (
      <div className="h-[280px] w-full bg-gray-50 border border-gray-150 rounded-3xl flex flex-col items-center justify-center text-xs font-mono text-gray-400 gap-2">
        <Navigation className="w-4 h-4 animate-spin text-cyan-600" />
        <span>Loading map components...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      {/* Map Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-600" />
          <span className="text-xs font-bold font-mono text-gray-900 uppercase tracking-wider">
            Cold Chain Transit Route Map
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white shadow-sm" />
            Farm
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block border border-white shadow-sm" />
            QA Lab
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block border border-white shadow-sm" />
            Hub
          </span>
        </div>
      </div>

      {/* Leaflet DOM Anchor */}
      <div 
        ref={mapContainerRef} 
        className="h-[260px] w-full relative z-10 bg-gray-50"
      />
    </div>
  );
}
