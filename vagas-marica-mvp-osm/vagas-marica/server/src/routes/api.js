import { Router } from 'express';
import { ALLOWED_RADII_KM } from '../config.js';
import { resolveHome } from '../services/geocoding.js';
import { searchJobs } from '../services/jobsService.js';
import { FREELANCE_STATUS } from '../services/freelance.js';
import { isDemoEnabled } from '../services/demoJobs.js';
import { getCompany, listCompanies } from '../services/companiesService.js';
import { DEFAULT_REFERENCE, referenceList, resolveReference } from '../data/neighborhoods.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.get('/config', async (_req, res) => {
  const home = await resolveHome();
  if (home.error) return res.status(503).json({ error: home.error });
  res.json({
    home,
    radii: ALLOWED_RADII_KM,
    freelance: FREELANCE_STATUS,
    demoMode: isDemoEnabled(),
    // Locais de referência para o cálculo de distância (campo novo; "centro" é o padrão).
    references: referenceList(home),
    defaultReference: DEFAULT_REFERENCE,
  });
});

router.get('/jobs', async (req, res) => {
  const home = await resolveHome();
  if (home.error) return res.status(503).json({ error: home.error });

  const radiusKm = Number(req.query.radiusKm ?? 10);
  if (!ALLOWED_RADII_KM.includes(radiusKm)) {
    return res.status(400).json({ error: `radiusKm deve ser um de: ${ALLOWED_RADII_KM.join(', ')}.` });
  }
  // `ref` é opcional e só aceita identificadores da lista permitida (sem coordenadas livres).
  const reference = resolveReference(req.query.ref, home);
  if (!reference) {
    return res.status(400).json({ error: 'Local de referência inválido. Escolha um bairro da lista.' });
  }
  const q = String(req.query.q ?? '').trim().slice(0, 100);
  const type = ['all', 'job', 'freelance'].includes(req.query.type) ? req.query.type : 'all';
  const force = req.query.refresh === '1';

  try {
    const result = await searchJobs({
      q,
      radiusKm,
      type,
      force,
      center: { lat: reference.lat, lng: reference.lng, id: reference.id, name: reference.name, label: reference.label },
    });
    res.json(result);
  } catch (err) {
    console.error('[jobs]', err);
    res.status(500).json({ error: 'Erro inesperado ao buscar vagas. Tente novamente em instantes.' });
  }
});

// ----- Avaliações de empresas (dados SIMULADOS) -----
router.get('/companies', (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 80);
  const sector = String(req.query.sector ?? '').slice(0, 80);
  const sort = ['rating', 'popular', 'name'].includes(req.query.sort) ? req.query.sort : 'rating';
  res.json(listCompanies({ q, sector, sort }));
});

router.get('/companies/:id', (req, res) => {
  const data = getCompany(String(req.params.id).slice(0, 80));
  if (!data) return res.status(404).json({ error: 'Empresa não encontrada.' });
  res.json(data);
});

export default router;
