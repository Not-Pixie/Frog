export const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: "2-digit", 
  month: "2-digit", 
  year: "numeric"
});

const formatterCache = new Map<
  string,
  { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat }
>();

function getFormatters(locale = "pt-BR") {
  if (!formatterCache.has(locale)) {
    formatterCache.set(locale, {
      date: new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      }),
      time: new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  }
  return formatterCache.get(locale)!;
}

export const formatMovimentacaoDate = (
  iso: string | null | undefined,
  locale = "pt-BR"
) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);

  const { date, time } = getFormatters(locale);
  return `${date.format(d)} - ${time.format(d)}`;
};

export const formatCurrencyBRLRoundedDown = 
    (value: number | string): string => {
      let rounded = null;
      const n = Number(value ?? 0);
      if (!isFinite(n)) rounded = 0;
      else rounded = Math.floor((n + Number.EPSILON) * 100) / 100;
      return rounded.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }