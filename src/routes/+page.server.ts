import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // const isAuthed = Boolean(locals.user); // later, when you wire auth
  const isAuthed = false;

  // TODO: fetch real markets
  const markets = [
    {
      id: "m1",
      title: "Fed decision in September?",
      volume: "$63m Vol.",
      outcomes: [
        { label: "Yes", pct: 6 },
        { label: "No", pct: 94 },
      ],
      img: "",
    },
    {
      id: "m2",
      title: "New York City Mayoral Election",
      volume: "$60m Vol.",
      outcomes: [
        { label: "Yes", pct: 80 },
        { label: "No", pct: 20 },
      ],
      img: "",
    },
  ];

  return { isAuthed, markets };
};
