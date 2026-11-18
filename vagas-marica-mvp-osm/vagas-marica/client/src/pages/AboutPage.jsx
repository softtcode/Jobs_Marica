import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Compass, Database, ExternalLink, FlaskConical, HeartHandshake, Lock, Map as MapIcon, MapPin,
  Search, ShieldCheck, SlidersHorizontal, Sparkles, Target,
} from 'lucide-react';
import { CRITERIA_LABELS, MATCH_CONFIG } from '../services/matchingService.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useConfig } from '../context/ConfigContext.jsx';

function Block({ id, icon: Icon, eyebrow, title, children }) {
  return (
    <section aria-labelledby={id} className="grid gap-6 border-t border-line py-12 first:border-t-0 md:grid-cols-[260px_1fr] md:gap-12">
      <div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={22} aria-hidden="true" /></span>
        <p className="eyebrow mt-4">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-2xl font-extrabold">{title}</h2>
      </div>
      <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

const USAGE = [
  { icon: Search, title: 'Pesquise', text: 'Na página Explorar vagas, digite um cargo ou palavra-chave. Deixe em branco para ver tudo.' },
  { icon: SlidersHorizontal, title: 'Ajuste os filtros', text: 'Defina a distância máxima (1 a 100 km), o tipo, a modalidade e, se quiser, um salário mínimo.' },
  { icon: MapIcon, title: 'Veja no mapa', text: 'Compare a localização das vagas. Marcadores tracejados indicam localização aproximada.' },
  { icon: ExternalLink, title: 'Candidate-se', text: 'Abra os detalhes e siga para o site original da vaga, onde a candidatura acontece.' },
];

export default function AboutPage() {
  usePageTitle('Sobre');
  const { home } = useConfig();

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="absolute -top-32 right-0 h-80 w-[600px] rounded-full bg-brand/15 blur-[110px]" aria-hidden="true" />
        <div className="container-page relative py-16 sm:py-20">
          <p className="eyebrow text-brand-light">Sobre o projeto</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Facilitar o caminho até o trabalho, começando por Maricá.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            O Jobs Maricá é uma plataforma pública e gratuita, desenvolvida como projeto de extensão acadêmica,
            que reúne oportunidades de trabalho e as organiza por distância.
          </p>
        </div>
      </section>

      <div className="container-page max-w-5xl py-6">
        <Block id="o-que-e" icon={Compass} eyebrow="O que é" title="Um portal de busca de oportunidades">
          <p>
            O Jobs Maricá consulta fontes públicas de vagas, padroniza as informações e mostra os resultados em
            uma lista e em um mapa interativo. Não é preciso criar conta nem informar dados pessoais para usar.
          </p>
          <p>
            A plataforma não publica vagas próprias e não intermedeia candidaturas: ela ajuda a encontrar a
            oportunidade e encaminha você para o site onde a vaga foi divulgada.
          </p>
        </Block>

        <Block id="objetivo" icon={Target} eyebrow="Objetivo" title="Aproximar pessoas e oportunidades">
          <p>
            O objetivo é tornar a procura por trabalho mais simples para moradores de Maricá e região,
            reunindo vagas dispersas em diferentes sites e mostrando, de forma clara, a que distância cada
            oportunidade está.
          </p>
        </Block>

        <Block id="problema" icon={HeartHandshake} eyebrow="O problema" title="Informação dispersa e distância importam">
          <p>
            Quem procura emprego costuma precisar visitar vários sites, e muitos anúncios não deixam claro onde
            fica o local de trabalho. Para quem depende de transporte público ou tem orçamento apertado, a
            distância até o trabalho pesa na decisão.
          </p>
          <p>
            Ao organizar as vagas por proximidade e exibir somente informações que as fontes realmente
            fornecem, o projeto procura reduzir o tempo de busca e ajudar em escolhas mais conscientes.
          </p>
        </Block>

        <Block id="como-usar" icon={BookOpen} eyebrow="Como usar" title="Quatro passos simples">
          <ol className="grid gap-3 sm:grid-cols-2">
            {USAGE.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-brand-light"><Icon size={18} aria-hidden="true" /></span>
                  <h3 className="text-base font-bold text-ink"><span className="text-muted">{i + 1}.</span> {title}</h3>
                </div>
                <p className="mt-2.5 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </Block>

        <Block id="fontes" icon={Database} eyebrow="Transparência" title="Como as oportunidades são encontradas">
          <ul className="space-y-3">
            <li className="flex gap-3"><MapPin size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
              <span>
                As distâncias são calculadas em linha reta a partir de um ponto de referência
                {home ? <> — atualmente, <strong className="text-ink">{home.name}</strong> ({home.address})</> : ' configurado no servidor'}.
              </span>
            </li>
            <li className="flex gap-3"><Database size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
              <span>
                As vagas vêm da API pública da <strong className="text-ink">Adzuna</strong> e, quando configurados,
                de quadros públicos de empresas na <strong className="text-ink">Greenhouse</strong>. Resultados
                repetidos são removidos.
              </span>
            </li>
            <li className="flex gap-3"><MapIcon size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
              <span>
                O mapa usa o <strong className="text-ink">OpenStreetMap</strong>. Quando a fonte não informa a localização
                exata, o marcador aparece tracejado como "aproximado". Vagas sem localização confiável ficam
                apenas na lista — nenhuma coordenada é inventada.
              </span>
            </li>
            <li className="flex gap-3"><ShieldCheck size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
              <span>
                Salários estimados pelas fontes não são exibidos; só aparecem valores divulgados. Ainda não há
                fonte pública de projetos freelance conectada, por isso essa categoria pode aparecer vazia.
              </span>
            </li>
          </ul>
        </Block>

        <Block id="demonstracao" icon={FlaskConical} eyebrow="Demonstração" title="Dados fictícios, claramente identificados">
          <p>
            Para a apresentação do protótipo, o Jobs Maricá funciona com uma <strong className="text-ink">base local de 60 vagas
            fictícias</strong>, de diferentes áreas e níveis, posicionadas em pontos aproximados de bairros de Maricá. Cada
            uma traz o selo “Vaga demonstrativa” e não possui candidatura real.
          </p>
          <p>
            As <strong className="text-ink">avaliações de empresas</strong> também são simuladas: as notas são calculadas a partir
            de registros gerados para a demonstração, sem textos nem autores. Marcas reais aparecem só como referência de
            navegação e não representam a opinião de funcionários nem parceria.
          </p>
        </Block>

        <Block id="recomendacoes" icon={Sparkles} eyebrow="Recomendações" title="Como funciona o “Para Você”">
          <p>
            O currículo é comparado com cada vaga por regras transparentes, sem inteligência artificial externa: textos são
            normalizados (sem acentos e palavras genéricas), sinônimos são agrupados por um dicionário local — “planilhas” e
            “Excel”, por exemplo — e cinco critérios somam até 100 pontos:
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {Object.entries(MATCH_CONFIG.weights).map(([k, w]) => (
              <li key={k} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-2.5 text-sm">
                <span>{CRITERIA_LABELS[k]}</span><strong className="text-ink">{w}%</strong>
              </li>
            ))}
          </ul>
          <p>
            Vagas com {MATCH_CONFIG.threshold} pontos ou mais aparecem em “Para Você”; as demais, em “Outras Vagas”, sempre
            acessíveis. Cada sugestão mostra os motivos e os requisitos obrigatórios não identificados. O percentual é uma
            estimativa, não a probabilidade de contratação, e nenhum dado pessoal sensível é usado.
          </p>
        </Block>

        <Block id="privacidade" icon={Lock} eyebrow="Privacidade" title="Seu currículo fica com você">
          <p>
            O currículo é salvo apenas no navegador do próprio dispositivo (armazenamento local), sem conta, sem servidor e
            sem sincronização. Arquivos PDF ou DOCX importados são lidos no navegador e não são guardados. CPF, RG, data de
            nascimento e contatos não são solicitados nem extraídos. Tudo pode ser apagado na página Meu Currículo.
          </p>
        </Block>

        <Block id="academico" icon={BookOpen} eyebrow="Natureza do projeto" title="Extensão acadêmica e independente">
          <p>
            O Jobs Maricá é uma iniciativa de extensão acadêmica que aplica conhecimentos de desenvolvimento
            de software a uma necessidade da comunidade.
          </p>
          <p>
            O projeto é independente e não é um serviço oficial da Prefeitura de Maricá. As vagas pertencem às
            fontes que as divulgam. Confira sempre as informações no anúncio original antes de se candidatar.
          </p>
        </Block>
      </div>

      <section className="container-page pb-16">
        <div className="flex flex-col items-start gap-5 rounded-3xl border border-line bg-white p-8 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Pronto para começar?</h2>
            <p className="mt-1 text-sm text-muted">Explore as oportunidades disponíveis agora.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/mapa" className="btn btn-md btn-outline"><MapIcon size={16} aria-hidden="true" /> Ver mapa</Link>
            <Link to="/vagas" className="btn btn-md btn-primary">Explorar vagas <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
