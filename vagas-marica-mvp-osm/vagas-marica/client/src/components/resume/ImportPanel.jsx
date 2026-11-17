import { useRef, useState } from 'react';
import { CheckCircle2, Download, FileUp, Loader2, ShieldCheck } from 'lucide-react';
import Notice from '../ui/Notice.jsx';
import { extractResumeText, MAX_FILE_BYTES } from '../../services/resumeExtract.js';
import { parseResumeText } from '../../services/resumeParser.js';

const FIELD_LABELS = {
  name: 'nome', objective: 'objetivo', desiredRoles: 'cargos desejados', city: 'cidade', neighborhood: 'bairro',
  educationLevel: 'escolaridade', formations: 'formação', courses: 'cursos', experiences: 'experiências',
  hardSkills: 'competências técnicas', softSkills: 'competências comportamentais', languages: 'idiomas',
  desiredContracts: 'tipos de contratação', desiredModes: 'modalidade', areas: 'áreas de interesse',
};

/**
 * Importação de currículo: seleciona o arquivo, valida, extrai o texto NO NAVEGADOR,
 * identifica informações e entrega um RASCUNHO para revisão (nada é salvo aqui).
 */
export default function ImportPanel({ onImported, hasSaved = false }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState({ state: 'idle' });
  const [dragging, setDragging] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setStatus({ state: 'reading', fileName: file.name });
    try {
      const text = await extractResumeText(file);
      const { draft, found } = parseResumeText(text);
      onImported(draft, found);
      setStatus({ state: 'done', fileName: file.name, found });
    } catch (error) {
      setStatus({ state: 'error', fileName: file.name, message: error.message || 'Não foi possível ler o arquivo.' });
    } finally {
      if (inputRef.current) inputRef.current.value = ''; // o arquivo não fica retido no formulário
    }
  }

  const busy = status.state === 'reading';

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors ${dragging ? 'border-brand bg-brand-soft' : 'border-slate-300 bg-surface/60'}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand shadow-card">
          {busy ? <Loader2 size={24} className="animate-spin" aria-hidden="true" /> : <FileUp size={24} aria-hidden="true" />}
        </span>
        <p className="mt-3 text-sm font-semibold text-ink">{busy ? `Lendo ${status.fileName}…` : 'Arraste o arquivo aqui ou selecione'}</p>
        <p className="mt-1 text-xs text-muted">PDF ou DOCX, até {MAX_FILE_BYTES / 1024 / 1024} MB</p>
        <label className={`btn btn-sm btn-primary mt-4 cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          <FileUp size={16} aria-hidden="true" /> Selecionar currículo
          <input
            ref={inputRef} type="file" className="sr-only" disabled={busy}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => handleFile(e.target.files?.[0])}
            aria-describedby="import-privacy"
          />
        </label>
      </div>

      <p id="import-privacy" className="flex gap-2 text-xs leading-relaxed text-muted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
        O arquivo é lido apenas neste navegador: não é enviado a servidores nem guardado. Dados como CPF, RG, data de
        nascimento, telefone e e-mail são ignorados.
      </p>

      {status.state === 'error' && <Notice tone="error" title="Não foi possível importar">{status.message}</Notice>}
      {status.state === 'done' && (
        <div role="status" className="flex gap-3 rounded-xl border border-green-200 bg-success-soft p-3.5 text-sm text-green-900">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="font-semibold">Texto lido de {status.fileName}</p>
            <p className="mt-0.5 text-[13px]">
              {status.found.length
                ? <>
                    Sugerimos: {status.found.map((f) => FIELD_LABELS[f]).filter(Boolean).join(', ')}. <strong>Revise e corrija os campos destacados abaixo e clique em “Salvar currículo”.</strong>
                    {hasSaved && ' Esses campos foram trocados só no rascunho: seu currículo salvo não mudou. Para voltar a ele, use “Descartar”.'}
                  </>
                : 'Não identificamos informações automaticamente. Preencha os campos manualmente.'}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Não tem um currículo à mão? Use um exemplo fictício:{' '}
        <a href="/exemplos/curriculo-exemplo.pdf" download className="inline-flex items-center gap-1 font-semibold text-brand-dark hover:underline"><Download size={13} aria-hidden="true" />PDF</a>{' '}
        ·{' '}
        <a href="/exemplos/curriculo-exemplo.docx" download className="inline-flex items-center gap-1 font-semibold text-brand-dark hover:underline"><Download size={13} aria-hidden="true" />DOCX</a>
      </p>
    </div>
  );
}
