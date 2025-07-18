import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { initializeMap, updateMapLayers, getHeatMapColor } from "@/lib/mapUtils";
import type { Map } from "leaflet";
import L from "leaflet";

interface MapContainerProps {
  selectedCrops: number[];
  selectedState: string;
  selectedRegion: string;
  selectedYear: number;
  selectedCompanies: number[];
  availableCrops: string[];
}

export default function MapContainer({
  selectedCrops,
  selectedState,
  selectedRegion,
  selectedYear,
  selectedCompanies,
  availableCrops,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const currentLayerRef = useRef<L.LayerGroup | null>(null);
  const currentLegendRef = useRef<L.Control | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = initializeMap(mapRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load crop data from JSON files
  const loadCropData = async (cropName: string) => {
    if (!cropName) return [];
    
    try {
      setIsLoading(true);
      
      // Convert crop name to filename
      const cropFilename = cropName.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[()]/g, '')
        .replace(/\*/g, '')
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n');

      const response = await fetch(`/data/${cropFilename}.json`);
      if (!response.ok) {
        throw new Error(`Falha ao carregar dados: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.features) {
        return [];
      }

      // Filter data based on selected state and region
      let filteredFeatures = data.features;
      
      if (selectedState && selectedState !== 'all') {
        filteredFeatures = filteredFeatures.filter((f: any) => f.properties.state === selectedState);
      }
      
      if (selectedRegion && selectedRegion !== 'all') {
        filteredFeatures = filteredFeatures.filter((f: any) => f.properties.region === selectedRegion);
      }

      return filteredFeatures;
    } catch (error) {
      console.error('Erro ao carregar dados da cultura:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Falha ao carregar dados de produção da cultura",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Update map with heat map visualization
  const updateMapWithHeatMap = async (cropName: string) => {
    if (!mapInstanceRef.current) return;

    // Clear existing layers
    if (currentLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentLayerRef.current);
    }
    if (currentLegendRef.current) {
      mapInstanceRef.current.removeControl(currentLegendRef.current);
    }

    // Load crop data
    const features = await loadCropData(cropName);
    
    if (features.length === 0) {
      return;
    }

    // Create new layer group
    currentLayerRef.current = L.layerGroup();

    // Calculate min and max values for heat map
    const values = features.map((f: any) => f.properties.production || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Create heat map style markers
    features.forEach((feature: any) => {
      const { coordinates } = feature.geometry;
      const { municipality, state, production, hectares, region } = feature.properties;

      const lat = coordinates[1];
      const lng = coordinates[0];
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const color = getHeatMapColor(production, min, max);
        const normalizedValue = (production - min) / (max - min);
        const radius = Math.max(5, Math.min(25, 5 + normalizedValue * 20));

        const marker = L.circleMarker([lat, lng], {
          radius: radius,
          fillColor: color,
          color: '#fff',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        })
        .bindPopup(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-ferticore-green mb-2">${municipality}</h3>
            <p class="text-sm text-gray-600 mb-2">${state} - ${region}</p>
            <div class="space-y-1">
              <p><strong>Cultura:</strong> ${cropName}</p>
              <p><strong>Produção:</strong> ${production.toLocaleString('pt-BR')} toneladas</p>
              <p><strong>Hectares:</strong> ${hectares.toLocaleString('pt-BR')} ha</p>
              <p><strong>Ano:</strong> ${feature.properties.year}</p>
            </div>
          </div>
        `);
        
        currentLayerRef.current!.addLayer(marker);
      }
    });

    // Add heat map legend
    currentLegendRef.current = L.control({ position: 'bottomright' });
    (currentLegendRef.current as any).onAdd = function() {
      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = `
        <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 0 15px rgba(0,0,0,0.2);">
          <h4 style="margin: 0 0 10px 0; font-weight: bold; color: #166534;">Produção (toneladas)</h4>
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 18px; height: 18px; background-color: ${getHeatMapColor(max, min, max)}; border-radius: 50%;"></div>
              <span style="font-size: 12px; color: #374151;">${max.toLocaleString('pt-BR')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 18px; height: 18px; background-color: ${getHeatMapColor((max + min) / 2, min, max)}; border-radius: 50%;"></div>
              <span style="font-size: 12px; color: #374151;">${((max + min) / 2).toLocaleString('pt-BR')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 18px; height: 18px; background-color: ${getHeatMapColor(min, min, max)}; border-radius: 50%;"></div>
              <span style="font-size: 12px; color: #374151;">${min.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      `;
      return div;
    };
    currentLegendRef.current.addTo(mapInstanceRef.current);

    // Add the layer group to the map
    currentLayerRef.current.addTo(mapInstanceRef.current);
  };

  // Update map when selections change
  useEffect(() => {
    if (availableCrops.length > 0 && selectedCrops.length > 0) {
      const selectedCropIndex = selectedCrops[0];
      if (selectedCropIndex >= 0 && selectedCropIndex < availableCrops.length) {
        const cropName = availableCrops[selectedCropIndex];
        updateMapWithHeatMap(cropName);
      }
    }
  }, [selectedCrops, selectedState, selectedRegion, availableCrops]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-ferticore-green rounded-full animate-pulse"></div>
              <span className="text-gray-700">Carregando dados da cultura...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Map controls */}
      <div className="absolute bottom-4 left-4 space-y-2 z-[1000]">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => mapInstanceRef.current?.setView([-14.2350, -51.9253], 5)}
          className="bg-white p-2 rounded-md shadow-md hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
