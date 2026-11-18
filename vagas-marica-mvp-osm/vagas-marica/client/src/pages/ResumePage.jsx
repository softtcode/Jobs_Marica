import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Briefcase, CheckCircle2, Circle, FileText, FileUp, GraduationCap, HardDrive, Languages,
  Lightbulb, RotateCcw, Save, Sparkles, Target, Trash2, User, Zap,
} from 'lucide-react';
import ImportPanel from '../components/resume/ImportPanel.jsx';
import QuickProfile from '../components/resume/QuickProfile.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { mergeQuickProfile, resumeProgress } from '../utils/resumeProgress.js';
import { ChipGroup, Field, RepeatableList, Section, TagInput } from '../components/resume/FormControls.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import Notice from '../components/ui/Notice.jsx';
import { EMPTY_RESUME, useResume } from '../context/ResumeContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import {
  AREAS, CONTRACT_TYPES, EDUCATION_LEVELS, LANGUAGE_LEVELS, LANGUAGES, MARICA_NEIGHBORHOODS, ROLES, SKILLS, WORK_MODES,
} from '../data/skillsDictionary.js';
import { dedupeLabels } from '../utils/textNormalization.js';

const HARD = SKILLS.filter((s) => s.type === 'hard').map((s) => s.label);
const SOFT = SKILLS.filter((s) => s.type === 'soft').map((s) => s.label);
const ROLE_LABELS = ROLES.map((r) => r.label);
const YEAR_NOW = new Date().getFullYear();

const NAV = [
  ['importar', 'Importar'], ['dados', 'Dados básicos'], ['objetivo', 'Objetivo'], ['experiencias', 'Experiências'],
  ['formacao', 'Formação'], ['competencias', 'Competências'], ['idiomas', 'Idiomas'], ['preferencias', 'Preferências'],
];

const clean = (f) => ({
  ...f,
  // Ao cadastrar uma experiência, "ainda não tenho experiência" deixa de valer automaticamente.
  noExperience: f.experiences.some((e) => e.role?.trim() || e.company?.trim()) ? false : Boolean(f.noExperience),
  name: f.name.trim().slice(0, 80),
  objective: f.objective.trim().slice(0, 600),
  desiredRoles: dedupeLabels(f.desiredRoles),
  hardSkills: dedupeLabels(f.hardSkills),
  softSkills: dedupeLabels(f.softSkills),
  experiences: f.experiences.filter((e) => e.role?.trim() || e.company?.trim() || e.description?.trim()),
  formations: f.formations.filter((x) => x.course?.trim()),
  courses: f.courses.filter((x) => x.name?.trim()),
  languages: f.languages.filter((x) => x.name),
});

