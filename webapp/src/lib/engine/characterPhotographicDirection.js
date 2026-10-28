// Reviewed public projection only; stored profile sources remain verbatim.
const REVIEWED_DIRECTIONS = [
  {
    "id": "character-sakura",
    "source": "photorealistic editorial portrait, gentle cozy indoor lifestyle photographic realism, coherent facial identity, realistic plush fleece and knit texture",
    "publicText": "photorealistic editorial portrait, gentle cozy lifestyle photographic realism, coherent facial identity, realistic plush fleece and knit texture"
  },
  {
    "id": "character-hinata",
    "source": "photorealistic editorial portrait, polished urban street-fashion photographic realism, coherent facial identity, realistic knit and denim construction",
    "publicText": "photorealistic editorial portrait, polished street-fashion photographic realism, coherent facial identity, realistic knit and denim construction"
  },
  {
    "id": "character-rika",
    "source": "photorealistic editorial portrait, intimate warm indoor film-snapshot photographic realism, coherent facial identity, realistic cotton and denim construction",
    "publicText": "photorealistic editorial portrait, intimate warm film-snapshot photographic realism, coherent facial identity, realistic cotton and denim construction"
  },
  {
    "id": "character-lily",
    "source": "photorealistic editorial portrait, glamorous sunlit fashion portrait photographic realism, coherent facial identity, realistic faux-fur texture",
    "publicText": "photorealistic editorial portrait, glamorous fashion portrait photographic realism, coherent facial identity, realistic faux-fur texture"
  },
  {
    "id": "character-olivia",
    "source": "photorealistic editorial portrait, assertive Tokyo street-fashion photographic realism, coherent facial identity, realistic patent, rib-knit and heavyweight varsity fabric construction",
    "publicText": "photorealistic editorial portrait, assertive street-fashion photographic realism, coherent facial identity, realistic patent, rib-knit and heavyweight varsity fabric construction"
  },
  {
    "id": "character-mei",
    "source": "photorealistic editorial portrait, nocturnal alternative-couture photographic realism, coherent facial identity, controlled dark-to-beige ombre transition, realistic lace, beadwork and layered fabric construction",
    "publicText": "photorealistic editorial portrait, alternative-couture photographic realism, coherent facial identity, controlled dark-to-beige ombre transition, realistic lace, beadwork and layered fabric construction"
  },
  {
    "id": "character-rei",
    "source": "photorealistic editorial portrait, bright candid convenience-store photographic realism, coherent facial identity, realistic knit, jersey and worn denim construction",
    "publicText": "photorealistic editorial portrait, bright candid photographic realism, coherent facial identity, realistic knit, jersey and worn denim construction"
  },
  {
    "id": "character-amy",
    "source": "photorealistic editorial portrait, cool urban street-style photographic realism, coherent facial identity, realistic knit, hosiery and polished leather construction",
    "publicText": "photorealistic editorial portrait, cool street-style photographic realism, coherent facial identity, realistic knit, hosiery and polished leather construction"
  },
  {
    "id": "character-yui",
    "source": "photorealistic editorial portrait, clean minimal studio photographic realism, coherent facial identity, natural skin texture and soft fabric construction",
    "publicText": "photorealistic editorial portrait, clean minimal photographic realism, coherent facial identity, natural skin texture and soft fabric construction"
  },
  {
    "id": "character-nana",
    "source": "photorealistic editorial portrait, bright school-corridor photographic realism, coherent facial identity, realistic cotton shirting, pleated fabric and leather construction",
    "publicText": "photorealistic editorial portrait, bright photographic realism, coherent facial identity, realistic cotton shirting, pleated fabric and leather construction"
  },
  {
    "id": "character-emily",
    "source": "photorealistic editorial portrait, gritty flash street-style photographic realism, coherent facial identity, realistic mesh jersey and worn denim construction",
    "publicText": "photorealistic editorial portrait, gritty street-style photographic realism, coherent facial identity, realistic mesh jersey and worn denim construction"
  },
  {
    "id": "character-shiori",
    "source": "photorealistic editorial portrait, neon city street-fashion photographic realism, coherent facial identity, realistic rib knit and washed denim construction",
    "publicText": "photorealistic editorial portrait, street-fashion photographic realism, coherent facial identity, realistic rib knit and washed denim construction"
  },
  {
    "id": "character-natsuki",
    "source": "photorealistic editorial portrait, clean locker-room sports editorial photographic realism, coherent facial identity, realistic technical jersey and athletic trim construction",
    "publicText": "photorealistic editorial portrait, clean sports editorial photographic realism, coherent facial identity, realistic technical jersey and athletic trim construction"
  },
  {
    "id": "character-minji",
    "source": "photorealistic editorial portrait, soft night-street photographic realism, coherent facial identity, realistic washed jersey and distressed denim construction",
    "publicText": "photorealistic editorial portrait, soft photographic realism, coherent facial identity, realistic washed jersey and distressed denim construction"
  },
  {
    "id": "character-manami",
    "source": "photorealistic editorial portrait, library-couture photographic realism, coherent facial identity, realistic floral lace, faux fur and polished leather construction",
    "publicText": "photorealistic editorial portrait, couture photographic realism, coherent facial identity, realistic floral lace, faux fur and polished leather construction"
  },
  {
    "id": "character-grace",
    "source": "photorealistic editorial portrait, warm direct-flash indoor photographic realism, coherent facial identity, realistic ribbed cotton and washed denim construction",
    "publicText": "photorealistic editorial portrait, warm photographic realism, coherent facial identity, realistic ribbed cotton and washed denim construction"
  },
  {
    "id": "character-kaori",
    "source": "photorealistic editorial portrait, gritty recording-studio rock editorial photographic realism, coherent facial identity, realistic leather, metal hardware and cotton construction",
    "publicText": "photorealistic editorial portrait, gritty rock editorial photographic realism, coherent facial identity, realistic leather, metal hardware and cotton construction"
  },
  {
    "id": "character-soyeon",
    "source": "photorealistic editorial portrait, vivid lantern-lit fashion photographic realism, coherent facial identity, realistic satin, embroidery and polished leather construction",
    "publicText": "photorealistic editorial portrait, vivid fashion photographic realism, coherent facial identity, realistic satin, embroidery and polished leather construction"
  },
  {
    "id": "character-bora",
    "source": "photorealistic editorial portrait, warm nightclub editorial photographic realism, coherent facial identity, realistic sheer lace, tailored wool and polished leather construction",
    "publicText": "photorealistic editorial portrait, warm editorial photographic realism, coherent facial identity, realistic sheer lace, tailored wool and polished leather construction"
  },
  {
    "id": "character-seulgi",
    "source": "photorealistic editorial portrait, neon nightclub editorial photographic realism, coherent facial identity, realistic sheer lace, tailored wool and polished leather construction",
    "publicText": "photorealistic editorial portrait, editorial photographic realism, coherent facial identity, realistic sheer lace, tailored wool and polished leather construction"
  },
  {
    "id": "character-miku",
    "source": "photorealistic editorial portrait, bright commuter-train photographic realism, coherent facial identity, realistic knitwear, cotton shirting, pleated fabric and leather construction",
    "publicText": "photorealistic editorial portrait, bright photographic realism, coherent facial identity, realistic knitwear, cotton shirting, pleated fabric and leather construction"
  }
];

export function projectCharacterPhotographicDirection(id, text) {
  const reviewed = REVIEWED_DIRECTIONS.find(row => row.id === id && row.source === text);
  return reviewed ? reviewed.publicText : text;
}
