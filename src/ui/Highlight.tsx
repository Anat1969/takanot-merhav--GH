import type { Searcher } from '../search/index.ts';

/** מסמן במרקר מילים שמתאימות למונחי החיפוש */
export function Highlight({ text, terms, searcher }: { text: string; terms: string[]; searcher: Searcher }) {
  if (!terms.length) return <>{text}</>;
  return (
    <>
      {text.split(/(\s+)/).map((w, i) =>
        /\S/.test(w) && searcher.matchesWord(w, terms) ? <mark key={i}>{w}</mark> : w,
      )}
    </>
  );
}
