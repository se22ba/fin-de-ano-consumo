import { catalog } from "../data/catalog.js";

const idToLabel = new Map(
  [...catalog.drinks, ...catalog.sweets].map((x) => [x.id, x.label])
);

/**
 * Unidades base POR PERSONA (evento completo) antes de aplicar calor.
 * - drinksLiters: litros por persona si marcó ese item
 * - drinksMl: ml por persona (para fernet)
 * - sweetsGrams: gramos por persona si marcó ese item
 *
 * Ajustes por edad: teen=0.8, kid=0.6, toddler=0.4 respecto del adulto,
 * salvo alcohol, que para menores se ignora.
 */
const basePerPerson = {
  // Bebidas
  beer_blonde: { drinksLiters: 1.0 },   // si la elige, estimamos 1L a lo largo del evento
  beer_dark: { drinksLiters: 0.5 },
  coke: { drinksLiters: 1.2 },
  pomelo: { drinksLiters: 1.0 },
  water: { drinksLiters: 1.0 },

  // Fernet + Coke: se descompone en fernet ml + coke litros extra
  fernet_coke: { drinksMl: 180, drinksLiters: 0.6 }, // 180ml fernet + 0.6L coca
  sidra: { drinksLiters: 0.35 },        // ~2 copas
  sidra_na: { drinksLiters: 0.35 },
  anana_fizz: { drinksLiters: 0.35 },

  // Mesa dulce (por persona que lo elige)
  mani_choco: { sweetsGrams: 60 },
  turron: { sweetsGrams: 40 },
  pan_dulce_frutas: { sweetsGrams: 80 },
  pan_dulce_sin: { sweetsGrams: 80 },
  garrapinadas: { sweetsGrams: 50 },
  mantecol: { sweetsGrams: 45 }
};

const ageMultiplier = {
  adult: 1.0,
  teen: 0.8,
  kid: 0.6,
  toddler: 0.4
};

function isAlcohol(id) {
  return ["beer_blonde", "beer_dark", "fernet_coke", "sidra", "anana_fizz"].includes(id);
}

function roundNice(value, step) {
  return Math.ceil(value / step) * step;
}

/**
 * Convierte totales (litros) en sugerencias de compra (botellas/latas).
 * Podés afinar marcas/tamaños después.
 */
function packagingSuggestions(totals) {
  const out = [];

  // Cervezas: 473ml lata (o 500ml). Tomo 473ml para ser conservador.
  if (totals.beer_blonde_l > 0) {
    const cans = Math.ceil((totals.beer_blonde_l * 1000) / 473);
    out.push({ item: "Cerveza rubia", buy: `${cans} latas (473ml aprox)` });
  }
  if (totals.beer_dark_l > 0) {
    const cans = Math.ceil((totals.beer_dark_l * 1000) / 473);
    out.push({ item: "Cerveza negra", buy: `${cans} latas (473ml aprox)` });
  }

  // Coca / Pomelo / Agua: botellas de 2.25L
  const toBottles225 = (liters) => Math.ceil(liters / 2.25);

  if (totals.coke_l > 0) {
    out.push({ item: "Coca-Cola", buy: `${toBottles225(totals.coke_l)} botellas (2.25L)` });
  }
  if (totals.pomelo_l > 0) {
    out.push({ item: "Pomelo", buy: `${toBottles225(totals.pomelo_l)} botellas (2.25L)` });
  }
  if (totals.water_l > 0) {
    // agua suele ser 2L
    out.push({ item: "Agua", buy: `${Math.ceil(totals.water_l / 2)} botellas (2L)` });
  }

  // Fernet: botella 750ml (o 1L). Sugerimos 750ml.
  if (totals.fernet_ml > 0) {
    const bottles = Math.ceil(totals.fernet_ml / 750);
    out.push({ item: "Fernet", buy: `${bottles} botella(s) (750ml)` });
  }

  // Sidras/Ananá: botella 750ml
  const toBottles750 = (liters) => Math.ceil((liters * 1000) / 750);

  if (totals.sidra_l > 0) out.push({ item: "Sidra", buy: `${toBottles750(totals.sidra_l)} botellas (750ml)` });
  if (totals.sidra_na_l > 0) out.push({ item: "Sidra sin alcohol", buy: `${toBottles750(totals.sidra_na_l)} botellas (750ml)` });
  if (totals.anana_fizz_l > 0) out.push({ item: "Ananá Fizz", buy: `${toBottles750(totals.anana_fizz_l)} botellas (750ml)` });

  return out;
}

