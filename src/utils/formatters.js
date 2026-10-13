export const cents = (value) => Math.round(Number(value || 0) * 100);

export const money = (value, currency = "") =>
  `${(Number(value || 0) / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
  })} ${currency}`;

export const formatDate = (value) => {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};
