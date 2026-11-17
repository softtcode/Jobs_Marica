# Jobs Maricá

Portal público e gratuito de oportunidades de trabalho em Maricá (RJ) e região, com busca, filtros por
distância e mapa interativo. Distâncias calculadas a partir da **Casa do Trabalhador de Maricá**.
Projeto de extensão acadêmica e independente: **não é um produto oficial da Prefeitura**.

- Frontend: React + Vite + Tailwind + Lucide + **React Router** + **React Leaflet + OpenStreetMap** (sem chave de API)
- Backend: Node.js + Express (intermediário, protege chaves, padroniza dados, cache em memória) e geocodificação via **Nominatim** (sem chave de API)
- Sem banco de dados, sem login, sem serviços pagos e sem IA externa

**Protótipo de apresentação:** funciona sem nenhuma credencial, com uma base local de **60 vagas fictícias**,
**avaliações de empresas simuladas**, **cadastro/importação de currículo** e **recomendações por compatibilidade**.
Toda informação fictícia é identificada na interface (veja a seção 0).

---

## 0. Modo demonstração, currículo e recomendações

### Base de 60 vagas fictícias (`server/src/data/demoJobs.js`)
- Ligada por padrão (`DEMO_MODE=true`); `DEMO_MODE=false` volta a usar só as fontes reais.
- Distribuição: CLT 20 · Estágio 8 · Jovem Aprendiz 6 · PJ 7 · Autônomo 5 · Temporário 5 · Trainee 4 ·
  Cooperado 3 · Freelancer 2 — cobrindo as 22 áreas profissionais e níveis de entrada a especializados.
- Cada vaga tem responsabilidades, requisitos obrigatórios e desejáveis, escolaridade, experiência,
  competências, salário ilustrativo (ou forma de remuneração), benefícios, palavras-chave e `isDemo: true`.
- Coordenadas = **ponto aproximado de referência do bairro** (`neighborhoods.js`), nunca endereço comercial;
  vagas remotas não têm coordenadas. Empresas são fictícias. A data de publicação é relativa ao dia em que o
  servidor inicia.
- As vagas entram pelo **mesmo contrato** de `/api/jobs` (fonte `demo`). Campos novos são apenas acrescentados
  (`demo` no resultado, `demoMode` em `/api/config`); nenhum campo existente mudou. O código da Adzuna e da
  Greenhouse continua intacto e pode funcionar junto.
- Na interface: aviso "Ambiente de demonstração", selo "Vaga demonstrativa" em cada vaga e, no lugar de
  "Candidatar-se", o botão **"Como funcionaria a candidatura?"** (modal explicativo). Vagas reais com `url`
  continuam com o link para o anúncio original.

### Avaliações de Empresas (`/empresas`)
- 18 empresas (`demoCompanies.json`): 9 marcas reais usadas **apenas como referência de navegação** e 9 fictícias.
- 523 avaliações **simuladas** (`demoReviews.json`), só com notas de 1 a 5 em cinco critérios — sem textos,
  sem autores, sem depoimentos. Geradas por `node server/scripts/generate-demo-reviews.mjs` (semente fixa).
- Médias e posições são **calculadas** a partir desses registros (`companiesService.js`):
  - **Mais bem avaliadas:** maior média, só entre empresas com pelo menos 10 avaliações;
  - **Mais populares:** maior quantidade de avaliações (não indica qualidade).
- Marcas reais recebem notas simuladas numa **faixa neutra (≈3,2–4,0)**, para que nenhuma nota inventada
  sugira que uma empresa real é muito boa ou muito ruim; as fictícias usam a escala toda. Sem logotipos de
  terceiros (apenas monogramas).
- Endpoints: `GET /api/companies?q=&sector=&sort=rating|popular|name` e `GET /api/companies/:id`.

### Meu Currículo (`/curriculo`)
- Cadastro manual com experiências, formações, cursos e idiomas múltiplos; edição posterior.
- Importação de **PDF e DOCX no navegador** (pdf.js e mammoth, carregados sob demanda): valida extensão,
  tamanho (5 MB) e assinatura do arquivo; recusa `.doc`/`.docm`; não executa scripts nem macros; sem OCR
  (avisa quando não há texto). O texto vira **sugestões** destacadas que a pessoa revisa antes de salvar.
