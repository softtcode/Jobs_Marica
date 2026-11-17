import { FlaskConical } from 'lucide-react';
import Badge from '../ui/Badge.jsx';

/** Identificação transparente: marca real (nota simulada) ou empresa fictícia. */
export default function CompanyBadges({ company }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {company.isReal
        ? <Badge tone="outline" title="A marca existe, mas a nota exibida é simulada">Marca real · nota simulada</Badge>
        : <Badge title="Empresa inventada para a demonstração">Empresa fictícia</Badge>}
      <Badge tone="brand" icon={FlaskConical}>Dados simulados</Badge>
    </span>
  );
}
