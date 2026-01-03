/**
 * Football Lab - Set Pieces Lab
 * Level data is kept separate so you can expand without rewriting the engine.
 */
window.SET_PIECES_LEVELS = [
  // Level 1: easy, no wind
  {
    id: 1,
    name: "Starter",
    shots: 5,
    wind: 0.0,           // horizontal drift applied to the ball
    target: { x: 0.78, y: 0.36, r: 0.075 }, // relative to goal area
  },
  // Level 2: slightly harder, light wind and smaller target
  {
    id: 2,
    name: "Pressure",
    shots: 4,
    wind: 0.18,
    target: { x: 0.72, y: 0.30, r: 0.060 },
  },
];