- **Privacidade:** o perfil fica só no `localStorage` do navegador (sem servidor, sem sincronização); o
  arquivo não é guardado; CPF, RG, data de nascimento e contatos não são pedidos nem extraídos; há botão
  para apagar tudo. Currículos de exemplo (pessoa fictícia) em `client/public/exemplos/`.

### Recomendações (`client/src/services/matchingService.js`)
Regras locais com dicionário de áreas, cargos, sinônimos e competências (`client/src/data/skillsDictionary.js`)
e normalização de texto (`client/src/utils/textNormalization.js`: minúsculas, sem acentos, sem "(a)",
palavras irrelevantes, expressões compostas, sinônimos, deduplicação).

| Critério (configurável em `MATCH_CONFIG.weights`) | Peso |
|---|---:|
| Competências profissionais | 35 |
| Área de interesse e cargo desejado | 25 |
| Formação e escolaridade | 15 |
| Experiência profissional | 15 |
| Modalidade e localização | 10 |

- Pontuação de 0 a 100. Campo do currículo vazio vale 0 no critério; critério que a vaga não informa sai do
  cálculo (pesos reescalados).
- Requisitos obrigatórios não identificados aparecem **separadamente**, mesmo com pontuação alta.
- Cada vaga mostra os motivos ("Conhecimento em Excel", "Interesse em Administração"…) e o que não foi
  possível verificar. É uma **estimativa por regras**, não probabilidade de contratação.
- Nenhum atributo sensível é usado (o perfil nem os armazena).
- **Abas em `/vagas`:** os filtros são aplicados primeiro; depois, score ≥ `MATCH_CONFIG.threshold` (60) vai
  para **Para Você** (ordenada pela pontuação) e o restante para **Outras Vagas**. As abas são mutuamente
  exclusivas. Sem currículo, todas as vagas aparecem com um convite para criar/importar o currículo.

---

## 1. Verificação de viabilidade (feita antes de codificar)

### Localização da Casa do Trabalhador
Os materiais oficiais divergem. O site da Prefeitura de Maricá, em notícia recente sobre vagas, informa
**Rua Clímaco Pereira, 189, Centro** (seg. a sex., 8h–17h). Publicações anteriores do mesmo site citam
Clímaco Pereira, 165, e também há a unidade de Itaipuaçu (Rua das Perpétuas). A Secretaria de Trabalho e
Emprego fica na Rua Álvares de Castro, 346, e o SINE na Rua Carlos Rangel, 51.

**Decisão:** nenhuma coordenada está escrita no código. O ideal é conferir o ponto em
https://www.openstreetmap.org (botão direito no local → copiar coordenadas) e fixá-lo em `HOME_LAT` e
`HOME_LNG`; assim o Nominatim nem é consultado. Se ficarem vazios, o servidor geocodifica `HOME_ADDRESS`
**uma única vez** pelo Nominatim e guarda o resultado em cache no disco. Se o OSM não achar o número do
imóvel, usa só a rua e marca a posição como aproximada. **Confirme o endereço com a Secretaria (canal 156)
antes de publicar.**

### Adzuna (fonte principal)
- O Brasil (`br`) é um país suportado pela API de busca (`/v1/api/jobs/br/search/{página}`).
- Parâmetros usados: `what`, `where`, `distance`, `max_days_old`, `sort_by=date`.
- Limitações reais: a descrição vem **truncada**; não há endereço da vaga; a API **não informa a precisão
  das coordenadas**; salários marcados como estimados pela própria Adzuna (`salary_is_predicted=1`) **não
  são exibidos**, pois não são salários divulgados pela empresa.
- Verifique os termos de uso do portal de desenvolvedores (inclusive exigências de atribuição) antes de
  publicar. O app já indica a fonte em cada vaga e no rodapé da lista.

### Greenhouse (complementar)
- A Job Board API é pública, mas é **por empresa** (`/v1/boards/{token}/jobs?content=true`), não uma busca
  universal. Só funciona para empresas cujo token você informar em `GREENHOUSE_BOARD_TOKENS`.
