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
- **Abas em `/vagas` e `/mapa`:** os filtros são aplicados primeiro; depois, score ≥ `MATCH_CONFIG.threshold`
  (60) vai para **Para Você** e o restante para **Outras Vagas**. As abas são mutuamente exclusivas e a lista
  e o mapa mostram sempre o mesmo subconjunto (mesma função `computeVisible` em `client/src/utils/search.js`).
  Sem aba na URL, abre "Para Você" — ou "Outras Vagas", se "Para Você" estiver vazia. Sem currículo, todas as
  vagas aparecem com um convite para o Perfil Rápido.
- **Primeiro emprego:** "Ainda não tenho experiência profissional" é uma resposta válida: vagas que não exigem
  experiência recebem o critério completo; vagas que exigem continuam mostrando o requisito como não atendido.

### Perfil Rápido e Currículo Completo (`/curriculo`)
- Duas formas de preencher **o mesmo perfil** (mesma estrutura e mesmo `localStorage`): o **Perfil Rápido**
  (área, cargo, escolaridade, competências, bairro, contratação e modalidade) e o **Currículo Completo**.
- "Encontrar vagas para mim" salva mesclando com o que já existe (experiências, cursos e idiomas não são
  apagados — `mergeQuickProfile`) e abre `/vagas?aba=para-voce` já com o bairro informado.
- A importação de PDF/DOCX só altera o rascunho; há "Descartar" para voltar ao que estava salvo.
- O antigo percentual foi trocado por 5 etapas respondidas (`client/src/utils/resumeProgress.js`) e pelo
  indicador "Perfil pronto para recomendações". Não ter experiência não reduz o preenchimento.

---

## 0.1 Busca, local de referência, filtros e ordenação

### Busca inteligente (`shared/jobSearch.js`)
Módulo **compartilhado** entre servidor e navegador, junto com o dicionário (`shared/professionalTerms.js`) e a
normalização (`shared/textNormalization.js`) — `client/src/data/skillsDictionary.js` e
`client/src/utils/textNormalization.js` apenas reexportam esses arquivos, para não haver dois dicionários.

- Trata acentos, maiúsculas, singular/plural e masculino/feminino (radical simples), abreviações
  (`aux adm`, `tec`, `dev`…), início de palavra (`recep`) e erros de digitação (1 letra em palavras de 6+
  letras; 2 em palavras de 11+).
- Níveis de relevância (`matchTier`, campo novo em cada vaga de `/api/jobs`):
  1. **título** contém todos os termos; 2. **cargo equivalente** (mesmo grupo — ex.: auxiliar ⇄ assistente
  administrativo); 3. **cargo relacionado** (relações explícitas em `ROLE_RELATIONS`, ou estágio/aprendiz/trainee
  do cargo); 4. **competências, requisitos ou descrição**.
- Cargos relacionados aparecem depois, na seção "Oportunidades relacionadas". Se não houver título exato, a
  página avisa "Não encontramos vagas com esse título exato".
- Para evitar resultados genéricos: só relações explícitas (não "mesma área"); competências típicas do cargo
  só contam contra as competências técnicas/obrigatórias da vaga; expressões que perdem palavras de conteúdo
  ao remover termos genéricos são descartadas.
- Vagas de fontes externas (Adzuna/Greenhouse) já vêm filtradas pela própria fonte: recebem um nível de
  relevância, mas não são descartadas.

### Local de referência (bairro)
- `GET /api/jobs?...&ref=<id>`: o `id` precisa estar na lista permitida (`server/src/data/neighborhoods.js`,
  única fonte de coordenadas); valores inválidos → **400**. Coordenadas livres não são aceitas. Sem `ref`,
  usa-se **Centro (Casa do Trabalhador)**, o comportamento original.
- `GET /api/config` passou a incluir `references` (lista de bairros) e `defaultReference`. A resposta de
  `/api/jobs` traz `center` com `id` e `name` do bairro usado.
- A distância é calculada no servidor (Haversine) a partir do bairro escolhido; o mapa e o círculo de raio
  são centralizados nele. Vagas sem coordenadas não recebem distância e ficam na seção "Sem localização no mapa".
- O cache do navegador inclui o bairro na chave; o cache do servidor guarda só os dados brutos das fontes
  (antes do cálculo de distância), então nunca reaproveita distâncias de outro bairro.
- **Limitação:** a Adzuna é consultada por cidade (Maricá; Niterói e Rio a partir de 25/50 km) e depois
  filtrada pela distância calculada com as coordenadas aproximadas que ela mesma informa — não há busca
  por bairro na API.

