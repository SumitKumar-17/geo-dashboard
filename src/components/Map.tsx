'use client';

import { MapContainer, TileLayer, FeatureGroup, Polygon as LeafletPolygon, Tooltip, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L, { LatLngExpression } from 'leaflet';
import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Legend = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const legend = new L.Control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend bg-white p-3 rounded-lg shadow-lg');
      const grades = [0, 10, 25];
      const colors = ['#3b82f6', '#22c55e', '#ef4444'];
      const labels = ['< 10°C', '10-25°C', '> 25°C'];

      div.innerHTML = '<h4 class="font-bold mb-2">Temperature</h4>';
      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<div class="flex items-center">' +
          `<i class="w-4 h-4 mr-2" style="background:${colors[i]}"></i>` +
          `<span>${labels[i]}</span></div>`;
      }
      return div;
    };
    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};


const MapComponent = () => {
  const polygons = useAppStore((state) => state.polygons);
  const { addPolygon, updatePolygonShape, removePolygon } = useAppStore();

  const handlePolygonCreated = (e: any) => {
    const { layer } = e;
    addPolygon({ id: L.stamp(layer).toString(), latlngs: layer.getLatLngs()[0] });
  };

  const handleEdited = (e: any) => {
    e.layers.eachLayer((layer: any) => {
      updatePolygonShape(L.stamp(layer).toString(), layer.getLatLngs()[0]);
    });
  };

  const handleDeleted = (e: any) => {
    e.layers.eachLayer((layer: any) => removePolygon(L.stamp(layer).toString()));
  };

  return (
    <MapContainer center={[48.8566, 2.3522]} zoom={4} style={{ height: '100%', width: '100%', background: '#f0f0f0' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FeatureGroup>
        <EditControl
          position="topright"
          onCreated={handlePolygonCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
          draw={{
            rectangle: false, circle: false, circlemarker: false, marker: false, polyline: false,
          }}
        />
      </FeatureGroup>

      {Object.values(polygons).map((p) => (
        <LeafletPolygon key={p.id} positions={p.latlngs} pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.6 }}>
          <Tooltip permanent>
            <div className="text-center">
              <div className="font-bold">{p.name}</div>
              <div>{p.isLoading ? 'Loading...' : p.fetchedTemp !== null ? `${p.fetchedTemp.toFixed(1)}°C` : 'No data'}</div>
            </div>
          </Tooltip>
        </LeafletPolygon>
      ))}
      <Legend />
    </MapContainer>
  );
};

export default MapComponent;