import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Banknote, Briefcase, Building2, CalendarDays, Check, CheckCircle2, CircleHelp, Clock, ExternalLink,
  FlaskConical, Globe2, GraduationCap, HelpCircle, Link2, Map as MapIcon, MapPin, Navigation, Tag, X,
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Drawer from '../ui/Drawer.jsx';
import { CompanyAvatar, MatchScore } from './JobCard.jsx';
import { CRITERIA_LABELS, MATCH_CONFIG } from '../../services/matchingService.js';
import {
  NOT_INFORMED, formatDate, formatDistance, fromPlace, formatSalary, MODE_LABEL, PRECISION_LABEL, TYPE_LABEL,
} from '../../utils/format.js';

function Fact({ icon: Icon, label, children }) {
  const known = children != null && children !== '' && children !== false;
  return (
    <div className="flex gap-3 rounded-xl bg-surface p-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
        <dd className={`mt-0.5 text-sm font-semibold ${known ? 'text-ink' : 'font-normal text-slate-400'}`}>
          {known ? children : NOT_INFORMED}
        </dd>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-sm font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Bullets({ items, icon: Icon = Check, tone = 'text-brand' }) {
  return (
    <ul className="space-y-1.5 text-sm leading-relaxed text-slate-700">
      {items.map((t) => (
        <li key={t} className="flex gap-2"><Icon size={15} className={`mt-1 shrink-0 ${tone}`} aria-hidden="true" />{t}</li>
      ))}
    </ul>
  );
}

function Chips({ items, tone = 'gray' }) {
  return <div className="flex flex-wrap gap-1.5">{items.map((s) => <Badge key={s} tone={tone}>{s}</Badge>)}</div>;
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  if (!navigator.clipboard) return null;
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      }).catch(() => {})}
      className="btn btn-outline h-12 w-12 shrink-0 p-0"
      aria-label={copied ? 'Link copiado' : 'Copiar link desta vaga'}
      title={copied ? 'Link copiado' : 'Copiar link desta vaga'}
    >
      {copied ? <Check size={18} className="text-success" aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
    </button>
  );
}

// Motivos agrupados pelo que, no perfil, contribuiu para a recomendação.
const REASON_GROUPS = [
  { title: 'Competências identificadas no seu perfil', kinds: ['skill'] },
  { title: 'Perfil, formação e experiência', kinds: ['area', 'role', 'education', 'experience'] },
  { title: 'Preferências compatíveis', kinds: ['preference', 'location'] },
];

