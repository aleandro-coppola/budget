export const euro = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
export const pct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;
