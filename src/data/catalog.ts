// Canonical ASERTI product catalog, sourced from "ASERTI STORE.COM.pdf".
// Prices in GEL. Used by prisma/seed.ts and as a typed reference.

export type CatalogProduct = {
  slug: string;
  models: string[];
  category: "rings" | "earrings" | "crosses";
  material: string;
  gem?: string;
  sizeInfo?: string;
  weight: number; // grams
  price: number; // GEL
  featured?: boolean;
  // Optional real photos in /public (e.g. ["/products/wave-ring-1.jpg"]).
  // When empty, the storefront shows a category vector placeholder.
  images?: string[];
  name: { ka: string; en: string; ru: string };
  desc: { ka: string; en: string; ru: string };
};

export const CATEGORIES = ["rings", "earrings", "crosses"] as const;
export type Category = (typeof CATEGORIES)[number];

export const catalog: CatalogProduct[] = [
  {
    slug: "wave-ring",
    models: ["101R1-1", "101R1-2", "101R1-3", "101R1-4"],
    category: "rings",
    material: "925 Sterling Silver",
    sizeInfo: "S 17.5 / L 19.5",
    weight: 5,
    price: 222,
    featured: true,
    name: { ka: "ბეჭედი Wave", en: "Wave Ring", ru: "Кольцо Wave" },
    desc: {
      ka: "მოქნილი, ტალღისებრი სილუეტი 925 სპილენძვერცხლში. მსუბუქი ყოველდღიური ტარებისთვის.",
      en: "A fluid, wave-formed silhouette in 925 sterling silver. Light and made for everyday wear.",
      ru: "Плавный волнообразный силуэт из серебра 925 пробы. Лёгкое кольцо для повседневной носки.",
    },
  },
  {
    slug: "cliff-ring",
    models: ["101R2-5"],
    category: "rings",
    material: "925 Sterling Silver",
    gem: "Moissanite",
    sizeInfo: "S 17.5 / L 19.5",
    weight: 6,
    price: 260,
    featured: true,
    name: { ka: "ბეჭედი Cliff", en: "Cliff Ring", ru: "Кольцо Cliff" },
    desc: {
      ka: "მკვეთრი, კლდისებრი ფორმა მოისანიტის ბრწყინვალებით. 925 სპილენძვერცხლი.",
      en: "A sharp, cliff-cut form crowned with brilliant moissanite. 925 sterling silver.",
      ru: "Резкая, «скальная» форма с сиянием муассанита. Серебро 925 пробы.",
    },
  },
  {
    slug: "gates-ring",
    models: ["101R3-6"],
    category: "rings",
    material: "925 Sterling Silver",
    sizeInfo: "Adjustable",
    weight: 10,
    price: 400,
    name: { ka: "ბეჭედი Gates", en: "Gates Ring", ru: "Кольцо Gates" },
    desc: {
      ka: "მასიური, არქიტექტურული განცხადება. რეგულირებადი ზომა, 925 სპილენძვერცხლი.",
      en: "A bold, architectural statement piece. Adjustable size in 925 sterling silver.",
      ru: "Массивное архитектурное украшение. Регулируемый размер, серебро 925 пробы.",
    },
  },
  {
    slug: "hoop-earrings",
    models: ["101E1-1"],
    category: "earrings",
    material: "925 Sterling Silver",
    weight: 17,
    price: 650,
    featured: true,
    name: { ka: "საყურეები Hoops", en: "Hoop Earrings", ru: "Серьги Hoops" },
    desc: {
      ka: "კლასიკური რგოლები, გამართული პროპორციებით. 925 სპილენძვერცხლი.",
      en: "Classic hoops with clean, confident proportions. 925 sterling silver.",
      ru: "Классические серьги-кольца с выверенными пропорциями. Серебро 925 пробы.",
    },
  },
  {
    slug: "rift-hoop-earrings",
    models: ["101E1-2"],
    category: "earrings",
    material: "925 Sterling Silver",
    gem: "Moissanite",
    weight: 17,
    price: 650,
    name: { ka: "საყურეები Rift Hoops", en: "Rift Hoop Earrings", ru: "Серьги Rift Hoops" },
    desc: {
      ka: "რგოლები მოისანიტის ხაზით — ნათება მოძრაობაში. 925 სპილენძვერცხლი.",
      en: "Hoops split by a line of moissanite — light that moves with you. 925 sterling silver.",
      ru: "Кольца с линией муассанита — сияние в движении. Серебро 925 пробы.",
    },
  },
  {
    slug: "meteor-earrings",
    models: ["101E2-3"],
    category: "earrings",
    material: "925 Sterling Silver",
    gem: "Moissanite",
    weight: 18,
    price: 680,
    featured: true,
    name: { ka: "საყურეები Meteor", en: "Meteor Earrings", ru: "Серьги Meteor" },
    desc: {
      ka: "დინამიური ფორმა მოისანიტით — ცის ნამსხვრევი. 925 სპილენძვერცხლი.",
      en: "A dynamic form set with moissanite — a fragment of the sky. 925 sterling silver.",
      ru: "Динамичная форма с муассанитом — осколок неба. Серебро 925 пробы.",
    },
  },
  {
    slug: "stud-earrings",
    models: ["101E3-4"],
    category: "earrings",
    material: "925 Sterling Silver",
    weight: 6,
    price: 260,
    name: { ka: "საყურეები Studs", en: "Stud Earrings", ru: "Серьги-гвоздики Studs" },
    desc: {
      ka: "მინიმალისტური ჩასაცმელი საყურეები ყოველდღისთვის. 925 სპილენძვერცხლი.",
      en: "Minimalist studs for every day. 925 sterling silver.",
      ru: "Минималистичные серьги-гвоздики на каждый день. Серебро 925 пробы.",
    },
  },
  {
    slug: "rock-earrings",
    models: ["101E3-5"],
    category: "earrings",
    material: "925 Sterling Silver",
    weight: 6,
    price: 290,
    name: { ka: "საყურეები Rock", en: "Rock Earrings", ru: "Серьги Rock" },
    desc: {
      ka: "ტექსტურირებული, ქვისებრი ზედაპირი. 925 სპილენძვერცხლი.",
      en: "A textured, stone-like surface with quiet character. 925 sterling silver.",
      ru: "Текстурная, «каменная» поверхность с характером. Серебро 925 пробы.",
    },
  },
  {
    slug: "big-cross",
    models: ["101C1-1"],
    category: "crosses",
    material: "925 Sterling Silver",
    gem: "Moissanite",
    weight: 13,
    price: 600,
    featured: true,
    name: { ka: "დიდი ჯვარი", en: "Big Cross", ru: "Большой крест" },
    desc: {
      ka: "გამომხატველი, დიდი ჯვარი მოისანიტით. 925 სპილენძვერცხლი.",
      en: "An expressive, oversized cross set with moissanite. 925 sterling silver.",
      ru: "Выразительный крупный крест с муассанитом. Серебро 925 пробы.",
    },
  },
  {
    slug: "cross",
    models: ["101C1-2"],
    category: "crosses",
    material: "925 Sterling Silver",
    gem: "Moissanite",
    weight: 7,
    price: 350,
    name: { ka: "ჯვარი", en: "Cross", ru: "Крест" },
    desc: {
      ka: "დახვეწილი ჯვარი ყოველდღიური ტარებისთვის, მოისანიტით. 925 სპილენძვერცხლი.",
      en: "A refined cross for everyday wear, set with moissanite. 925 sterling silver.",
      ru: "Изящный крест на каждый день, с муассанитом. Серебро 925 пробы.",
    },
  },
];
