/**
 * Optional editorial metadata. Keep this independent of jewelry categories.
 * Add a sculpture, limited edition or digital object without changing layouts.
 * Commercial names, materials and prices still come from the product database.
 */
export type ObjectPresentation = {
  title?: string;
  type?: string;
  year?: number;
  collection?: string;
  edition?: string;
  dimensions?: string;
  video?: { src: string; poster: string };
};

export const objectPresentation: Record<string, ObjectPresentation> = {
  "wave-ring": { title: "Wave", year: 2026, collection: "101" },
  "cliff-ring": { title: "Cliff", year: 2026, collection: "101" },
  "gates-ring": { title: "Gates", year: 2026, collection: "101" },
  "hoop-earrings": { title: "Hoops", year: 2026, collection: "101" },
  "rift-hoop-earrings": { title: "Rift", year: 2026, collection: "101" },
  "meteor-earrings": { title: "Meteor", year: 2026, collection: "101" },
  "stud-earrings": { title: "Studs", year: 2026, collection: "101" },
  "rock-earrings": { title: "Rock", year: 2026, collection: "101" },
  "big-cross": { year: 2026, collection: "101" },
  cross: { year: 2026, collection: "101" },
};