### Filtros e ordenação
- **Filtros rápidos** ao lado da busca (bairro, distância, contratação, modalidade, área); "Mais filtros"
  abre o painel completo. Filtros ativos aparecem como chips removíveis; "Limpar tudo" mantém a palavra buscada.
- **Salário inicial mínimo:** compara com o **limite inferior** da faixa (R$ 1.800–3.000 conta como R$ 1.800);
  salário fixo vale o próprio valor; vagas sem salário ou só com teto ("até R$ X") são tratadas como "salário
  inicial não informado" e só aparecem com a opção "Incluir vagas sem salário inicial informado". Nenhum
  salário é inventado.
- **Ordenar por:** relevância (só com busca), maior compatibilidade (só com currículo), menor distância
  (vagas sem distância por último), mais recentes (data de publicação; nas vagas demo, a data é fictícia) e
  maior salário inicial (limite inferior; empate pelo teto; sem salário por último). Padrão: "Para Você" →
  compatibilidade; com busca → relevância; senão → distância.
- **Empresa:** `empresa=<id>` filtra pelo identificador da empresa (nunca por semelhança de nome); usado pelo
  botão "Ver vagas desta empresa".

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
├── shared/                       # usado pelo servidor E pelo navegador
│   ├── professionalTerms.js      # áreas, cargos, sinônimos, relações, competências, abreviações
│   ├── textNormalization.js      # normalização, palavras irrelevantes, extração de termos
│   └── jobSearch.js              # busca tolerante e níveis de relevância
├── docs/roteiro-usabilidade.md   # roteiro e fichas para testes com participantes
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
│   └── test/ (smoke, geocoding, demo, reference)
└── client/
    ├── .env.example
    ├── public/exemplos/              # currículos fictícios (PDF/DOCX) para demonstrar a importação
    ├── scripts/make-sample-resumes.mjs
    ├── test/ (matching, resume, search, filters, profile)   # node --test
    └── src/
        ├── App.jsx                   # rotas (React Router, páginas carregadas sob demanda)
        ├── context/ (ConfigContext, ResumeContext — currículo no localStorage)
        ├── pages/ (LandingPage, JobsPage, MapPage, CompaniesPage, CompanyDetailsPage, ResumePage, AboutPage, NotFoundPage)
        ├── components/
        │   ├── layout/    (AppLayout, Navbar, BottomNav, Footer, Logo, navItems, useNavTarget)
        │   ├── jobs/      (SearchBar, QuickFilters/ActiveFilters, FilterPanel, ReferenceSelect, RadiusSlider,
        │   │               JobCard, JobList/SortSelect, JobDetails, MatchTabs)
        │   ├── companies/ (CompanyCard, CompanyBadges, StarRating)
        │   ├── resume/    (FormControls, ImportPanel, QuickProfile)
        │   ├── map/       (MapView, MapArea)
        │   └── ui/        (Badge, Notice, Drawer/modal, DemoNotice)
        ├── data/skillsDictionary.js  # reexporta /shared
        ├── hooks/ (useJobs, useJobSearch, useAsync, useMediaQuery, usePageTitle)
        ├── services/ (api, matchingService, resumeParser, resumeExtract)
        └── utils/ (geo, format, search, resumeProgress, textNormalization → /shared)
```

### Páginas

| Rota      | Conteúdo |
|-----------|----------|
| `/`              | Dois caminhos (encontrar vagas agora / vagas para meu perfil), como funciona, vagas perto do seu bairro, categorias, recentes |
| `/vagas`         | Busca, filtros rápidos, abas Para Você / Outras Vagas, ordenação, lista, mapa e detalhes |
| `/mapa`          | Mesma busca de `/vagas` em mapa amplo; no celular, mapa em tela cheia com lista em gaveta |
| `/empresas`      | Avaliações de empresas (simuladas): busca, setor, ordenação por nota/popularidade |
| `/empresas/:id`  | Detalhes: notas por critério, distribuição, posições e "Oportunidades desta empresa" |
| `/curriculo`     | Perfil Rápido e Currículo Completo (`?modo=rapido|completo`), importação PDF/DOCX, privacidade e exclusão |
| `/sobre`         | Propósito, como usar, origem dos dados, demonstração, recomendações e privacidade |

`/vagas` e `/mapa` compartilham a mesma busca pela URL (o link pode ser copiado e compartilhado):

```
/vagas?q=vendedor&bairro=itaipuacu&raio=10&tipo=emprego&modalidade=presencial&contratacao=clt&area=vendas
      &empresa=<id>&salario=2000&semSalario=0&ordem=recentes&aba=para-voce&vaga=<id>
