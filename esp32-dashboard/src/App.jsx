import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchDevices, fetchDeviceDetail } from './lib/api';

const markerIcon = L.icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = markerIcon;

const DEFAULT_POSITION = [-6.2, 106.816];

const mq2Badge = (value) => {
  if (value == null) return 'bg-slate-800 text-slate-300';
  if (value >= 2500) return 'bg-rose-500/20 text-rose-300 border border-rose-400/40';
  if (value >= 1500) return 'bg-amber-500/20 text-amber-200 border border-amber-400/30';
  return 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30';
};

function SensorCard({ title, value, suffix = '', highlight = false }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.9)] transition hover:border-emerald-400/70 hover:shadow-emerald-500/20 ${highlight ? 'border-emerald-400/70 shadow-emerald-500/20' : ''}`}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10 opacity-0 transition group-hover:opacity-100" />
      <div className="relative">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">{title}</h3>
        <p className="mt-3 text-3xl font-bold text-slate-50 drop-shadow">
          {value ?? '–'}{value != null ? suffix : ''}
        </p>
      </div>
    </div>
  );
}

function DeviceList({ devices, selectedId, onSelect }) {
  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <button
          key={device.deviceId}
          onClick={() => onSelect(device.deviceId)}
          className={`w-full rounded-2xl border px-5 py-4 text-left transition hover:border-emerald-400/70 hover:bg-slate-900/50 hover:shadow-lg hover:shadow-emerald-500/10 ${
            selectedId === device.deviceId
              ? 'border-emerald-500 bg-slate-900/70 shadow-lg shadow-emerald-500/20'
              : 'border-slate-700/70 bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-100">{device.deviceId}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${mq2Badge(device.mq2raw)}`}>
              MQ-2: {device.mq2raw ?? '–'}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">Updated • {device.updated ? new Date(device.updated).toLocaleTimeString() : '–'}</p>
        </button>
      ))}
    </div>
  );
}

function DeviceDetail({ device }) {
  if (!device) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/20">
        <p className="text-slate-500">Select a device to view sensor data.</p>
      </div>
    );
  }

  const { temp, humidity, mq2raw, mq2voltage, flame, gps } = device;
  const hasFix = gps?.status === 'fix' && gps.latitude != null && gps.longitude != null;
  const mapCenter = hasFix ? [gps.latitude, gps.longitude] : DEFAULT_POSITION;
  const zoom = hasFix ? 14 : 3;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <SensorCard title="Temperature" value={temp} suffix=" °C" />
        <SensorCard title="Humidity" value={humidity} suffix=" %" />
        <SensorCard title="MQ-2 Raw" value={mq2raw} highlight />
        <SensorCard title="MQ-2 Voltage" value={mq2voltage} suffix=" V" />
        <SensorCard title="Flame Detected" value={flame ? 'YES' : 'NO'} highlight={Boolean(flame)} />
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/60 backdrop-blur lg:col-span-2">
        <div className="border-b border-slate-700/60 bg-slate-900/70 px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">GPS Location</h3>
          <p className="mt-1 text-sm text-slate-300">{gps?.status ?? 'no-fix'}</p>
        </div>
        <div className="h-80">
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
            className="leaflet-map"
          >
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {hasFix && (
              <Marker position={[gps.latitude, gps.longitude]}>
                <Popup>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">{device.deviceId}</p>
                    <p>Lat: {gps.latitude.toFixed(6)}</p>
                    <p>Lng: {gps.longitude.toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeDevice, setActiveDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadDevices = async () => {
      try {
        const data = await fetchDevices();
        if (ignore) return;
        setDevices(data);
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0].deviceId);
        }
        setError(null);
      } catch (err) {
        if (!ignore) setError(err.message ?? 'Failed to fetch devices');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDevices();
    const interval = setInterval(loadDevices, 5000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setActiveDevice(null);
      return;
    }
    let ignore = false;

    const loadDetail = async () => {
      try {
        const detail = await fetchDeviceDetail(selectedId);
        if (!ignore) {
          setActiveDevice(detail);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err.message ?? 'Failed to fetch device detail');
      }
    };

    loadDetail();
    const interval = setInterval(loadDetail, 5000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [selectedId]);

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => (b.mq2raw ?? -Infinity) - (a.mq2raw ?? -Infinity));
  }, [devices]);

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-12">
      <div className="absolute inset-0 -z-10 rounded-3xl border border-slate-700/40 bg-slate-900/40 shadow-[0_40px_80px_-40px_rgba(14,165,233,0.45)] blur-3xl" />
      <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-400">Realtime Fleet Monitor</p>
          <h1 className="mt-2 text-3xl font-bold text-emerald-400 sm:text-4xl">ESP32 Environmental Dashboard</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300">
            Devices are sorted by MQ-2 gas intensity so anomalies surface instantly. Choose a node to dive into its sensors and live location.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
          {devices.length} active
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">Loading devices…</div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-[0_30px_60px_-40px_rgba(14,165,233,0.45)] backdrop-blur">
            <DeviceList devices={sortedDevices} selectedId={selectedId} onSelect={setSelectedId} />
          </aside>
          <main className="rounded-3xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-[0_30px_60px_-40px_rgba(16,185,129,0.45)] backdrop-blur">
            <DeviceDetail device={activeDevice} />
          </main>
        </div>
      )}
    </div>
  );
}
