# Football Lab V43.1 character assets

V43.1 is the production 2.5D character route for Football Lab.

## Approved master identities

- Viktor Kane — master outfield character
- Mikkel Storm — master goalkeeper character

The artwork is derived as closely as practical from the approved Football Lab reference sheets. The live renderer uses isolated transparent sprite frames rather than the full concept posters.

## Atlas

The eight `masters-v43.part*.b64` files concatenate to one 1024×448 transparent WebP atlas. The packed atlas contains five high-resolution frames:

- `viktor-idle-back`
- `viktor-windup-side`
- `viktor-contact`
- `mikkel-set`
- `mikkel-dive`

The image data is deliberately higher resolution than the rendered gameplay height so Canvas always downsamples rather than enlarging the master artwork.

## Rendering rules

- Viktor uses the V43.1 asset-backed renderer when `dax-ryder` is selected.
- Mikkel replaces the `giant` and `aggressive` goalkeeper visual archetypes without changing keeper AI.
- Bruno Silva, David Beckett, Wayne Redman, Rafael Dantas, Diego Varela and Simon Henshaw remain on the established fallback until their approved-reference sprite packs are produced.
- Ball physics, scoring, shot outcomes, keeper AI and campaign difficulty are outside this visual layer and must not be modified by character-art work.

## Quality gate

`npm run verify:character:sprites:v43` verifies the packed sprite payload byte-for-byte. Browser regression tests additionally verify the 1024×448 atlas, Viktor rendering, Mikkel rendering and fallback behaviour.