```

`raio` aceita os mesmos valores do backend (1, 5, 10, 15, 25, 50, 100; padrão 25 km). Valores padrão são
omitidos e valores inválidos voltam ao padrão. Ao alternar entre "Encontrar vagas" e "Explorar no mapa" pelo
menu, a busca vai junto.

**Navegação:** no desktop, os destinos principais (Encontrar vagas, Explorar no mapa, Meu currículo) têm
destaque; Avaliações de empresas e Sobre o projeto ficam menores. No celular, a barra inferior tem 4 itens
(Início, Vagas, Mapa, Currículo) e o menu do topo lista todas as páginas.

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
3. A distância é calculada com **Haversine**, em linha reta, a partir do **bairro de referência** escolhido
   (padrão: Casa do Trabalhador, no Centro). O filtro final usa coordenadas, não nomes de cidades.
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
- Tiles do mapa não carregam (ou o navegador está sem internet): o mapa é coberto pela mensagem "Não foi
  possível carregar o mapa. As vagas continuam disponíveis na lista." e volta sozinho quando a conexão
  retorna. A busca, os filtros, o bairro e a distância continuam funcionando, pois as vagas demo são locais.
  Os tiles **não** são baixados para uso offline: o servidor público do OpenStreetMap não permite download
  em massa. Para uma apresentação sem internet garantida, rode backend e frontend localmente
  (`npm run dev`): só o mapa-base e as fontes do Google Fonts dependem de rede (o texto usa a fonte do sistema).
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

- `npm test`: **82 testes** — 37 do servidor + 45 do cliente, todos passando. Cobrem: 60 vagas e distribuição
  exata; bairros de referência (lista permitida, id inválido, distância a partir do bairro, resultados
  diferentes por bairro); busca (auxiliar ⇄ assistente administrativo, equivalentes, relacionados, acentos,
  plural/feminino, erros de digitação, abreviações, consultas sem resultado, prevenção de resultados genéricos,
  ordem por relevância); filtros (salário pelo início da faixa, contratação, modalidade, área, empresa,
  combinações, limpeza, URL de ida e volta); ordenações; lista × mapa com o mesmo subconjunto em cada aba;
  Perfil Rápido sem apagar o currículo completo; primeiro emprego; recomendação; importação real de PDF e DOCX.
- `npm run build`: sem erros nem avisos.
- Navegador, em 320, 375, 768, 1024 e 1440 px: nenhuma página com rolagem horizontal (com e sem perfil);
  busca "Auxiliar administrativo" → "Assistente administrativo" como cargo equivalente; bairro Itaipuaçu com
  5 km; Perfil Rápido → "Para Você"; lista e mapa com as mesmas vagas ao alternar pelo menu; empresa → vagas
  da empresa; no celular, o marcador selecionado fica visível acima do cartão e o zoom não fica coberto pela
  busca nem pelo cartão. Build de produção servido pelo Express sem erros no console.
- **Mapa sem internet:** simulado com os eventos `offline`/`online` do navegador (o painel de testes não pode
  ser desconectado de verdade): o mapa é coberto pela mensagem, a lista continua funcionando (e, no celular,
  o botão "Ver vagas em lista" abre a lista), o painel de detalhes fica acima da mensagem e o mapa volta
  quando a conexão retorna. Uma queda real de rede não foi testada.
- **Adzuna e Greenhouse não foram testadas com dados reais** (credenciais não configuradas no ambiente).

### Limitações conhecidas
- Vagas e avaliações são fictícias/simuladas; não há candidatura real nem cadastro de avaliações.
- A interpretação de currículos é por regras: funciona melhor com currículos organizados em seções
  ("Objetivo", "Experiência"…). Sem OCR para PDFs escaneados.
- Várias vagas do mesmo bairro compartilham o mesmo ponto de referência e aparecem agrupadas no mapa; a
  distância entre vagas e o bairro de referência é calculada entre pontos aproximados de bairro.
- A busca por cargos depende do dicionário (`shared/professionalTerms.js`): cargos fora dele só são
  encontrados pelo título ou pelo texto da vaga. Ampliar o dicionário melhora os resultados.
- O mapa-base não funciona sem internet (não há tiles offline); a busca e a lista funcionam.
- O currículo fica em um único navegador (sem conta/sincronização), por decisão de privacidade.
- `npm audit` ainda aponta, no React Router 6, um redirecionamento aberto via `\` em `<Link>`/`navigate`
  (o app só navega para caminhos fixos) e um problema de hidratação SSR (o app não usa SSR); a correção exige
  migrar para o v7. O alerta do esbuild afeta apenas o servidor de desenvolvimento do Vite 5.