- Traz localização apenas como texto (ex.: "Rio de Janeiro, Brazil"), sem salário estruturado.
  Sem tokens configurados, a fonte aparece como "não configurada".

### Freelance
Não encontrei uma API pública, gratuita e geolocalizada de projetos freelance para o Brasil:
Workana e 99Freelas não oferecem API pública de consulta; a API do Freelancer.com exige OAuth/aprovação e
quase não traz localização. **O filtro existe e mostra uma mensagem transparente de indisponibilidade;
nenhuma vaga freelance é inventada.** O ponto de extensão está em `server/src/services/freelance.js`.

### O que não está disponível por API
As vagas divulgadas pela própria Casa do Trabalhador e pelo SINE aparecem nos sites da Prefeitura e em
notícias, em texto. Não encontrei uma API pública para elas, então não estão neste MVP.

---

## 2. Estrutura

```
vagas-marica/
├── server/
│   ├── .env.example
│   ├── src/
│   │   ├── index.js              # Express (serve client/dist em produção)
│   │   ├── config.js             # variáveis de ambiente
│   │   ├── routes/api.js         # /api/health, /api/config, /api/jobs, /api/companies[/:id]
│   │   ├── data/                 # demoJobs.js (60 vagas), neighborhoods.js, demoCompanies.json, demoReviews.json
│   │   ├── services/
│   │   │   ├── demoJobs.js       # fonte "Base demonstrativa" (busca local sem acentos)
│   │   │   ├── companiesService.js # médias e rankings calculados a partir dos registros
│   │   │   ├── adzuna.js         # integração + normalização
│   │   │   ├── greenhouse.js     # integração + normalização
│   │   │   ├── freelance.js      # status transparente de indisponibilidade
│   │   │   ├── geocoding.js      # fachada: cache persistente, orçamento de consultas, ponto de referência
│   │   │   ├── geocodingProviders/nominatim.js  # provedor trocável (fila 1 req/s, User-Agent)
│   │   │   └── jobsService.js    # agrega, remove duplicatas, filtra por distância
│   │   └── utils/ (geo.js Haversine, cache.js TTL, fileCache.js, rateLimitedQueue.js, text.js)
│   ├── scripts/generate-demo-reviews.mjs
│   └── test/ (smoke, geocoding, demo)
└── client/
    ├── .env.example
    ├── public/exemplos/              # currículos fictícios (PDF/DOCX) para demonstrar a importação
    ├── scripts/make-sample-resumes.mjs
    ├── test/ (matching, resume)      # node --test
    └── src/
        ├── App.jsx                   # rotas (React Router, páginas carregadas sob demanda)
        ├── context/ (ConfigContext, ResumeContext — currículo no localStorage)
        ├── pages/ (LandingPage, JobsPage, MapPage, CompaniesPage, CompanyDetailsPage, ResumePage, AboutPage, NotFoundPage)
        ├── components/
        │   ├── layout/    (AppLayout, Navbar, BottomNav, Footer, Logo)
        │   ├── jobs/      (SearchBar, FilterPanel, RadiusSlider, ReferencePoint, JobCard, JobList, JobDetails, MatchTabs)
        │   ├── companies/ (CompanyCard, CompanyBadges, StarRating)
        │   ├── resume/    (FormControls, ImportPanel)
        │   ├── map/       (MapView, MapArea)
        │   └── ui/        (Badge, Notice, Drawer/modal, DemoNotice)
        ├── data/skillsDictionary.js
        ├── hooks/ (useJobs, useJobSearch, useAsync, useMediaQuery, usePageTitle)
        ├── services/ (api, matchingService, resumeParser, resumeExtract)
        └── utils/ (geo, format, search, textNormalization)
```

### Páginas

| Rota      | Conteúdo |
|-----------|----------|
| `/`              | Apresentação, busca, categorias, vagas recentes (do backend), recursos, como funciona |
| `/vagas`         | Busca, filtros, abas Para Você / Outras Vagas, lista, mapa e detalhes integrados |
| `/mapa`          | Mapa amplo com painel de resultados; no celular, mapa em tela cheia com lista em gaveta |
| `/empresas`      | Avaliações de empresas (simuladas): busca, setor, ordenação por nota/popularidade |
| `/empresas/:id`  | Detalhes: notas por critério, distribuição, posições, vagas demonstrativas |
| `/curriculo`     | Meu Currículo: cadastro manual, importação PDF/DOCX, privacidade e exclusão |
| `/sobre`         | Propósito, como usar, origem dos dados, demonstração, recomendações e privacidade |

