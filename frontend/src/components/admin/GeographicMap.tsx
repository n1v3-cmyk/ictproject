'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FeedbackRecord } from '@/types/feedback';
import { KERALA_DISTRICTS } from '@/data/keralaData';

interface GeographicMapProps {
  feedbacks: FeedbackRecord[];
  selectedDistrict: string;
}

export default function GeographicMap({ feedbacks, selectedDistrict }: GeographicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center of Kerala
    const map = L.map(mapContainerRef.current, {
      center: [10.4, 76.3],
      zoom: 7.5,
      minZoom: 6.5,
      maxZoom: 14,
      scrollWheelZoom: true,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & View when feedbacks or selectedDistrict changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Group feedbacks by district or local coordinates
    const districtAggregates: Record<
      string,
      {
        district: string;
        coordinates: [number, number];
        feedbacks: FeedbackRecord[];
        avgRating: number;
        negativeCount: number;
        positiveCount: number;
        neutralCount: number;
      }
    > = {};

    feedbacks.forEach((f) => {
      const dist = f.location.district;
      const coords = f.location.coordinates || KERALA_DISTRICTS[dist]?.coordinates || [10.0, 76.3];

      if (!districtAggregates[dist]) {
        districtAggregates[dist] = {
          district: dist,
          coordinates: coords,
          feedbacks: [],
          avgRating: 0,
          negativeCount: 0,
          positiveCount: 0,
          neutralCount: 0,
        };
      }

      districtAggregates[dist].feedbacks.push(f);
      if (f.sentiment === 'negative') districtAggregates[dist].negativeCount += 1;
      if (f.sentiment === 'positive') districtAggregates[dist].positiveCount += 1;
      if (f.sentiment === 'neutral') districtAggregates[dist].neutralCount += 1;
    });

    // Calculate averages and add markers
    Object.values(districtAggregates).forEach((group) => {
      const count = group.feedbacks.length;
      if (count === 0) return;

      const totalRating = group.feedbacks.reduce((acc, curr) => acc + curr.overallRating, 0);
      group.avgRating = Number((totalRating / count).toFixed(1));

      // Determine hotspot status based on negative count & avg rating
      let pinColor = '#22C55E'; // green
      let badgeLabel = 'High Satisfaction';

      if (group.avgRating < 2.8 || group.negativeCount / count >= 0.4) {
        pinColor = '#EF4444'; // red (friction hotspot)
        badgeLabel = 'Frequent Issue Concentration';
      } else if (group.avgRating < 3.8 || group.negativeCount > 0) {
        pinColor = '#F59E0B'; // amber (moderate/mixed)
        badgeLabel = 'Mixed Experience';
      }

      // Modern Custom DivIcon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${pinColor}; opacity: 0.25;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background-color: ${pinColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white;">
              ${group.avgRating}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      // Marker
      const marker = L.marker(group.coordinates, { icon: customIcon });

      // Recent feedback snippet
      const latest = group.feedbacks[0];

      // Popup content
      const popupHtml = `
        <div style="font-family: inherit; min-width: 230px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F0F2F0; padding-bottom: 8px; margin-bottom: 8px;">
            <strong style="font-size: 14px; color: #1F2421;">${group.district}</strong>
            <span style="font-size: 11px; font-weight: 600; color: ${pinColor};">${badgeLabel}</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
            <div style="background: #F9F9F8; padding: 6px; border-radius: 6px;">
              <span style="color: #6E7571; display: block;">Total Reviews:</span>
              <strong style="font-size: 13px; color: #1F2421;">${count}</strong>
            </div>
            <div style="background: #F9F9F8; padding: 6px; border-radius: 6px;">
              <span style="color: #6E7571; display: block;">Average Rating:</span>
              <strong style="font-size: 13px; color: #1F2421;">★ ${group.avgRating} / 5</strong>
            </div>
          </div>

          <div style="font-size: 11px; color: #46664F; margin-bottom: 8px;">
            Positive: <strong>${group.positiveCount}</strong> | Neutral: <strong>${group.neutralCount}</strong> | Negative: <strong style="color: #EF4444;">${group.negativeCount}</strong>
          </div>

          <div style="border-top: 1px dashed #E5E9E6; padding-top: 6px; font-size: 11px; color: #555;">
            <span style="color: #888; font-size: 10px; display: block;">Latest report:</span>
            "${latest?.summaryComment || 'Service interaction recorded'}"
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      layer.addLayer(marker);
    });

    // If specific district is selected, pan map to it
    if (selectedDistrict !== 'all' && KERALA_DISTRICTS[selectedDistrict]) {
      const coords = KERALA_DISTRICTS[selectedDistrict].coordinates;
      map.flyTo(coords, 10, { duration: 1.2 });
    }
  }, [feedbacks, selectedDistrict]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />;
}
