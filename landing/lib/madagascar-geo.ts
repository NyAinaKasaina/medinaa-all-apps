// AUTO-GENERATED — région/district data for the landing search + coverage map.
// Names come from backend seed 003_seed_regions_districts.sql (24 régions, ~114 districts).
// x/y are the region centroid projected onto the silhouette's 0 0 1024 1024 viewBox
// (equirectangular fit to the island bounding box). Verify visually; nudge tip regions if needed.
export interface MgRegion {
  id: number;
  name: string;
  /** centroid X in the 0..1024 viewBox */
  x: number;
  /** centroid Y in the 0..1024 viewBox */
  y: number;
  districts: string[];
}

export const REGIONS: MgRegion[] = [
  {
    "id": 1,
    "name": "Analamanga",
    "x": 563.2,
    "y": 521.8,
    "districts": [
      "Ambohidratrimo",
      "Andramasina",
      "Anjozorobe",
      "Ankazobe",
      "Antananarivo-Atsimondrano",
      "Antananarivo-Avaradrano",
      "Antananarivo-Renivohitra",
      "Manjakandriana"
    ]
  },
  {
    "id": 2,
    "name": "Vakinankaratra",
    "x": 526.6,
    "y": 593.8,
    "districts": [
      "Ambatolampy",
      "Antanifotsy",
      "Antsirabe I",
      "Antsirabe II",
      "Betafo",
      "Faratsiho",
      "Mandoto"
    ]
  },
  {
    "id": 3,
    "name": "Itasy",
    "x": 505.7,
    "y": 528.5,
    "districts": [
      "Arivonimamo",
      "Miarinarivo",
      "Soavinandriana"
    ]
  },
  {
    "id": 4,
    "name": "Bongolava",
    "x": 441.8,
    "y": 483.6,
    "districts": [
      "Fenoarivobe",
      "Tsiroanomandidy"
    ]
  },
  {
    "id": 5,
    "name": "Haute Matsiatra",
    "x": 524.4,
    "y": 712.2,
    "districts": [
      "Ambalavao",
      "Ambohimahasoa",
      "Fianarantsoa I",
      "Ikalamavony",
      "Isandra",
      "Lalangina",
      "Vohibato"
    ]
  },
  {
    "id": 6,
    "name": "Amoron'i Mania",
    "x": 531.6,
    "y": 643.2,
    "districts": [
      "Ambatofinandrahana",
      "Ambositra",
      "Fandriana",
      "Manandriana"
    ]
  },
  {
    "id": 7,
    "name": "Vatovavy",
    "x": 589.1,
    "y": 701,
    "districts": [
      "Ifanadiana",
      "Mananjary",
      "Nosy Varika"
    ]
  },
  {
    "id": 8,
    "name": "Fitovinany",
    "x": 574.7,
    "y": 761,
    "districts": [
      "Ikongo",
      "Manakara",
      "Vohipeno"
    ]
  },
  {
    "id": 9,
    "name": "Atsimo-Atsinanana",
    "x": 546,
    "y": 828.4,
    "districts": [
      "Befotaka",
      "Farafangana",
      "Midongy-Atsimo",
      "Vangaindrano",
      "Vondrozo"
    ]
  },
  {
    "id": 10,
    "name": "Ihorombe",
    "x": 445.4,
    "y": 794.7,
    "districts": [
      "Iakora",
      "Ihosy",
      "Ivohibe"
    ]
  },
  {
    "id": 11,
    "name": "Atsinanana",
    "x": 660.9,
    "y": 521,
    "districts": [
      "Antanambao-Manampotsy",
      "Brickaville",
      "Mahanoro",
      "Marolambo",
      "Toamasina I",
      "Toamasina II",
      "Vatomandry"
    ]
  },
  {
    "id": 12,
    "name": "Analanjirofo",
    "x": 689.6,
    "y": 393.6,
    "districts": [
      "Fenoarivo-Atsinanana",
      "Nosy Boraha",
      "Soanierana-Ivongo",
      "Vavatenina"
    ]
  },
  {
    "id": 13,
    "name": "Ambatosoa",
    "x": 718.4,
    "y": 269.9,
    "districts": [
      "Mananara Avaratra",
      "Maroantsetra"
    ]
  },
  {
    "id": 14,
    "name": "Alaotra-Mangoro",
    "x": 617.8,
    "y": 483.6,
    "districts": [
      "Ambatondrazaka",
      "Amparafaravola",
      "Andilamena",
      "Anosibe-An'ala",
      "Moramanga"
    ]
  },
  {
    "id": 15,
    "name": "Boeny",
    "x": 495.7,
    "y": 311.1,
    "districts": [
      "Ambato-Boeni",
      "Mahajanga I",
      "Mahajanga II",
      "Marovoay",
      "Mitsinjo",
      "Soalala"
    ]
  },
  {
    "id": 16,
    "name": "Sofia",
    "x": 610.6,
    "y": 236.2,
    "districts": [
      "Analalava",
      "Antsohihy",
      "Bealanana",
      "Befandriana Avaratra",
      "Boriziny",
      "Mampikony",
      "Mandritsara"
    ]
  },
  {
    "id": 17,
    "name": "Betsiboka",
    "x": 517.2,
    "y": 393.6,
    "districts": [
      "Kandreho",
      "Maevatanana",
      "Tsaratanana"
    ]
  },
  {
    "id": 18,
    "name": "Melaky",
    "x": 373.6,
    "y": 453.6,
    "districts": [
      "Ambatomainty",
      "Antsalova",
      "Besalampy",
      "Maintirano",
      "Morafenobe"
    ]
  },
  {
    "id": 19,
    "name": "Atsimo-Andrefana",
    "x": 330.5,
    "y": 828.4,
    "districts": [
      "Ampanihy",
      "Ankazoabo-Atsimo",
      "Benenitra",
      "Beroroha",
      "Betioky-Atsimo",
      "Morombe",
      "Sakaraha",
      "Toliara I",
      "Toliara II"
    ]
  },
  {
    "id": 20,
    "name": "Androy",
    "x": 438.2,
    "y": 963.4,
    "districts": [
      "Ambovombe-Androy",
      "Bekily",
      "Beloha",
      "Tsihombe"
    ]
  },
  {
    "id": 21,
    "name": "Anosy",
    "x": 495.7,
    "y": 925.9,
    "districts": [
      "Amboasary-Atsimo",
      "Betroka",
      "Taolagnaro"
    ]
  },
  {
    "id": 22,
    "name": "Menabe",
    "x": 366.4,
    "y": 611,
    "districts": [
      "Belon'i Tsiribihina",
      "Mahabo",
      "Manja",
      "Miandrivazo",
      "Morondava"
    ]
  },
  {
    "id": 23,
    "name": "Diana",
    "x": 675.3,
    "y": 86.2,
    "districts": [
      "Ambanja",
      "Ambilobe",
      "Antsiranana I",
      "Antsiranana II",
      "Nosy Be"
    ]
  },
  {
    "id": 24,
    "name": "Sava",
    "x": 736.3,
    "y": 176.2,
    "districts": [
      "Andapa",
      "Antalaha",
      "Sambava",
      "Vohemar"
    ]
  }
];

export interface LocationSuggestion {
  /** display label */
  label: string;
  /** secondary label (e.g. parent région for a district) */
  hint?: string;
  /** kind drives which deep-link param is emitted */
  kind: 'region' | 'district';
}

/** Flat, ordered list for the location autocomplete: 24 régions first, then all districts. */
export const LOCATION_SUGGESTIONS: LocationSuggestion[] = [
  ...REGIONS.map((r) => ({ label: r.name, kind: 'region' as const })),
  ...REGIONS.flatMap((r) =>
    r.districts.map((d) => ({ label: d, hint: r.name, kind: 'district' as const })),
  ),
];
