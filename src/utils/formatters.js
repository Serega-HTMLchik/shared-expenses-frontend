export const cents = (value) => Math.round(Number(value || 0) * 100);

export const money = (value, currency = "") =>
  `${(Number(value || 0) / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
  })} ${currency}`;
