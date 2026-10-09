namespace Bunker {
  // Matiz estável (0-359) derivado do título, para o degradê do avatar.
  export function hueOf(title: string): number {
    let hash = 0;
    for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return hash % 360;
  }

  // Primeira letra ou número do título, em maiúscula; "?" quando não há nenhum.
  export function initialOf(title: string): string {
    const first = Array.from(title).find(ch => /[\p{L}\p{N}]/u.test(ch));
    return (first ?? '?').toLocaleUpperCase('pt-BR');
  }

  // Domínio legível de uma URL (sem esquema nem "www."); devolve o texto original se não for uma URL.
  export function hostOf(url: string): string {
    try {
      const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(url) ? url : `https://${url}`;
      return new URL(withScheme).hostname.replace(/^www\./, '') || url;
    } catch {
      return url;
    }
  }

  export function timeLabel(date: Date): string {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  export function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
  }

  // Minúsculas sem acentos, para a busca não depender de "cartao" x "cartão".
  export function fold(value: string): string {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
}
