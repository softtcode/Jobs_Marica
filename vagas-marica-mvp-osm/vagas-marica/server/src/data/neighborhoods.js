/**
 * Pontos APROXIMADOS de referência de bairros de Maricá (RJ). Usados para:
 *  - posicionar as vagas demonstrativas no mapa;
 *  - servir de "local de referência" escolhido pelo candidato para calcular distâncias.
 * Não representam endereços comerciais. Coordenadas em graus decimais (WGS84), arredondadas a ~100 m.
 * É a ÚNICA fonte de coordenadas de bairros: o frontend recebe a lista por /api/config.
 */
export const NEIGHBORHOODS = {
  'Centro': [-22.9195, -42.8190],
  'Itaipuaçu': [-22.9600, -42.9700],
  'Inoã': [-22.9180, -42.9150],
  'São José do Imbassaí': [-22.9330, -42.8660],
  'Ponta Negra': [-22.9560, -42.6920],
  'Cordeirinho': [-22.9530, -42.7480],
  'Barra de Maricá': [-22.9600, -42.8450],
  'Itapeba': [-22.9290, -42.8380],
  'Araçatiba': [-22.9260, -42.8030],
  'Ubatiba': [-22.8800, -42.8150],
  'Jaconé': [-22.9380, -42.6300],
  'Flamengo': [-22.9080, -42.8290],
  'Guaratiba': [-22.9480, -42.7950],
  'Bambuí': [-22.9390, -42.7720],
};

// Envelope aproximado do município (usado nos testes para validar as coordenadas).
export const MARICA_BOUNDS = { minLat: -23.0, maxLat: -22.83, minLng: -43.02, maxLng: -42.58 };

export const neighborhoodId = (name) => name.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const DEFAULT_REFERENCE = 'centro';

/**
 * Locais de referência permitidos. "Centro" usa o ponto da Casa do Trabalhador (`home`),
 * mantendo o comportamento original como padrão.
 */
export function referenceList(home) {
  const list = Object.entries(NEIGHBORHOODS)
    .filter(([name]) => name !== 'Centro')
    .map(([name, [lat, lng]]) => ({ id: neighborhoodId(name), name, lat, lng, approximate: true }));
  list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return [
    { id: DEFAULT_REFERENCE, name: 'Centro', label: 'Centro (Casa do Trabalhador)', lat: home.lat, lng: home.lng, approximate: !home.verified, isHome: true },
    ...list.map((n) => ({ ...n, label: n.name })),
  ];
}

/** Valida o identificador recebido pela API contra a lista permitida. Nunca aceita coordenadas livres. */
export function resolveReference(id, home) {
  const wanted = id ? String(id).trim().toLowerCase() : DEFAULT_REFERENCE;
  return referenceList(home).find((r) => r.id === wanted) || null;
}