/** Explicação da compatibilidade: pontuação, motivos, requisitos não identificados e critérios. */
function MatchSection({ match }) {
  return (
    <section className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand-soft/60 to-white p-4" aria-labelledby="match-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="match-title" className="font-display text-sm font-bold text-ink">Compatibilidade estimada</h3>
        <MatchScore score={match.score} size="lg" />
      </div>
      <p className="mt-1 text-xs text-muted">
        Estimativa por regras a partir do seu currículo — não é a probabilidade de contratação.
        {match.score >= MATCH_CONFIG.threshold ? ' Aparece em “Para Você”.' : ` Abaixo de ${MATCH_CONFIG.threshold}%: aparece em “Outras Vagas”.`}
      </p>

      {match.unmetRequired.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-warning-soft p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-900"><AlertTriangle size={15} aria-hidden="true" /> Requisitos obrigatórios não identificados no currículo</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-6 text-[13px] text-amber-900">{match.unmetRequired.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}

      {REASON_GROUPS.map(({ title, kinds }) => {
        const items = match.reasons.filter((r) => kinds.includes(r.kind)).map((r) => r.text);
        return items.length ? (
          <div key={title} className="mt-3">
            <p className="text-[13px] font-semibold text-ink">{title}</p>
            <div className="mt-1.5"><Bullets items={items} icon={CheckCircle2} tone="text-success" /></div>
          </div>
        ) : null;
      })}
      {match.reasons.length === 0 && (
        <p className="mt-3 text-[13px] text-slate-600">Nenhuma informação do seu perfil coincide com esta vaga.</p>
      )}

      {(match.missingDesired.length > 0 || match.toConfirm.length > 0) && (
        <div className="mt-3">
          <p className="text-[13px] font-semibold text-ink">Possíveis requisitos não identificados</p>
          <div className="mt-1.5">
            <Bullets items={[...match.missingDesired.map((s) => `${s} (desejável)`), ...match.toConfirm.map((t) => `${t} — não foi possível verificar`)]} icon={CircleHelp} tone="text-slate-400" />
          </div>
        </div>
      )}

      <details className="mt-3 text-[13px]">
        <summary className="cursor-pointer font-semibold text-brand-dark">Ver pontos por critério</summary>
        <dl className="mt-2 space-y-1.5">
          {Object.entries(match.breakdown).map(([k, b]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-slate-600">{CRITERIA_LABELS[k]} <span className="text-slate-400">(peso {b.weight})</span></dt>
              <dd className="font-semibold text-ink">{b.points == null ? 'vaga não informa' : `${b.points}/${b.weight}`}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted">Critérios que a vaga não informa ficam fora do cálculo, e os demais pesos são reescalados.</p>
      </details>
    </section>
  );
}

function DetailsContent({ job, match, onClose, mapHref, onShowOnMap, closeRef, referenceName }) {
  const [howOpen, setHowOpen] = useState(false);
  const approx = job.precision !== 'exact';
  const contract = [job.contractType, job.contractTime].filter(Boolean).join(' · ');
  const distance = formatDistance(job.distanceKm, approx);
  const hasCoords = job.lat != null && job.lng != null;
  const salary = formatSalary(job.salary);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative border-b border-line bg-gradient-to-b from-brand-soft/60 to-white p-5">
        <button
          ref={closeRef} type="button" onClick={onClose} aria-label="Fechar detalhes"
          className="btn btn-ghost absolute right-3 top-3 h-10 w-10 bg-white/70 p-0"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <CompanyAvatar name={job.company} size="lg" />
        <h2 className="mt-3 pr-10 text-xl font-extrabold leading-tight text-ink">{job.title}</h2>
        <p className="mt-1 text-sm font-medium text-muted">
          {job.company || 'Empresa não informada'}{job.companyIsFictional && ' · empresa fictícia'}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.isDemo && <Badge tone="dark" icon={FlaskConical}>Vaga demonstrativa</Badge>}
          <Badge tone="brand">{job.isDemo ? job.contractType : TYPE_LABEL[job.type]}</Badge>
          {job.mode && <Badge>{MODE_LABEL[job.mode]}</Badge>}
          <Badge tone={job.precision === 'approximate' ? 'outline' : 'gray'}>{PRECISION_LABEL[job.precision]}</Badge>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        {match && <MatchSection match={match} />}

        <dl className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Fact icon={Banknote} label="Remuneração">{salary ? `${salary}${job.isDemo ? ' (fictício)' : ''}` : job.salaryNote}</Fact>
          <Fact icon={Briefcase} label="Contratação">{contract}</Fact>
          <Fact icon={Globe2} label="Modalidade">{MODE_LABEL[job.mode]}</Fact>
          <Fact icon={CalendarDays} label="Publicada em">{formatDate(job.postedAt)}</Fact>
          {job.schedule && <Fact icon={Clock} label="Jornada">{job.schedule}</Fact>}
          {job.educationLabel && <Fact icon={GraduationCap} label="Escolaridade">{job.educationLabel}</Fact>}
          {job.experienceText && <Fact icon={Briefcase} label="Experiência">{job.experienceText}</Fact>}
          {job.category && <Fact icon={Tag} label="Área">{job.category}</Fact>}
          {!job.isDemo && <Fact icon={ExternalLink} label="Origem">{job.sourceName}</Fact>}
        </dl>
        {salary && job.salaryNote && <p className="-mt-3 text-xs text-muted">{job.salaryNote}</p>}

        <Section title="Descrição">
          {job.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{job.description}</p>
          ) : (
            <p className="text-sm text-slate-400">{NOT_INFORMED}</p>
          )}
          {job.descriptionIsPartial && (
            <p className="mt-3 rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">
              A fonte envia apenas um trecho da descrição. O texto completo está na vaga original.
            </p>
          )}
        </Section>

        {job.responsibilities?.length > 0 && <Section title="Responsabilidades"><Bullets items={job.responsibilities} /></Section>}

        {job.requirementsRequired ? (
          <>
            <Section title="Requisitos obrigatórios"><Bullets items={job.requirementsRequired} /></Section>
            {job.requirementsDesired?.length > 0 && <Section title="Requisitos desejáveis"><Bullets items={job.requirementsDesired} icon={Check} tone="text-slate-400" /></Section>}
          </>
        ) : (
          <Section title="Requisitos e qualificações">
            <p className="text-sm text-slate-700">
              {job.requirements || `${NOT_INFORMED} separadamente pela fonte. Consulte a descrição e a vaga original.`}
            </p>
          </Section>
        )}

        {job.hardSkills?.length > 0 && <Section title="Competências técnicas"><Chips items={job.hardSkills} tone="brand" /></Section>}
        {job.softSkills?.length > 0 && <Section title="Competências comportamentais"><Chips items={job.softSkills} /></Section>}

        {(job.benefits?.length || (!Array.isArray(job.benefits) && job.benefits)) ? (
          <Section title="Benefícios">
            {Array.isArray(job.benefits) ? <Chips items={job.benefits} /> : <p className="text-sm text-slate-700">{job.benefits}</p>}
          </Section>
        ) : null}

        <Section title="Localização">
          <div className="rounded-xl border border-line p-3.5 text-sm">
            <p className="flex items-start gap-2 font-medium text-ink">
              <MapPin size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
              {job.locationText || 'Local não informado'}
            </p>
            {distance && (
              <p className="mt-1.5 flex items-start gap-2 text-slate-600">
                <Navigation size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                <span>
                  {distance === 'no bairro' ? `No bairro de referência (${referenceName || 'Centro'})` : `${distance} ${fromPlace(referenceName)}`}
                  {approx && <span className="block text-xs text-muted">em linha reta, a partir de um ponto aproximado</span>}
                </span>
              </p>
            )}
            {job.coordinatesNote && <p className="mt-1.5 text-xs text-muted">{job.coordinatesNote}</p>}
            {!hasCoords && <p className="mt-1.5 text-xs text-muted">Sem coordenadas: esta vaga não aparece no mapa.</p>}
            {hasCoords && onShowOnMap && (
              <button type="button" onClick={onShowOnMap} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
                <MapIcon size={15} aria-hidden="true" /> Ver no mapa
              </button>
            )}
            {hasCoords && !onShowOnMap && mapHref && (
              <Link to={mapHref} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
                <MapIcon size={15} aria-hidden="true" /> Ver no mapa
              </Link>
            )}
          </div>
        </Section>

        <Section title="Sobre a empresa">
          <div className="flex items-center gap-3 rounded-xl border border-line p-3.5">
            <Building2 size={18} className="shrink-0 text-muted" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-ink">{job.company || 'Empresa não informada'}</p>
              <p className="text-xs text-muted">
                {job.companyIsFictional ? 'Empresa fictícia criada para a demonstração.' : 'A fonte não fornece mais informações sobre a empresa.'}
              </p>
            </div>
          </div>
        </Section>
      </div>

      <div className="border-t border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          {job.url ? (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-primary flex-1">
              Candidatar-se no site original <ExternalLink size={16} aria-hidden="true" />
            </a>
          ) : (
            <button type="button" onClick={() => setHowOpen(true)} className="btn btn-lg btn-primary flex-1">
              <HelpCircle size={17} aria-hidden="true" /> Como funcionaria a candidatura?
            </button>
          )}
          <CopyLink />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          {job.url
            ? `Você será direcionado para ${job.sourceName}. O Jobs Maricá não recebe candidaturas.`
            : 'Vaga fictícia: não há candidatura real. O Jobs Maricá não recebe candidaturas.'}
        </p>
      </div>

      <Drawer
        open={howOpen} onClose={() => setHowOpen(false)} side="center" title="Como funcionaria a candidatura?"
        footer={<button type="button" onClick={() => setHowOpen(false)} className="btn btn-md btn-primary w-full sm:w-auto">Entendi</button>}
      >
        <div className="space-y-3 p-5 text-sm leading-relaxed text-slate-700">
          <p>
            Esta é uma <strong>vaga demonstrativa</strong>, criada apenas para apresentar o Jobs Maricá. Ela não existe e
            não há para onde enviar uma candidatura.
          </p>
          <p>Em uma versão com oportunidades reais, o fluxo seria:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Você encontra a vaga e confere os requisitos e a compatibilidade.</li>
            <li>Ao clicar em “Candidatar-se”, é direcionado à <strong>página oficial da oportunidade</strong>, no site da empresa ou da plataforma que publicou a vaga.</li>
            <li>A candidatura é feita lá, conforme as regras de quem anunciou.</li>
          </ol>
          <p className="rounded-xl bg-surface p-3 text-xs text-muted">
            O Jobs Maricá não recebe currículos nem intermedeia candidaturas. Quando as integrações com fontes autorizadas
            estão ativas, o botão leva diretamente ao anúncio original.
          </p>
        </div>
      </Drawer>
    </div>
  );
}

