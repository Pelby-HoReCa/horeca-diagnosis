const COUNTRY_TOKENS = new Set([
  'россия',
  'russia',
  'российская федерация',
  'russian federation',
]);

const FEDERAL_CITY_TOKENS = new Set([
  'москва',
  'санкт-петербург',
  'севастополь',
]);

const CITY_PREFIX_RE = /^(?:г\.?|город)\s+(.+)$/iu;
const REGION_RE =
  /\b(?:обл\.?|область|край|респ\.?|республика|авт(?:ономный)?\.?\s*округ|ао|фед(?:еральный)?\s*округ)\b/iu;
const NON_CITY_PART_RE =
  /\b(?:городской|парк|сквер|улиц|ул\.|просп|пр-т|переул|пер\.|бульв|бул\.|шоссе|набереж|наб\.|площад|пл\.|дом|д\.|корп|кв\.|стр\.|офис|этаж|район|р-н|микрорай|мкр|территор|тер\.|жк|тц|трц|бц|бизнес)\b/iu;

const normalizePart = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const getCityFromAddress = (address?: string, fallback = 'город'): string => {
  if (!address) {
    return fallback;
  }

  const parts = String(address)
    .split(',')
    .map((part) => normalizePart(part))
    .filter(Boolean);

  if (parts.length === 0) {
    return fallback;
  }

  // Убираем ведущие страновые токены
  while (parts.length > 0 && COUNTRY_TOKENS.has(parts[0].toLowerCase())) {
    parts.shift();
  }

  if (parts.length === 0) {
    return fallback;
  }

  // 1) Пытаемся достать именно город (строго "г."/"город" или федеральные города)
  for (const part of parts) {
    const cityMatch = part.match(CITY_PREFIX_RE);
    if (cityMatch?.[1]) {
      const city = normalizePart(cityMatch[1].replace(/[.;]+$/g, ''));
      if (city) {
        return city;
      }
    }

    if (FEDERAL_CITY_TOKENS.has(part.toLowerCase())) {
      return part;
    }
  }

  // 2) Если явного префикса нет, ищем "чистое" название города
  for (const part of parts) {
    const normalized = normalizePart(part);
    if (!normalized) continue;
    if (REGION_RE.test(normalized)) continue;
    if (NON_CITY_PART_RE.test(normalized)) continue;
    if (/\d/.test(normalized)) continue;
    if (normalized.toLowerCase() === 'город') continue;

    const wordsCount = normalized.split(' ').filter(Boolean).length;
    if (wordsCount > 4) continue;

    return normalized;
  }

  // 3) Если город не нашли, тянем регион
  for (const part of parts) {
    if (REGION_RE.test(part)) {
      return part;
    }
  }

  return fallback;
};