`/vagas` e `/mapa` compartilham a mesma busca pela URL (o link pode ser copiado e compartilhado):

```
/vagas?q=vendedor&raio=10&tipo=emprego&modalidade=presencial&contratacao=clt&area=vendas&salario=2000&semSalario=0&aba=para-voce&vaga=<id>
```

`raio` aceita os mesmos valores do backend (1, 5, 10, 15, 25, 50, 100; padrão 25 km, que cobre Maricá);
valores padrão são omitidos. No celular, a barra inferior tem Início, Vagas, Mapa, Empresas e Currículo; o
menu do topo lista todas as páginas (incluindo Sobre).

---

## 3. Chaves e identificação

Não há chave do Google nem cobrança: o mapa (Leaflet + tiles do OpenStreetMap) e a geocodificação (Nominatim)
são gratuitos e não pedem cartão.

1. **Nominatim** → defina `NOMINATIM_CONTACT_EMAIL` em `server/.env` com um e-mail real do responsável.
   A política da instância pública exige identificar o app; sem isso o servidor **recusa** consultar.
2. **Adzuna** → cadastre-se em https://developer.adzuna.com e copie `app_id` e `app_key` para `server/.env`.
3. **Greenhouse** (opcional) → informe tokens de quadros públicos em `GREENHOUSE_BOARD_TOKENS`.

## 4. Executar localmente

Requer Node 18+.

```bash
cp server/.env.example server/.env     # preencha
cp client/.env.example client/.env     # preencha
npm run install:all

npm run dev            # inicia backend (3001) e frontend (5173, proxy /api → 3001) juntos; Ctrl+C encerra ambos
# ou, em terminais separados:
npm run dev:server     # → http://localhost:3001
npm run dev:client     # → http://localhost:5173
npm test               # testes do servidor (distância, base demo, ranking) e do cliente (recomendação, importação)
```

Sem nenhuma credencial o protótipo já funciona no modo demonstração. Para regenerar os dados de exemplo:
`node server/scripts/generate-demo-reviews.mjs` e `node client/scripts/make-sample-resumes.mjs`.

---

## 5. Como as vagas são obtidas e posicionadas

1. O servidor consulta Adzuna (áreas: Maricá; mais Niterói a partir de 25 km; mais Rio de Janeiro a partir
   de 50 km) e Greenhouse, em paralelo. Cada fonte falha de forma independente.
2. Os resultados são **normalizados** num formato único e **deduplicados** (URL e título + empresa + local).
3. A distância é calculada com **Haversine**, em linha reta, a partir da Casa do Trabalhador. O filtro final
   usa coordenadas, não nomes de cidades.
4. Cada vaga recebe uma precisão:
   - `exact`: só se o OpenStreetMap encontrar o número do imóvel (marcador sólido);
   - `approximate`: coordenadas da fonte ou geocodificação de cidade/bairro (marcador **tracejado**, rótulo
     "Local aproximado" e distância com "~");
   - `none`: sem coordenadas → vai para a seção **"Sem localização confiável"**, fora do mapa.
5. Não há coordenadas aleatórias nem deslocamentos. Vagas com a **mesma** coordenada são agrupadas num único
   marcador com contador; ao clicar, a lista mostra só aquelas vagas.
6. Como a Adzuna não informa a precisão, suas coordenadas são sempre tratadas como aproximadas.
7. Campos ausentes aparecem como "Não informado". Modalidade só é preenchida quando o texto da vaga a
   menciona (remoto, híbrido, presencial).
8. Cache em memória (15 min por padrão). O botão **Atualizar** ignora o cache.

## 6. Erros e ausência de resultados

