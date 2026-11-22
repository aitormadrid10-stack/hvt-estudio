/** Pinta los textos del temario. Ya vienen saneados (solo <b>) desde scripts/build_content.py. */
export function RichItems({ items }: { items: [string, string][] }) {
  const out: React.ReactNode[] = [];
  let ul: [string, string][] = [];
  const flush = (k: number) => {
    if (ul.length) {
      out.push(<ul key={'u' + k}>{ul.map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it[1] }} />)}</ul>);
      ul = [];
    }
  };
  items.forEach((it, i) => {
    if (it[0] === 'li') ul.push(it);
    else {
      flush(i);
      out.push(<p key={i} dangerouslySetInnerHTML={{ __html: it[1] }} />);
    }
  });
  flush(items.length);
  return <>{out}</>;
}
