import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function initializeMap(container: HTMLElement): L.Map {
  const map = L.map(container).setView([-14.2350, -51.9253], 5);
  
  // Add grayscale base layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  return map;
}

export function getHectareRanges() {
  return [
    { min: 0, max: 72000, label: '0,000 - 72,000' },
    { min: 72001, max: 360000, label: '72,001 - 360,000' },
    { min: 360001, max: 800000, label: '360,001 - 800,000' },
    { min: 800001, max: 1300000, label: '800,001 - 1,300,000' },
    { min: 1300001, max: 2500000, label: '1,300,001 - 2,500,000' },
    { min: 2500001, max: 5550000, label: '2,500,001 - 5,550,000' },
    { min: 5550001, max: 10000000, label: '5,550,001+' },
  ];
}

export function getColorForHectares(hectares: number): string {
  if (hectares <= 72000) return '#e5e7eb';
  if (hectares <= 360000) return '#bbf7d0';
  if (hectares <= 800000) return '#86efac';
  if (hectares <= 1300000) return '#4ade80';
  if (hectares <= 2500000) return '#22c55e';
  if (hectares <= 5550000) return '#16a34a';
  return '#15803d';
}

// Heat map style color calculation
export function getHeatMapColor(value: number, min: number, max: number): string {
  if (max === min) return '#FF0000'; // Red for single value
  
  const normalized = (value - min) / (max - min);
  const hue = (1 - normalized) * 120; // From green (120) to red (0)
  return `hsl(${hue}, 70%, 50%)`;
}

export function getRadiusForHectares(hectares: number): number {
  if (hectares <= 72000) return 8;
  if (hectares <= 360000) return 10;
  if (hectares <= 800000) return 12;
  if (hectares <= 1300000) return 14;
  if (hectares <= 2500000) return 16;
  if (hectares <= 5550000) return 18;
  return 20;
}

let currentLayerGroup: L.LayerGroup | null = null;

export function updateMapLayers(map: L.Map, data: {
  productionData: any[];
  companyLocations: any[];
}) {
  // Clear existing layers
  if (currentLayerGroup) {
    map.removeLayer(currentLayerGroup);
  }

  currentLayerGroup = L.layerGroup();

  // Add production data
  data.productionData?.forEach((item) => {
    const { municipality, crop, hectares } = item;
    
    if (municipality.latitude && municipality.longitude) {
      const lat = parseFloat(municipality.latitude);
      const lng = parseFloat(municipality.longitude);
      const hectareValue = parseFloat(hectares);
      
      const color = getColorForHectares(hectareValue);
      const radius = getRadiusForHectares(hectareValue);
      
      const circle = L.circleMarker([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: radius,
        weight: 2
      }).bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-gray-800">${municipality.name}</h3>
          <p class="text-sm text-gray-600">${municipality.state.name}</p>
          <p class="text-sm text-gray-600">${crop.name}</p>
          <p class="text-sm font-medium text-green-600">${hectareValue.toLocaleString('pt-BR')} hectares</p>
        </div>
      `);
      
      currentLayerGroup.addLayer(circle);
    }
  });

  // Add company locations
  data.companyLocations?.forEach((location) => {
    if (location.latitude && location.longitude) {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div style="background-color: ${location.company.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: 'company-marker',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })
      }).bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-gray-800">${location.company.name}</h3>
          <p class="text-sm text-gray-600">${location.name || 'Localização'}</p>
          <p class="text-sm text-gray-600">${location.municipality?.name || ''}</p>
        </div>
      `);
      
      currentLayerGroup.addLayer(marker);
    }
  });

  currentLayerGroup.addTo(map);
}