- Fonte indisponível, credencial recusada ou limite excedido: aviso por fonte, e as demais continuam.
- Servidor fora do ar: mensagem amigável; o último resultado carregado é mantido.
- Sem vagas no raio: sugestão de aumentar a distância ou mudar a busca.
- Tiles do mapa não carregam: aviso sobre o mapa-base, e a lista continua funcionando.
- Nominatim com limite de uso (429): geocodificação pausada e nova tentativa depois; nada é inventado.
- Casa do Trabalhador não localizada: o servidor responde 503 explicando o que configurar (`HOME_LAT`/`HOME_LNG`).

## 7. Publicação (um único serviço)

Render, Railway ou Fly.io funcionam bem.

- **Build:** `npm run build` (gera `client/dist`). Variáveis `VITE_*` são lidas no *build*.
- **Start:** `npm start` (o Express serve a API e o frontend no mesmo domínio).
- **Variáveis do servidor:** as de `server/.env.example`.
- O cache de geocodificação fica em `server/data/geocode-cache.json`. Em hospedagem com disco efêmero
  (ex.: planos gratuitos do Render), ele se perde a cada deploy; aponte `GEOCODE_CACHE_FILE` para um volume
  persistente ou fixe `HOME_LAT`/`HOME_LNG`.
- Opcional: frontend na Vercel/Netlify e backend à parte; nesse caso defina `VITE_API_URL` no frontend e
  `CLIENT_ORIGIN` no backend.
- Mantenha a nota de que o projeto é independente e a atribuição às fontes.

## 8. Limites de uso e como trocar de provedor

- **Nominatim público:** máximo de 1 req/s (fila global no servidor), sem geocodificação em massa, com
  User-Agent identificado e resultados em cache (90 dias; "não encontrado" por 7 dias). Cada busca de vagas
  faz no máximo `NOMINATIM_MAX_LOOKUPS_PER_SEARCH` consultas novas; o restante fica "sem localização
  confiável" e é resolvido em buscas futuras. As coordenadas das vagas da Adzuna são reaproveitadas e
  **não** passam pelo Nominatim.
- Se o volume crescer além da política pública, use uma instância própria (`NOMINATIM_BASE_URL`) ou crie
  outro provedor em `server/src/services/geocodingProviders/` com a mesma interface (`search(query)`).
- **Tiles do OSM:** o servidor público de tiles não é feito para tráfego intenso. Para mais acessos, defina
  `VITE_TILE_URL` e `VITE_TILE_ATTRIBUTION` (use a atribuição exigida pelo novo provedor). Nunca remova os
  créditos do mapa.

## 9. Estado de verificação

- `npm test`: 32 testes do servidor + 21 do cliente passando (60 vagas e distribuição exata, campos e
  coordenadas válidos, busca sem acentos, ranking com mínimo de avaliações, faixa neutra das marcas reais,
  sinônimos, acentos, palavras genéricas, campos vazios sem pontos, requisitos ausentes, ordenação,
  exclusividade das abas, extração real do PDF e do DOCX de exemplo).
- `npm run build`: sem erros nem avisos.
- Navegador (375 px, 1280 px e 1440 px): todas as páginas; importação de PDF e DOCX no navegador; validação
  de arquivos (formato, assinatura, 5 MB, `.docm`); salvar só após confirmação; exclusão do currículo; abas
  com filtros; ordenação de empresas; modal de candidatura; sem rolagem horizontal; build de produção sem
  erros no console.
- **Adzuna e Greenhouse não foram testadas com dados reais** (credenciais não configuradas no ambiente).

### Limitações conhecidas
- Vagas e avaliações são fictícias/simuladas; não há candidatura real nem cadastro de avaliações.
- A interpretação de currículos é por regras: funciona melhor com currículos organizados em seções
  ("Objetivo", "Experiência"…). Sem OCR para PDFs escaneados.
- Várias vagas do mesmo bairro compartilham o mesmo ponto de referência e aparecem agrupadas no mapa.
- O currículo fica em um único navegador (sem conta/sincronização), por decisão de privacidade.
- `npm audit` ainda aponta, no React Router 6, um redirecionamento aberto via `\` em `<Link>`/`navigate`
  (o app só navega para caminhos fixos) e um problema de hidratação SSR (o app não usa SSR); a correção exige
  migrar para o v7. O alerta do esbuild afeta apenas o servidor de desenvolvimento do Vite 5.
