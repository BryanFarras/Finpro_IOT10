import { useEffect, useMemo, useState } from 'react';
import { fetchDevices, fetchDeviceDetail } from './lib/api';

const DEFAULT_POSITION = [-6.2, 106.816];

const mq2Badge = (value) => {
  if (value == null) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (value >= 2500) return 'bg-red-100 text-red-800 border-red-300';
  if (value >= 1500) return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-emerald-100 text-emerald-800 border-emerald-300';
};

function SensorCard({ title, value, suffix = '', highlight = false, icon }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${
        highlight ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{title}</p>
          <p className="mt-4 text-5xl font-extrabold tracking-tight text-slate-900">
            {value ?? '–'}
            {value != null && <span className="ml-2 text-3xl font-semibold text-slate-500">{suffix}</span>}
          </p>
        </div>
        {icon && (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-4xl shadow-inner">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceList({ devices, selectedId, onSelect }) {
  return (
    <div className="space-y-3">
      <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-blue-500">Device Fleet</h2>
      {devices.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12">
          <div className="text-center">
            <div className="mb-3 text-4xl">📡</div>
            <p className="text-sm font-bold text-slate-700">Tidak ada device yang terdeteksi</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Pastikan ESP32 sudah menyala dan terhubung</p>
          </div>
        </div>
      ) : (
        devices.map((device) => {
          const mq2 = device.mq2raw ?? -Infinity;
          const isGasCritical = mq2 > 2100; // threshold baru: 2100
          const isFlameAlert = Boolean(device.flame);
          const isAlert = isGasCritical || isFlameAlert;

          // Build className to clearly reflect alert vs selected state
          const baseClasses =
            'w-full rounded-xl border px-5 py-5 text-left shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]';
          const selectedClasses = selectedId === device.deviceId
            ? (isAlert ? 'ring-2 ring-red-100 border-red-400' : 'border-blue-300 ring-2 ring-blue-100')
            : (isAlert ? 'border-red-300 hover:border-red-400' : 'border-slate-200 hover:border-slate-300');
          const bgClass = isAlert ? 'bg-red-50' : 'bg-white';

          return (
            <button
              key={device.deviceId}
              onClick={() => onSelect(device.deviceId)}
              className={`${baseClasses} ${selectedClasses} ${bgClass}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`text-base font-bold ${isAlert ? 'text-red-800' : 'text-slate-900'}`}>{device.deviceId}</span>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${mq2Badge(device.mq2raw)}`}>
                  {device.mq2raw ?? '–'}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {device.updated ? new Date(device.updated).toLocaleTimeString() : 'No data'}
              </p>
            </button>
          );
        })
      )}
    </div>
  );
}

function StaticMap({ latitude, longitude, hasFix }) {
  const lat = hasFix ? latitude : DEFAULT_POSITION[0];
  const lng = hasFix ? longitude : DEFAULT_POSITION[1];
  const zoom = hasFix ? 14 : 3;

  // OpenStreetMap Static Map API via StaticMapLite or direct tile approach
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <iframe
      src={mapUrl}
      className="h-full w-full border-0"
      title="GPS Location Map"
      allowFullScreen
    />
  );
}

function DeviceDetail({ device }) {
  if (!device) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Select a device to view sensor data</p>
      </div>
    );
  }

  const { temp, humidity, mq2raw, mq2voltage, flame, gps, pump } = device;
  const hasFix = gps?.status === 'fix' && gps.latitude != null && gps.longitude != null;

  // Sama kriteria seperti card: alert jika flame atau mq2raw > 2100
  const mq2 = mq2raw ?? -Infinity;
  const isGasCritical = mq2 > 2100;
  const isFlameAlert = Boolean(flame);
  const isAlert = isGasCritical || isFlameAlert;

  // Jika backend kirimkan status pompa, normalisasi beberapa tipe (boolean / '1' / 1)
  const pumpActive = pump === true || pump === '1' || pump === 1;

  return (
    <div className="space-y-8">
      {isAlert && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold text-red-800 flex items-center gap-3">
          <span className="text-lg">🚨</span>
          <div>
            <div>Sistem penyiraman sedang menyala</div>
            {pump !== undefined && (
              <div className="mt-1 text-xs font-medium text-red-700">
                Status pompa: {pumpActive ? 'ON' : 'OFF'}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.12em] text-slate-700">Sensor Readings</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SensorCard title="Temperature" value={temp} suffix="°C" />
          <SensorCard title="Humidity" value={humidity} suffix="%" />
          <SensorCard title="Gas Level" value={mq2raw} highlight />
          <SensorCard title="Gas Voltage" value={mq2voltage} suffix="V" />
          <SensorCard title="Flame Status" value={flame ? 'ALERT' : 'Safe'} highlight={Boolean(flame)} />
          <SensorCard
            title="GPS Lock"
            value={gps?.status === 'fix' ? 'Active' : 'Searching'}
            highlight={gps?.status === 'fix'}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-8 py-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">GPS Location</h3>
          <p className="mt-1 font-mono text-sm font-medium text-slate-600">
            {hasFix ? `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}` : 'Waiting for satellite fix…'}
          </p>
        </div>
        <div className="h-[420px] bg-slate-100">
          <StaticMap
            latitude={gps?.latitude}
            longitude={gps?.longitude}
            hasFix={hasFix}
          />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          <h1 className="mb-4 text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
            ESP32 Fleet Dashboard
          </h1>
          <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-600">
            Real-time sensor telemetry from distributed nodes. Devices ranked by gas concentration for instant anomaly
            detection.
          </p>
        </header>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-300 bg-red-50 px-6 py-4 text-sm font-semibold text-red-800 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">Connecting to fleet…</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              <DeviceList devices={sortedDevices} selectedId={selectedId} onSelect={setSelectedId} />
            </aside>
            <main>
              <DeviceDetail device={activeDevice} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}