import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { AttributionControl, Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { groupByCoordinate, groupIsExact } from '../../utils/geo.js';

const TILE_URL = import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  import.meta.env.VITE_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const ICON_BRIEFCASE =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
const ICON_HOME =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>';

// Ícones são divIcons (HTML + CSS do app): não dependem de imagens do Leaflet,
// o que evita o problema clássico de ícones quebrados no bundler (Vite).
const homeIcon = L.divIcon({
  className: '',
  html: `<div class="pin-home">${ICON_HOME}</div>`,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

function pinIcon(group, selected) {
  const exact = groupIsExact(group);
  const cls = ['pin', exact ? 'pin--exact' : 'pin--approx', selected ? 'pin--selected' : ''].join(' ');
  const inner = group.jobs.length > 1 ? `<span>${group.jobs.length}</span>` : ICON_BRIEFCASE;
  return L.divIcon({ className: '', html: `<div class="${cls}">${inner}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] });
}

function clusterIcon(cluster) {
  return L.divIcon({
    className: '',
    html: `<div class="pin pin--cluster"><span>${cluster.getChildCount()}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Enquadra o mapa no círculo de abrangência sempre que o raio (ou o centro) muda. */
function FitToRadius({ center, radiusKm }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLng(center).toBounds(radiusKm * 2000); // lado do quadrado = 2 × raio
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, center, radiusKm]);
  return null;
}

/** Recalcula o tamanho do mapa quando o contêiner muda (mobile, painéis, rotação da tela). */
function InvalidateSizeOnResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    map.invalidateSize();
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Centraliza na vaga selecionada (pelo cartão da lista ou pelo marcador), aproximando se preciso. */
function PanToSelected({ target, occludeRight }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const zoom = Math.max(map.getZoom(), 13);
    // Se um painel cobre a lateral direita, centraliza o marcador na área que continua visível.
    const width = map.getSize().x;
    const shift = occludeRight && width - occludeRight > 240 ? occludeRight / 2 : 0;
    const center = shift
      ? map.unproject(map.project([target.lat, target.lng], zoom).add([shift, 0]), zoom)
      : L.latLng(target.lat, target.lng);
    if (reducedMotion()) map.setView(center, zoom);
    else map.flyTo(center, zoom, { duration: 0.6 });
  }, [map, target, occludeRight]);
  return null;
}

/**
 * Avisa quando os tiles do mapa-base não carregam (sem internet, bloqueio etc.) e tenta de novo
 * sozinho quando a conexão volta. Os tiles NÃO são baixados para uso offline: o servidor público
 * do OpenStreetMap não permite download em massa.
 */
function TileStatus({ onChange }) {
  const failures = useRef(0);
  const layerRef = useRef(null);
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) onChange(true);
    const onOnline = () => { failures.current = 0; layerRef.current?.redraw(); };
    const onOffline = () => onChange(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [onChange]);
  return (
    <TileLayer
      ref={layerRef}
      url={TILE_URL}
      attribution={TILE_ATTRIBUTION}
      maxZoom={19}
      eventHandlers={{
        tileerror: () => { failures.current += 1; if (failures.current >= 3) onChange(true); },
        tileload: () => { failures.current = 0; onChange(false); },
      }}
    />
  );
}

const MapOffIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.43 2.43 9 2.6l6 2.4 6-2.4V17M2 6.6v14.8l6-2.4 6 2.4 2.5-1" /><path d="M9 2.6v6.4M15 5v5" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

function markerLabel(group) {
  const kind = groupIsExact(group) ? 'localização precisa' : 'localização aproximada';
  return group.jobs.length > 1
    ? `${group.jobs.length} vagas neste ponto (${kind})`
    : `${group.jobs[0].title} (${kind})`;
}

/**
 * Mapa de vagas. Somente vagas com coordenadas válidas viram marcadores;
 * vagas na mesma coordenada são agrupadas (sem deslocar pontos artificialmente).
 * O marcador selecionado fica fora do agrupamento para estar sempre visível.
 */
export default function MapView({ reference, radiusKm, jobs, selectedId, onSelectGroup, occludeRight = 0, offlineAction }) {
  const [tilesFailed, setTilesFailed] = useState(false);
  // Centro do mapa e do círculo de raio = bairro de referência escolhido.
  const center = useMemo(() => [reference.lat, reference.lng], [reference.lat, reference.lng]);
  const home = { name: `Referência: ${reference.label || reference.name}` };
  const groups = useMemo(() => groupByCoordinate(jobs), [jobs]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.jobs.some((j) => j.id === selectedId)) || null,
    [groups, selectedId],
  );
  // Ícones criados uma única vez por conjunto de vagas (evita setIcon em todo render).
  const icons = useMemo(() => new Map(groups.map((g) => [g.key, pinIcon(g, false)])), [groups]);
  const selectedIcon = useMemo(() => (selectedGroup ? pinIcon(selectedGroup, true) : null), [selectedGroup]);
  const panTarget = useMemo(
    () => (selectedGroup ? { lat: selectedGroup.lat, lng: selectedGroup.lng } : null),
    [selectedGroup],
  );

  return (
    <div className="relative isolate h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        zoomControl
        attributionControl={false}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="Mapa de vagas"
      >
        <AttributionControl position="bottomleft" prefix={false} />
        <TileStatus onChange={setTilesFailed} />
        <InvalidateSizeOnResize />
        <FitToRadius center={center} radiusKm={radiusKm} />
        <PanToSelected target={panTarget} occludeRight={occludeRight} />

        <Circle
          center={center}
          radius={radiusKm * 1000}
          interactive={false}
          pathOptions={{ color: '#2563EB', weight: 2, opacity: 0.85, dashArray: '6 6', fillColor: '#2563EB', fillOpacity: 0.06 }}
        />

        <Marker position={center} icon={homeIcon} zIndexOffset={-1000} title={home.name} alt={home.name} />

        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={50}
          iconCreateFunction={clusterIcon}
        >
          {groups.filter((g) => g !== selectedGroup).map((group) => {
            const label = markerLabel(group);
            return (
              <Marker
                key={group.key}
                position={[group.lat, group.lng]}
                icon={icons.get(group.key)}
                title={label}
                alt={label}
                keyboard
                eventHandlers={{ click: () => onSelectGroup(group) }}
              />
            );
          })}
        </MarkerClusterGroup>

        {selectedGroup && (
          <Marker
            key={`sel-${selectedGroup.key}`}
            position={[selectedGroup.lat, selectedGroup.lng]}
            icon={selectedIcon}
            zIndexOffset={1500}
            title={`Selecionada: ${markerLabel(selectedGroup)}`}
            alt={`Selecionada: ${markerLabel(selectedGroup)}`}
            eventHandlers={{ click: () => onSelectGroup(selectedGroup) }}
          />
        )}
      </MapContainer>

      {tilesFailed && (
        // Sem mapa-base, os marcadores ficariam soltos num fundo vazio: cobrimos o mapa com uma
        // mensagem clara. A lista continua funcionando com cargo, bairro e distância.
        <div role="alert" className="absolute inset-0 z-[700] grid place-items-center bg-surface/95 p-6 backdrop-blur-sm">
          <div className="max-w-sm text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-muted shadow-card" aria-hidden="true">
              <MapOffIcon />
            </span>
            <p className="mt-4 font-display text-base font-bold text-ink">Não foi possível carregar o mapa.</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              As vagas continuam disponíveis na lista, com bairro e distância. O mapa volta sozinho quando a conexão
              for restabelecida.
            </p>
            {offlineAction && <div className="mt-4 flex justify-center">{offlineAction}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
