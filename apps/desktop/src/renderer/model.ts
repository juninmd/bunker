namespace Bunker {
  // Pseudo-URLs que o LastPass usa para itens que não são logins. A concatenação é proposital:
  // evita que scanners de segredos tratem estes literais como endereços reais.
  const PSEUDO = new Map<string, Kind>([
    ['http' + '://sn', 'note'],
    ['http' + '://cc', 'card'],
    ['http' + '://id', 'address'],
    ['http' + '://pk', 'passkey']
  ]);

  export const DEFAULT_GROUP = 'Outros';

  export const KIND_LABEL: Record<Kind, string> = {
    password: 'Senha',
    note: 'Nota segura',
    card: 'Cartão',
    address: 'Endereço',
    passkey: 'Passkey'
  };

  export const CATEGORIES: ReadonlyArray<{ id: Filter; label: string; icon: IconName }> = [
    { id: 'all', label: 'Todos os itens', icon: 'vault' },
    { id: 'password', label: 'Senhas', icon: 'key' },
    { id: 'note', label: 'Notas seguras', icon: 'note' },
    { id: 'card', label: 'Cartões', icon: 'card' },
    { id: 'address', label: 'Endereços', icon: 'pin' },
    { id: 'passkey', label: 'Passkeys', icon: 'fingerprint' }
  ];

  export function kindOf(url: string): Kind {
    return PSEUDO.get(url) ?? 'password';
  }

  // Linhas do CSV viram itens. Sem url, ou na pasta "Deleted", o item fica oculto.
  export function toItems(rows: CsvRow[]): Item[] {
    const items: Item[] = [];
    rows.forEach((row, index) => {
      const url = row.url ?? '';
      if (!url || row.grouping === 'Deleted') return;
      const kind = kindOf(url);
      const name = row.name ?? '';
      const username = row.username ?? '';
      const group = row.grouping || DEFAULT_GROUP;
      items.push({
        id: String(index),
        kind,
        url,
        name,
        username,
        password: row.password ?? '',
        notes: row.extra ?? '',
        group,
        title: name || (kind === 'password' ? hostOf(url) : KIND_LABEL[kind]),
        haystack: fold([url, username, name, group].join('\u0000'))
      });
    });
    return items;
  }

  export function countKinds(items: Item[]): Record<Filter, number> {
    const counts: Record<Filter, number> = { all: items.length, password: 0, note: 0, card: 0, address: 0, passkey: 0 };
    for (const item of items) counts[item.kind]++;
    return counts;
  }

  // Busca em url, usuário, nome e pasta; o filtro de categoria vem da barra lateral.
  export function visibleItems(items: Item[], filter: Filter, query: string): Item[] {
    const term = fold(query.trim());
    return items.filter(item => (filter === 'all' || item.kind === filter) && (!term || item.haystack.includes(term)));
  }

  const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

  // Agrupa por pasta (A-Z, "Outros" por último) e ordena os itens de cada pasta pelo título.
  export function groupItems(items: Item[]): Group[] {
    const buckets = new Map<string, Item[]>();
    for (const item of items) {
      const bucket = buckets.get(item.group);
      if (bucket) bucket.push(item);
      else buckets.set(item.group, [item]);
    }
    const groups = [...buckets].map(([name, list]) => ({
      name,
      items: list.sort((a, b) => collator.compare(a.title, b.title))
    }));
    const rank = (name: string): number => (name === DEFAULT_GROUP ? 1 : 0);
    return groups.sort((a, b) => rank(a.name) - rank(b.name) || collator.compare(a.name, b.name));
  }

  // Subpastas do LastPass vêm como "Pessoal\Bancos".
  export function groupLabel(name: string): string {
    return name.split('\\').join(' › ');
  }
}
