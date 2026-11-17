import { Briefcase, GraduationCap, Lightbulb, MapPin, Search, Sparkles } from 'lucide-react';
import { ChipGroup, Field, TagInput } from './FormControls.jsx';
import {
  AREAS, CONTRACT_TYPES, EDUCATION_LEVELS, ROLES, SKILLS, WORK_MODES,
} from '../../data/skillsDictionary.js';

const ROLE_LABELS = ROLES.map((r) => r.label);
const HARD = SKILLS.filter((s) => s.type === 'hard').map((s) => s.label);

function Step({ n, icon: Icon, title, hint, children }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby={`qp-${n}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-bold text-brand-light" aria-hidden="true">{n}</span>
        <div>
          <h2 id={`qp-${n}`} className="flex items-center gap-2 text-base font-bold text-ink">
            <Icon size={17} className="text-brand" aria-hidden="true" /> {title}
          </h2>
          {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Perfil Rápido: poucas perguntas para já receber recomendações. Usa a MESMA estrutura e o
 * MESMO armazenamento do currículo completo — não cria um segundo currículo.
 */
export default function QuickProfile({ form, set, references, onFind, hasOtherSavedData }) {
  const knownNeighborhood = references.some((r) => r.name === form.neighborhood);
  const neighborhoodSelect = knownNeighborhood ? form.neighborhood : form.neighborhood ? '__outro' : '';

  return (
    <div className="space-y-5">
      <Step n={1} icon={Briefcase} title="O que você procura?" hint="Escolha uma ou mais áreas e, se quiser, os cargos.">
        <div className="space-y-4">
          <ChipGroup legend="Áreas profissionais" options={AREAS} values={form.areas} onChange={(areas) => set({ areas })} />
          <TagInput id="qp-roles" label="Cargos de interesse" values={form.desiredRoles} onChange={(desiredRoles) => set({ desiredRoles })}
            suggestions={ROLE_LABELS} placeholder="Ex.: Atendente, Auxiliar administrativo" />
        </div>
      </Step>

      <Step n={2} icon={GraduationCap} title="Sua escolaridade e experiência">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="qp-edu" label="Escolaridade">
            <select id="qp-edu" className="field" value={form.educationLevel} onChange={(e) => set({ educationLevel: e.target.value })}>
              <option value="">Selecione</option>
              {EDUCATION_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </Field>
          <fieldset>
            <legend className="label">Experiência profissional</legend>
            <label className="flex min-h-11 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-brand" checked={Boolean(form.noExperience)}
                disabled={form.experiences.some((e) => e.role || e.company)}
                onChange={(e) => set({ noExperience: e.target.checked })} />
              Ainda não tenho experiência profissional
            </label>
            {form.experiences.some((e) => e.role || e.company) && (
              <p className="mt-1 text-xs text-muted">Você já cadastrou experiências no currículo completo.</p>
            )}
          </fieldset>
        </div>
      </Step>

      <Step n={3} icon={Lightbulb} title="O que você sabe fazer?" hint="Escreva com suas palavras: “planilhas”, “atendimento”, “dirigir”…">
        <TagInput id="qp-skills" label="Competências principais" values={form.hardSkills} onChange={(hardSkills) => set({ hardSkills })}
          suggestions={HARD} placeholder="Ex.: Atendimento ao cliente, Excel" />
      </Step>

      <Step n={4} icon={MapPin} title="Onde e como quer trabalhar?">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="qp-neigh" label="Seu bairro" hint="Usado para mostrar vagas perto de você. Não pedimos endereço.">
              <select id="qp-neigh" className="field" value={neighborhoodSelect}
                onChange={(e) => set({ neighborhood: e.target.value === '__outro' ? '' : e.target.value, city: 'Maricá' })}>
                <option value="">Prefiro não informar</option>
                {references.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                <option value="__outro">Outro bairro</option>
              </select>
            </Field>
            {neighborhoodSelect === '__outro' && (
              <Field id="qp-neigh-other" label="Qual bairro?">
                <input id="qp-neigh-other" className="field" maxLength={60} value={form.neighborhood} onChange={(e) => set({ neighborhood: e.target.value })} />
              </Field>
            )}
          </div>
          <ChipGroup legend="Tipos de contratação" options={CONTRACT_TYPES} values={form.desiredContracts} onChange={(desiredContracts) => set({ desiredContracts })} />
          <ChipGroup legend="Modalidade" options={WORK_MODES} values={form.desiredModes} onChange={(desiredModes) => set({ desiredModes })} />
        </div>
      </Step>

      <div className="card flex flex-col gap-3 border-brand/30 bg-gradient-to-r from-brand-soft to-white p-5 sm:flex-row sm:items-center">
        <Sparkles size={22} className="shrink-0 text-brand" aria-hidden="true" />
        <p className="flex-1 text-sm text-slate-700">
          Pronto! Vamos salvar estas respostas neste navegador e mostrar as vagas mais compatíveis.
          {hasOtherSavedData && ' Suas experiências, cursos e idiomas já salvos continuam no currículo completo.'}
        </p>
        <button type="button" onClick={onFind} className="btn btn-lg btn-primary shrink-0">
          <Search size={18} aria-hidden="true" /> Encontrar vagas para mim
        </button>
      </div>
    </div>
  );
}
