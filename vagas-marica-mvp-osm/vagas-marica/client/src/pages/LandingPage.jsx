import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Briefcase, Building, CloudOff, ExternalLink, FileText, GraduationCap, Laptop, Map as MapIcon,
  MapPin, RefreshCw, Rocket, Search, SlidersHorizontal, Sparkles, Star, Users,
} from 'lucide-react';
import SearchBar from '../components/jobs/SearchBar.jsx';
import JobCard from '../components/jobs/JobCard.jsx';
import { EmptyState, JobCardSkeleton } from '../components/ui/Notice.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useJobs } from '../hooks/useJobs.js';
import { searchHref } from '../utils/search.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const RECENT_RADIUS = 25;

const QUICK_SEARCHES = ['Vendedor', 'Atendente', 'Motorista', 'Auxiliar administrativo'];

const CATEGORIES = [
  {
    title: 'Primeiro emprego', icon: Rocket, to: searchHref('/vagas', { q: 'primeiro emprego' }),
    text: 'Vagas que não exigem experiência ou citam primeiro emprego.',
  },
  {
    title: 'Estágios', icon: GraduationCap, to: searchHref('/vagas', { contract: 'Estágio' }),
    text: 'Oportunidades de estágio para estudantes.',
  },
  {
    title: 'Vagas presenciais', icon: Building, to: searchHref('/vagas', { mode: 'onsite' }),
    text: 'Trabalho no local, perto de você.',
  },
  {
    title: 'Trabalho remoto', icon: Laptop, to: searchHref('/vagas', { mode: 'remote' }),
    text: 'Vagas que informam trabalho a distância.',
  },
  {
    title: 'Freelance', icon: Users, to: searchHref('/vagas', { type: 'freelance' }),
    text: 'Projetos avulsos e serviços.',
  },
];

const FEATURES = [
  {
    icon: FileText, title: 'Recomendações pelo seu perfil', to: '/curriculo?modo=rapido', cta: 'Criar Perfil Rápido',
    text: 'Responda poucas perguntas (ou importe um PDF/DOCX) e veja quais vagas combinam com você e por quê. Tudo calculado no seu navegador.',
  },
  {
    icon: Star, title: 'Avaliações de empresas', to: '/empresas', cta: 'Ver avaliações',
    text: 'Compare empresas por ambiente, remuneração, crescimento, gestão e equilíbrio. Nesta demonstração, as notas são simuladas.',
  },
];

const STEPS = [
  { icon: Search, title: 'Pesquise uma oportunidade', text: 'Digite um cargo ou profissão. Entendemos variações como “auxiliar” ou “assistente”.' },
  { icon: SlidersHorizontal, title: 'Filtre por local e preferências', text: 'Escolha seu bairro, a distância e o tipo de contratação.' },
  { icon: ExternalLink, title: 'Consulte os detalhes da vaga', text: 'Veja requisitos, salário e localização antes de se candidatar.' },
];

