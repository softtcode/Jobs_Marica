// Testes com respostas simuladas APENAS para validar a lógica (nunca usadas pelo app).
import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm } from '../src/utils/geo.js';
import { normalizeAdzuna } from '../src/services/adzuna.js';
import { dedupe, partitionByDistance } from '../src/services/jobsService.js';
import { greenhouseContentToText } from '../src/utils/text.js';

test('haversine: 1° de latitude ≈ 111 km', () => {
  const d = haversineKm(0, 0, 1, 0);
  assert.ok(d > 110.5 && d < 111.8, String(d));
});

test('Adzuna: salário estimado não é exibido; coordenadas são aproximadas', () => {
  const j = normalizeAdzuna({
    id: '1', title: 'Atendente <strong>remoto</strong>', redirect_url: 'https://x/1',
    latitude: -22.9, longitude: -42.8, salary_min: 2000, salary_max: 2500, salary_is_predicted: '1',
    company: { display_name: 'ACME' }, location: { display_name: 'Maricá, RJ' },
  });
  assert.equal(j.salary, null);
  assert.equal(j.precision, 'approximate');
  assert.equal(j.mode, 'remote');
  assert.equal(j.title, 'Atendente remoto');
});

test('partition: fora do raio é descartada; sem coordenadas vai para unlocated', () => {
  const center = { lat: -22.9, lng: -42.8 };
  const jobs = [
    { title: 'a', lat: -22.9, lng: -42.8 },
    { title: 'b', lat: -22.0, lng: -42.8 },
    { title: 'c', lat: null, lng: null },
  ];
  const { located, unlocated } = partitionByDistance(jobs, center, 10);
  assert.equal(located.length, 1);
  assert.equal(unlocated.length, 1);
  assert.equal(unlocated[0].lat, null);
});

test('dedupe por título + empresa + local', () => {
  const a = { title: 'Vendedor', company: 'X', locationText: 'Maricá', url: 'https://a' };
  const b = { title: 'vendedor', company: 'x', locationText: 'Marica', url: 'https://b' };
  assert.equal(dedupe([a, b]).length, 1);
});

test('Greenhouse: HTML escapado vira texto', () => {
  assert.equal(greenhouseContentToText('&lt;p&gt;Olá &amp;amp; bem-vindo&lt;/p&gt;'), 'Olá & bem-vindo');
});