/**
 * Detalhes da vaga.
 *  - variant="panel": painel sobreposto dentro do contêiner pai (página /mapa);
 *  - variant="column": ocupa toda a coluna em que está (desktop, página /vagas);
 *  - variant="sheet": folha inferior modal (celular/tablet).
 */
export default function JobDetails({ job, match, onClose, variant = 'panel', mapHref, onShowOnMap, referenceName }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (variant === 'sheet') return undefined;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [job.id, onClose, variant]);

  const content = <DetailsContent job={job} match={match} onClose={onClose} mapHref={mapHref} onShowOnMap={onShowOnMap} closeRef={closeRef} referenceName={referenceName} />;

  if (variant === 'sheet') {
    return (
      <Drawer open bare side="bottom" onClose={onClose} ariaLabel={`Detalhes da vaga: ${job.title}`}>
        <div className="min-h-0 flex-1">{content}</div>
      </Drawer>
    );
  }

  const shell = variant === 'column'
    ? 'h-full bg-white'
    : 'absolute inset-y-3 right-3 z-[600] w-[440px] max-w-[calc(100%-1.5rem)] rounded-2xl border border-line bg-white shadow-panel';

  return (
    <aside aria-label={`Detalhes da vaga: ${job.title}`} className={`flex animate-fade-up flex-col overflow-hidden ${shell}`}>
      {content}
    </aside>
  );
}