/** Atalhos "perto de…" para os bairros de referência (lista vinda do servidor). */
function NearbySection() {
  const { references = [] } = useConfig();
  if (!references.length) return null;
  return (
    <section className="container-page pt-12 sm:pt-16" aria-labelledby="nearby-title">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <p className="eyebrow">Do Centro a Itaipuaçu, de Inoã a Ponta Negra</p>
        <h2 id="nearby-title" className="mt-2 text-xl font-extrabold sm:text-2xl">Vagas perto do seu bairro</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Escolha onde você mora para ver as oportunidades num raio de até 5 km. Os locais são pontos aproximados de cada bairro.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {references.map((r) => (
            <li key={r.id}>
              <Link to={searchHref('/vagas', { ref: r.id, radiusKm: 5 })}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-dark">
                <MapPin size={14} className="text-brand" aria-hidden="true" /> {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Ilustração do conceito de busca por raio (sem dados de vagas). */
function RadiusIllustration({ home }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]" aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-brand-light/15" />
      <div className="absolute inset-[16%] rounded-full border border-brand-light/20" />
      <div className="absolute inset-[32%] rounded-full border border-dashed border-brand-light/40 bg-brand/10" />
      <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border-4 border-navy bg-brand text-white shadow-[0_0_0_10px_rgba(37,99,235,.18)]">
        <Briefcase size={26} />
      </div>
      {[['18%', '24%'], ['72%', '30%'], ['64%', '74%'], ['26%', '68%'], ['86%', '56%']].map(([l, t], i) => (
        <span key={i} className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-dashed border-brand-light bg-navy text-brand-light" style={{ left: l, top: t }}>
          <MapPin size={14} />
        </span>
      ))}
      {['1 km', '10 km', '25 km'].map((r, i) => (
        <span key={r} className="absolute right-[3%] rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-brand-light backdrop-blur" style={{ top: `${44 - i * 15}%` }}>{r}</span>
      ))}
      {home && (
        <div className="absolute -bottom-2 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-xl border border-white/10 bg-navy-800/90 px-3.5 py-2 text-center text-xs text-slate-300 shadow-panel backdrop-blur">
          Distâncias calculadas a partir do <span className="font-semibold text-white">bairro que você escolher</span>
        </div>
      )}
    </div>
  );
}

function RecentJobs() {
  const cfg = useConfig();
  const navigate = useNavigate();
  const { data, error, refresh } = useJobs({ q: '', radiusKm: RECENT_RADIUS, type: 'all', enabled: Boolean(cfg.home) });

  const recent = useMemo(() => {
    if (!data) return [];
    return [...data.jobs, ...data.unlocated]
      .sort((a, b) => (Date.parse(b.postedAt) || 0) - (Date.parse(a.postedAt) || 0))
      .slice(0, 6);
  }, [data]);

  const open = (job) => navigate(searchHref('/vagas', { radiusKm: RECENT_RADIUS }, { vaga: job.id }));
  const failure = cfg.error || (!data && error);

  if (failure) {
    return (
      <div className="card">
        <EmptyState
          tone="error" icon={CloudOff} title="Não foi possível carregar as vagas agora"
          action={<button type="button" onClick={cfg.error ? cfg.retry : refresh} className="btn btn-md btn-primary"><RefreshCw size={16} aria-hidden="true" /> Tentar novamente</button>}
        >
          {failure.message}
        </EmptyState>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando vagas recentes">
        {Array.from({ length: 6 }, (_, i) => <JobCardSkeleton key={i} />)}
      </div>
    );
  }
  if (recent.length === 0) {
    const noSource = data.sources.every((s) => s.status !== 'ok');
    return (
      <div className="card">
        <EmptyState
          icon={noSource ? CloudOff : Search}
          title={noSource ? 'Nenhuma vaga disponível no momento' : `Nenhuma vaga publicada num raio de ${RECENT_RADIUS} km`}
          action={<Link to="/vagas" className="btn btn-md btn-primary">Explorar vagas <ArrowRight size={16} aria-hidden="true" /></Link>}
        >
          {noSource
            ? 'As fontes de vagas não responderam ou ainda não estão configuradas neste ambiente. Tente novamente mais tarde.'
            : 'Experimente ampliar a distância na página de vagas.'}
        </EmptyState>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {recent.map((job) => (
        <li key={job.id} className="animate-fade-up"><JobCard job={job} onSelect={open} /></li>
      ))}
    </ul>
  );
}

export default function LandingPage() {
  usePageTitle(null);
  const navigate = useNavigate();
  const { home, demoMode } = useConfig();
  const [query, setQuery] = useState('');
  const search = (q) => navigate(searchHref('/vagas', { q: q.trim() }));

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-brand-light">
              <Sparkles size={14} aria-hidden="true" /> Projeto de extensão acadêmica · Maricá, RJ
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Encontre oportunidades que <span className="text-brand-light">combinam com você.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Pesquise vagas em Maricá e região ou descubra oportunidades de acordo com seu perfil profissional.
              Gratuito e sem cadastro.
            </p>

            <SearchBar
              id="hero-search" size="lg" value={query} onChange={setQuery} onSubmit={search}
              buttonLabel="Buscar vagas" className="mt-8 max-w-xl"
            />

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400">Buscas rápidas:</span>
              {QUICK_SEARCHES.map((q) => (
                <Link key={q} to={searchHref('/vagas', { q: q.toLowerCase() })}
                  className="rounded-full border border-white/10 px-3 py-1 text-slate-300 transition-colors hover:border-brand-light/50 hover:text-white">
                  {q}
                </Link>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Link to="/vagas" className="group rounded-2xl bg-brand p-4 text-white shadow-lift transition-colors hover:bg-brand-dark">
                <span className="flex items-center gap-2 font-display text-base font-bold"><Search size={18} aria-hidden="true" /> Encontrar vagas agora</span>
                <span className="mt-1 block text-[13px] text-blue-100">Pesquise e filtre por bairro. Não precisa de currículo.</span>
              </Link>
              <Link to="/curriculo?modo=rapido" className="group rounded-2xl border border-white/15 bg-white/10 p-4 text-white transition-colors hover:bg-white/15">
                <span className="flex items-center gap-2 font-display text-base font-bold"><Sparkles size={18} className="text-brand-light" aria-hidden="true" /> Descobrir vagas para meu perfil</span>
                <span className="mt-1 block text-[13px] text-slate-300">Responda o Perfil Rápido ou importe seu currículo.</span>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <RadiusIllustration home={home} />
          </div>
        </div>
        {/* Linha costeira estilizada: referência discreta ao litoral de Maricá (decorativa, não é mapa). */}
        <svg className="absolute inset-x-0 bottom-0 h-10 w-full text-surface" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0 28c120-14 240-14 360 0s240 14 360 0 240-14 360 0 240 14 360 0v12H0z" />
          <path fill="none" stroke="rgba(96,165,250,.35)" strokeWidth="1.5" d="M0 22c120-14 240-14 360 0s240 14 360 0 240-14 360 0 240 14 360 0" />
        </svg>
      </section>

      {/* ===== Como funciona (logo após o hero, em linguagem simples) ===== */}
      <section className="container-page pt-12 sm:pt-16" aria-labelledby="how-title">
        <h2 id="how-title" className="text-xl font-extrabold sm:text-2xl">Como funciona</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy font-display font-bold text-brand-light" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-1.5 text-base font-bold"><Icon size={16} className="text-brand" aria-hidden="true" /> {title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">
          Opcional: <Link to="/curriculo?modo=rapido" className="font-semibold text-brand-dark hover:underline">crie um Perfil Rápido</Link> para
          ver primeiro as vagas mais compatíveis com você.
        </p>
      </section>

      {/* ===== Vagas perto do seu bairro (identidade local + atalho funcional) ===== */}
      <NearbySection />


      {/* ===== Categorias ===== */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="cat-title">
        <p className="eyebrow">Explore</p>
        <h2 id="cat-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">Encontre o tipo de oportunidade ideal</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map(({ title, icon: Icon, to, text, note }) => (
            <li key={title}>
              <Link to={to} className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{text}</p>
                {note
                  ? <span className="mt-3 text-xs font-semibold text-warning">{note}</span>
                  : <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark">Ver vagas <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ===== Vagas recentes ===== */}
      <section className="border-y border-line bg-white py-16 sm:py-20" aria-labelledby="recent-title">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{demoMode ? 'Ambiente de demonstração' : 'Atualizado das fontes'}</p>
              <h2 id="recent-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">Oportunidades recentes</h2>
              <p className="mt-2 text-sm text-muted">
                Publicações mais recentes num raio de {RECENT_RADIUS} km.
                {demoMode && ' As vagas exibidas são fictícias e servem para demonstrar a plataforma.'}
              </p>
            </div>
            <Link to={searchHref('/vagas', { radiusKm: RECENT_RADIUS })} className="btn btn-md btn-outline self-start sm:self-auto">
              Ver todas <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8"><RecentJobs /></div>
        </div>
      </section>

      {/* ===== Recursos: currículo e empresas ===== */}
      <section className="container-page pt-16 sm:pt-20" aria-labelledby="features-title">
        <p className="eyebrow">Recursos</p>
        <h2 id="features-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">Mais do que uma lista de vagas</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text, to, cta }) => (
            <Link key={to} to={to} className="group card flex gap-4 p-6 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy text-brand-light"><Icon size={22} aria-hidden="true" /></span>
              <div>
                <h3 className="text-lg font-bold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark">{cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="pb-16 sm:pb-20" />
      {/* ===== Sobre ===== */}
      <section className="container-page pb-16 sm:pb-20" aria-labelledby="about-title">
        <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow text-brand-light">Sobre o Jobs Maricá</p>
              <h2 id="about-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">Tecnologia a serviço de quem procura trabalho</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                O Jobs Maricá é um projeto de extensão acadêmica que reúne, em um só lugar, vagas publicadas em
                fontes públicas e as organiza por distância, para facilitar a busca por trabalho perto de casa.
                É gratuito, independente e não exige cadastro.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <Link to="/sobre" className="btn btn-lg btn-glass">Conheça o projeto <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