export function calculateAggregate(responses, heatFactor = 1.35) {
  const totals = {
    beer_blonde_l: 0,
    beer_dark_l: 0,
    coke_l: 0,
    pomelo_l: 0,
    water_l: 0,
    sidra_l: 0,
    sidra_na_l: 0,
    anana_fizz_l: 0,
    fernet_ml: 0,
    sweets_g: {} // por item
  };

  for (const r of responses) {
    const mult = ageMultiplier[r.ageGroup] ?? 1;

    for (const id of r.selections || []) {
      const base = basePerPerson[id];
      if (!base) continue;

      // Alcohol: si no es adulto, lo ignoramos (por seguridad y sentido común)
      if (isAlcohol(id) && r.ageGroup !== "adult") continue;

      const effectiveMult = isAlcohol(id) ? 1.0 : mult;

      if (base.drinksLiters) {
        const liters = base.drinksLiters * effectiveMult * heatFactor;

        if (id === "beer_blonde") totals.beer_blonde_l += liters;
        else if (id === "beer_dark") totals.beer_dark_l += liters;
        else if (id === "coke") totals.coke_l += liters;
        else if (id === "pomelo") totals.pomelo_l += liters;
        else if (id === "water") totals.water_l += liters;
        else if (id === "sidra") totals.sidra_l += liters;
        else if (id === "sidra_na") totals.sidra_na_l += liters;
        else if (id === "anana_fizz") totals.anana_fizz_l += liters;
        else if (id === "fernet_coke") totals.coke_l += liters; // coke extra
      }

      if (base.drinksMl) {
        const ml = base.drinksMl * (r.ageGroup === "adult" ? 1.0 : 0.0);
        totals.fernet_ml += ml;
      }

      if (base.sweetsGrams) {
        const g = base.sweetsGrams * mult; // mesa dulce sí aplica a chicos
        totals.sweets_g[id] = (totals.sweets_g[id] ?? 0) + g;
      }
    }
  }

  // Redondeos "humanos" para no quedarte corto
  totals.coke_l = roundNice(totals.coke_l, 0.5);
  totals.pomelo_l = roundNice(totals.pomelo_l, 0.5);
  totals.water_l = roundNice(totals.water_l, 0.5);
  totals.beer_blonde_l = roundNice(totals.beer_blonde_l, 0.5);
  totals.beer_dark_l = roundNice(totals.beer_dark_l, 0.5);
  totals.sidra_l = roundNice(totals.sidra_l, 0.25);
  totals.sidra_na_l = roundNice(totals.sidra_na_l, 0.25);
  totals.anana_fizz_l = roundNice(totals.anana_fizz_l, 0.25);
  totals.fernet_ml = roundNice(totals.fernet_ml, 50);

  const sweetsSummary = Object.entries(totals.sweets_g)
    .map(([id, grams]) => ({
      id,
      label: idToLabel.get(id) ?? id,
      grams: Math.round(grams),
      suggested: grams >= 350 ? `${Math.ceil(grams / 100) * 100} g` : `${Math.ceil(grams / 50) * 50} g`
    }))
    .sort((a, b) => b.grams - a.grams);

  return {
    heatFactor,
    count: responses.length,
    totals,
    sweetsSummary,
    packaging: packagingSuggestions(totals)
  };
}