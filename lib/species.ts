export const ayurvedicSpecies = [
  { value: "withania-somnifera", label: "Withania somnifera (Ashwagandha)" },
  { value: "bacopa-monnieri", label: "Bacopa monnieri (Brahmi)" },
  { value: "centella-asiatica", label: "Centella asiatica (Gotu Kola)" },
  { value: "curcuma-longa", label: "Curcuma longa (Turmeric)" },
  { value: "ocimum-tenuiflorum", label: "Ocimum tenuiflorum (Holy Basil)" },
  { value: "azadirachta-indica", label: "Azadirachta indica (Neem)" },
  { value: "terminalia-chebula", label: "Terminalia chebula (Haritaki)" },
  { value: "emblica-officinalis", label: "Emblica officinalis (Amla)" },
  { value: "terminalia-bellirica", label: "Terminalia bellirica (Bibhitaki)" },
  { value: "asparagus-racemosus", label: "Asparagus racemosus (Shatavari)" },
  { value: "tinospora-cordifolia", label: "Tinospora cordifolia (Guduchi)" },
  { value: "gymnema-sylvestre", label: "Gymnema sylvestre (Gurmar)" },
  { value: "other", label: "Other (specify in notes)" },
]

export function getSpeciesLabel(value: string): string {
  const species = ayurvedicSpecies.find((s) => s.value === value)
  return species ? species.label : value
}
