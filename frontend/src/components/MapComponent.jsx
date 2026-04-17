import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const ZONE_COORDS = {
  'Zone A': [28.6139, 77.2090], // Central Delhi
  'Zone B': [28.5355, 77.2410], // South Delhi
  'Zone C': [28.6692, 77.2273], // North Delhi
  'Zone D': [28.6324, 77.1131], // West Delhi
  'Zone E': [28.6219, 77.3060], // East Delhi
};

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ data, ZONE_NAMES }) {
  const zones = Object.keys(ZONE_COORDS);
  const center = [28.6139, 77.2090]; // Default center (Delhi)

  return (
    <div className="glass-aurora p-2 rounded-[40px] overflow-hidden h-[400px] relative group border border-white/10">
      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: '100%', width: '100%', borderRadius: '32px' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {zones.map(zone => {
          const isAnomaly = data.recent[zone]?.is_anomaly;
          const pos = ZONE_COORDS[zone];
          const name = ZONE_NAMES[zone] || zone;

          // Custom colored icon for anomalies
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 rounded-full ${isAnomaly ? 'bg-primary/30 animate-ping' : 'bg-success/30'}"></div>
                <div class="relative w-4 h-4 rounded-full border-2 border-white ${isAnomaly ? 'bg-primary' : 'bg-success'}"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          return (
            <Marker key={zone} position={pos} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-2 min-w-[120px]">
                  <h4 className="font-black text-xs uppercase tracking-widest mb-1">{zone}</h4>
                  <p className="text-[10px] font-bold text-white/60 mb-2">{name}</p>
                  <div className="flex flex-col gap-1 border-t border-white/10 pt-2">
                    <div className="flex justify-between text-[10px]">
                      <span>Pressure</span>
                      <span className="font-bold text-primary">{data.recent[zone]?.pressure?.toFixed(2)} bar</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Status</span>
                      <span className={`font-bold ${isAnomaly ? 'text-primary' : 'text-success'}`}>
                        {isAnomaly ? 'ANOMALY' : 'OPTIMAL'}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Map Overlay Label */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-navy/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Geographic View</span>
              <h3 className="text-xl font-black hero-text text-white">Strategic Map</h3>
           </div>
        </div>
      </div>
    </div>
  );
}