export default function ResumePage() {
  usePageTitle('Meu Currículo');
  const navigate = useNavigate();
  const { references = [] } = useConfig();
  const [params, setParams] = useSearchParams();
  const { resume, save, clear, storageError, hasResume } = useResume();
  const [form, setForm] = useState(() => ({ ...EMPTY_RESUME, ...(resume || {}) }));
  const [dirty, setDirty] = useState(false);
  const [suggested, setSuggested] = useState(new Set());
  const [savedAt, setSavedAt] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Dois jeitos de preencher o MESMO perfil: rápido (padrão para quem ainda não tem) ou completo.
  const mode = params.get('modo') === 'rapido' || (!params.get('modo') && !resume) ? 'rapido' : 'completo';
  const setMode = (m) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('modo', m); return n; }, { replace: true });

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setDirty(true); setSavedAt(null); };
  const progress = useMemo(() => resumeProgress(form), [form]);
  const hasOtherSavedData = Boolean(resume && (resume.experiences?.length || resume.courses?.length || resume.formations?.length || resume.languages?.length));

  // Perfil Rápido → salva (mesclando com o que já existe) e abre as vagas recomendadas.
  const onFind = () => {
    const data = clean(mergeQuickProfile(resume ? { ...EMPTY_RESUME, ...resume } : { ...EMPTY_RESUME }, form));
    if (!save(data)) return;
    setForm({ ...EMPTY_RESUME, ...data });
    setDirty(false);
    const ref = references.find((r) => r.name === data.neighborhood);
    navigate(`/vagas?aba=para-voce${ref && ref.id !== 'centro' ? `&bairro=${ref.id}` : ''}`);
  };

  const discard = () => {
    setForm({ ...EMPTY_RESUME, ...(resume || {}) });
    setDirty(false);
    setSuggested(new Set());
  };

  // Aviso ao sair da página com alterações não salvas.
  useEffect(() => {
    if (!dirty) return undefined;
    const onUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const onImported = (draft, found) => {
    // Campos encontrados substituem os atuais no RASCUNHO; nada é salvo sem confirmação.
    setForm((f) => ({ ...f, ...Object.fromEntries(found.map((k) => [k, draft[k]])) }));
    setSuggested(new Set(found));
    setDirty(true);
    setSavedAt(null);
  };

  const onSave = (e) => {
    e?.preventDefault();
    const data = clean(form);
    if (save(data)) {
      setForm({ ...EMPTY_RESUME, ...data });
      setDirty(false);
      setSuggested(new Set());
      setSavedAt(new Date());
    }
  };

  const onDelete = () => {
    clear();
    setForm({ ...EMPTY_RESUME });
    setDirty(false);
    setSuggested(new Set());
    setSavedAt(null);
    setConfirmDelete(false);
  };

  const hi = (...keys) => keys.some((k) => suggested.has(k));

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="container-page relative py-12 sm:py-14">
          <p className="eyebrow text-brand-light">Perfil profissional</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Meu Currículo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Responda o Perfil Rápido para receber recomendações em um minuto, ou preencha o currículo completo quando
            quiser. Tudo fica salvo apenas neste navegador — sem cadastro e sem envio a servidores.
          </p>
          <div role="tablist" aria-label="Forma de preenchimento" className="mt-6 inline-grid grid-cols-2 gap-1 rounded-2xl bg-white/10 p-1">
            {[['rapido', 'Perfil Rápido', Zap], ['completo', 'Currículo Completo', FileText]].map(([id, label, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${mode === id ? 'bg-white text-navy' : 'text-slate-200 hover:bg-white/10'}`}>
                <Icon size={16} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <form onSubmit={onSave} className={`container-page grid grid-cols-1 gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_300px] ${dirty ? 'pb-24 lg:pb-8' : ''}`} noValidate>
        {mode === 'rapido' ? (
          <QuickProfile form={form} set={set} references={references} onFind={onFind} hasOtherSavedData={hasOtherSavedData} />
        ) : (
        <div className="space-y-5">
          <nav aria-label="Seções do currículo" className="scroll-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand/40 hover:text-brand-dark">{label}</a>
            ))}
          </nav>

          <Section id="importar" icon={FileUp} title="Importar currículo" description="Leia um PDF ou DOCX e revise as sugestões antes de salvar.">
            <ImportPanel onImported={onImported} hasSaved={Boolean(resume)} />
          </Section>

          <Section id="dados" icon={User} title="Dados básicos" highlight={hi('name', 'city', 'neighborhood')}
            description="Informe só o necessário. CPF, RG, data de nascimento e contatos não são pedidos.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cv-name" label="Nome">
                <input id="cv-name" className="field" value={form.name} maxLength={80} autoComplete="name" onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field id="cv-city" label="Cidade">
                <input id="cv-city" className="field" value={form.city} maxLength={60} onChange={(e) => set({ city: e.target.value })} />
              </Field>
              <Field id="cv-neigh" label="Bairro" hint="Usado para indicar vagas próximas.">
                <input id="cv-neigh" className="field" list="cv-neigh-list" value={form.neighborhood} maxLength={60} onChange={(e) => set({ neighborhood: e.target.value })} />
                <datalist id="cv-neigh-list">{MARICA_NEIGHBORHOODS.map((b) => <option key={b} value={b} />)}</datalist>
              </Field>
            </div>
          </Section>

          <Section id="objetivo" icon={Target} title="Objetivo profissional" highlight={hi('objective', 'desiredRoles', 'areas')}>
            <div className="space-y-4">
              <Field id="cv-obj" label="Objetivo">
                <textarea id="cv-obj" rows={3} maxLength={600} className="field h-auto py-2.5" value={form.objective}
                  placeholder="Ex.: Atuar como assistente administrativo em empresa de Maricá."
                  onChange={(e) => set({ objective: e.target.value })} />
              </Field>
              <TagInput id="cv-roles" label="Cargos desejados" values={form.desiredRoles} onChange={(desiredRoles) => set({ desiredRoles })}
                suggestions={ROLE_LABELS} placeholder="Ex.: Recepcionista, Desenvolvedor(a)" />
              <ChipGroup legend="Áreas profissionais de interesse" options={AREAS} values={form.areas} onChange={(areas) => set({ areas })} />
            </div>
          </Section>

          <Section id="experiencias" icon={Briefcase} title="Experiências profissionais" highlight={hi('experiences')}
            description="Inclua empregos, estágios, trabalhos informais e voluntários.">
            {!form.experiences.some((e) => e.role || e.company) && (
              <label className="mb-4 flex items-center gap-2.5 rounded-xl border border-line bg-surface/60 px-3.5 py-3 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-brand" checked={Boolean(form.noExperience)} onChange={(e) => set({ noExperience: e.target.checked })} />
                Ainda não tenho experiência profissional
                <span className="text-xs text-muted">(conta como resposta; você pode adicionar experiências depois)</span>
              </label>
            )}
            <RepeatableList
              items={form.experiences} onChange={(experiences) => set({ experiences, noExperience: experiences.some((e) => e.role || e.company) ? false : form.noExperience })} itemLabel="experiência"
              empty={form.noExperience ? 'Tudo certo: buscando o primeiro emprego. Vagas de entrada não ficam prejudicadas.' : 'Nenhuma experiência adicionada.'}
              addLabel="Adicionar experiência"
              renderItem={(item, update, i) => (
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field id={`exp-role-${i}`} label="Cargo">
                    <input id={`exp-role-${i}`} className="field" list="cv-role-list" value={item.role || ''} maxLength={80} onChange={(e) => update({ role: e.target.value })} />
                  </Field>
                  <Field id={`exp-co-${i}`} label="Empresa">
                    <input id={`exp-co-${i}`} className="field" value={item.company || ''} maxLength={80} onChange={(e) => update({ company: e.target.value })} />
                  </Field>
                  <Field id={`exp-start-${i}`} label="Ano de início">
                    <input id={`exp-start-${i}`} className="field" inputMode="numeric" maxLength={4} placeholder="2022" value={item.start || ''} onChange={(e) => update({ start: e.target.value.replace(/\D/g, '') })} />
                  </Field>
                  <div>
                    <Field id={`exp-end-${i}`} label="Ano de término">
                      <input id={`exp-end-${i}`} className="field" inputMode="numeric" maxLength={4} placeholder={String(YEAR_NOW)} disabled={item.current}
                        value={item.current ? '' : item.end || ''} onChange={(e) => update({ end: e.target.value.replace(/\D/g, '') })} />
                    </Field>
                    <label className="mt-2 flex items-center gap-2 text-[13px] text-slate-700">
                      <input type="checkbox" className="h-4 w-4 accent-brand" checked={Boolean(item.current)} onChange={(e) => update({ current: e.target.checked })} />
                      Trabalho atual
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <Field id={`exp-desc-${i}`} label="Principais atividades">
                      <textarea id={`exp-desc-${i}`} rows={2} maxLength={500} className="field h-auto py-2.5" value={item.description || ''} onChange={(e) => update({ description: e.target.value })} />
                    </Field>
                  </div>
                </div>
              )}
            />
            <datalist id="cv-role-list">{ROLE_LABELS.map((r) => <option key={r} value={r} />)}</datalist>
          </Section>

          <Section id="formacao" icon={GraduationCap} title="Formação e cursos" highlight={hi('educationLevel', 'formations', 'courses')}>
            <div className="space-y-6">
              <Field id="cv-edu" label="Escolaridade">
                <select id="cv-edu" className="field" value={form.educationLevel} onChange={(e) => set({ educationLevel: e.target.value })}>
                  <option value="">Selecione</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </Field>
              <div>
                <p className="label">Formação acadêmica</p>
                <RepeatableList
                  items={form.formations} onChange={(formations) => set({ formations })} itemLabel="formação"
                  empty="Nenhuma formação adicionada." addLabel="Adicionar formação"
                  renderItem={(item, update, i) => (
                    <div className="grid gap-3 pr-8 sm:grid-cols-[1fr_1fr_160px]">
                      <Field id={`for-c-${i}`} label="Curso">
                        <input id={`for-c-${i}`} className="field" value={item.course || ''} maxLength={100} placeholder="Ex.: Técnico em Administração" onChange={(e) => update({ course: e.target.value })} />
                      </Field>
                      <Field id={`for-i-${i}`} label="Instituição">
                        <input id={`for-i-${i}`} className="field" value={item.institution || ''} maxLength={100} onChange={(e) => update({ institution: e.target.value })} />
                      </Field>
                      <Field id={`for-s-${i}`} label="Situação">
                        <select id={`for-s-${i}`} className="field" value={item.status || 'concluido'} onChange={(e) => update({ status: e.target.value })}>
                          <option value="concluido">Concluído</option>
                          <option value="cursando">Cursando</option>
                        </select>
                      </Field>
                    </div>
                  )}
                />
              </div>
              <div>
                <p className="label">Cursos complementares</p>
                <RepeatableList
                  items={form.courses} onChange={(courses) => set({ courses })} itemLabel="curso"
                  empty="Nenhum curso adicionado." addLabel="Adicionar curso"
                  renderItem={(item, update, i) => (
                    <div className="grid gap-3 pr-8 sm:grid-cols-[1fr_1fr_120px]">
                      <Field id={`cur-n-${i}`} label="Curso">
                        <input id={`cur-n-${i}`} className="field" value={item.name || ''} maxLength={100} placeholder="Ex.: Excel intermediário" onChange={(e) => update({ name: e.target.value })} />
                      </Field>
                      <Field id={`cur-i-${i}`} label="Instituição">
                        <input id={`cur-i-${i}`} className="field" value={item.institution || ''} maxLength={100} onChange={(e) => update({ institution: e.target.value })} />
                      </Field>
                      <Field id={`cur-h-${i}`} label="Carga horária">
                        <input id={`cur-h-${i}`} className="field" inputMode="numeric" maxLength={4} placeholder="40" value={item.hours || ''} onChange={(e) => update({ hours: e.target.value.replace(/\D/g, '') })} />
                      </Field>
                    </div>
                  )}
                />
              </div>
            </div>
          </Section>

          <Section id="competencias" icon={Lightbulb} title="Competências" highlight={hi('hardSkills', 'softSkills')}
            description="Escreva com suas palavras: sinônimos como “planilhas” e “Excel” são reconhecidos.">
            <div className="space-y-5">
              <TagInput id="cv-hard" label="Competências técnicas" values={form.hardSkills} onChange={(hardSkills) => set({ hardSkills })}
                suggestions={HARD} placeholder="Ex.: Excel, atendimento ao cliente, React" />
              <TagInput id="cv-soft" label="Competências comportamentais" values={form.softSkills} onChange={(softSkills) => set({ softSkills })}
                suggestions={SOFT} placeholder="Ex.: Comunicação, organização" />
            </div>
          </Section>

          <Section id="idiomas" icon={Languages} title="Idiomas" highlight={hi('languages')}>
            <RepeatableList
              items={form.languages} onChange={(languages) => set({ languages })} itemLabel="idioma" max={6}
              empty="Nenhum idioma adicionado." addLabel="Adicionar idioma"
              renderItem={(item, update, i) => (
                <div className="grid gap-3 pr-8 sm:grid-cols-2">
                  <Field id={`lang-n-${i}`} label="Idioma">
                    <select id={`lang-n-${i}`} className="field" value={item.name || ''} onChange={(e) => update({ name: e.target.value })}>
                      <option value="">Selecione</option>
                      {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                  <Field id={`lang-l-${i}`} label="Nível">
                    <select id={`lang-l-${i}`} className="field" value={item.level || ''} onChange={(e) => update({ level: e.target.value })}>
                      <option value="">Selecione</option>
                      {LANGUAGE_LEVELS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                </div>
              )}
            />
          </Section>

          <Section id="preferencias" icon={Sparkles} title="Preferências" highlight={hi('desiredContracts', 'desiredModes')}>
            <div className="space-y-5">
              <ChipGroup legend="Modalidades de contratação desejadas" options={CONTRACT_TYPES} values={form.desiredContracts} onChange={(desiredContracts) => set({ desiredContracts })} />
              <ChipGroup legend="Modalidade de trabalho" options={WORK_MODES} values={form.desiredModes} onChange={(desiredModes) => set({ desiredModes })} />
            </div>
          </Section>
        </div>
        )}

        {/* Lateral: etapas respondidas, ações e privacidade */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Seu perfil</p>
              <p className="text-xs font-medium text-muted">{progress.doneCount} de {progress.total} respondidas</p>
            </div>
            <ul className="mt-3 space-y-2 text-[13px]" aria-label="Etapas do perfil">
              {progress.steps.map((st) => (
                <li key={st.id} className={`flex items-center gap-2 ${st.done ? 'text-ink' : 'text-muted'}`}>
                  {st.done
                    ? <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />
                    : <Circle size={16} className="shrink-0 text-slate-300" aria-hidden="true" />}
                  {st.label}<span className="sr-only">{st.done ? ': respondida' : ': pendente'}</span>
                </li>
              ))}
            </ul>
            <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${progress.ready ? 'bg-success-soft text-success' : 'bg-surface text-muted'}`}>
              {progress.ready ? 'Perfil pronto para recomendações' : 'Informe área ou cargo e escolaridade ou competências para receber recomendações.'}
            </p>

            {mode === 'rapido' ? (
              <button type="button" onClick={onFind} className="btn btn-lg btn-primary mt-5 h-auto min-h-12 w-full py-2.5 text-center leading-snug"><Sparkles size={18} className="shrink-0" aria-hidden="true" /> Encontrar vagas para mim</button>
            ) : (
              <button type="submit" className="btn btn-lg btn-primary mt-5 w-full"><Save size={18} aria-hidden="true" /> Salvar currículo</button>
            )}
            {dirty && (
              <div className="mt-2 flex items-center justify-center gap-3 text-xs">
                <span className="font-medium text-warning">Há alterações não salvas.</span>
                {resume && <button type="button" onClick={discard} className="inline-flex items-center gap-1 font-semibold text-brand-dark hover:underline"><RotateCcw size={12} aria-hidden="true" /> Descartar</button>}
              </div>
            )}
            {savedAt && (
              <p role="status" className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle2 size={14} aria-hidden="true" /> Salvo às {savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {storageError && <div className="mt-3"><Notice tone="error">{storageError}</Notice></div>}
            {hasResume && !dirty && (
              <Link to="/vagas?aba=para-voce" className="btn btn-md btn-outline mt-3 w-full">Ver vagas Para Você <ArrowRight size={16} aria-hidden="true" /></Link>
            )}
          </div>

          <div className="card space-y-3 p-5 text-[13px] leading-relaxed text-slate-600">
            <p className="flex items-center gap-2 font-semibold text-ink"><HardDrive size={16} className="text-brand" aria-hidden="true" /> Onde ficam seus dados</p>
            <p>
              Somente no armazenamento local (localStorage) deste navegador. Não há envio a servidores, não há
              sincronização entre dispositivos e o currículo não é exibido publicamente. O arquivo importado não é guardado.
            </p>
            <p className="flex items-center gap-2 font-semibold text-ink"><BookOpen size={16} className="text-brand" aria-hidden="true" /> Como é usado</p>
            <p>Apenas para calcular, neste navegador, a compatibilidade com as vagas. Nenhum dado pessoal sensível é usado.</p>
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={!resume && !dirty}
              className="btn btn-sm mt-1 h-auto min-h-9 w-full border border-danger/30 bg-white py-2 text-center leading-snug text-danger hover:bg-danger-soft">
              <Trash2 size={15} className="shrink-0" aria-hidden="true" /> Apagar currículo e dados locais
            </button>
          </div>
        </aside>
        {/* Celular/tablet: salvar sem precisar rolar até o fim do formulário */}
        {dirty && mode === 'completo' && (
          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <p className="flex-1 text-xs font-medium text-warning">Alterações não salvas</p>
              <button type="submit" className="btn btn-md btn-primary"><Save size={16} aria-hidden="true" /> Salvar currículo</button>
            </div>
          </div>
        )}
      </form>

      <Drawer
        open={confirmDelete} onClose={() => setConfirmDelete(false)} side="center" title="Apagar currículo?"
        footer={(
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-md btn-outline">Cancelar</button>
            <button type="button" onClick={onDelete} className="btn btn-md bg-danger text-white hover:bg-danger/90"><Trash2 size={16} aria-hidden="true" /> Apagar definitivamente</button>
          </div>
        )}
      >
        <p className="p-5 text-sm leading-relaxed text-slate-700">
          Todos os dados do currículo salvos neste navegador serão removidos. Não é possível desfazer, e as recomendações
          “Para Você” deixarão de aparecer até que você cadastre um novo currículo.
        </p>
      </Drawer>
    </>
  );
}
