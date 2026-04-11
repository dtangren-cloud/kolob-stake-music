export const VOICINGS = [
  'SATB','SSATB','SSATTBB','SSAATTBB',
  'SSA','SSAA','SAB','SAT',
  'TTBB','TBB','TB',
  '2-Part','Unison','Other',
]

export const CATEGORIES = [
  "Hymns & Children's Song Arrangements",
  'Easter',
  'Christmas',
  'Thanksgiving',
  'Other Sacred Music',
  'Books & Collections',
]

// Aliases: map alternate spellings from CSV to canonical category names
export const CATEGORY_ALIASES = {
  "hymns & children's songs":                    "Hymns & Children's Song Arrangements",
  "hymns & children's song arrangements":        "Hymns & Children's Song Arrangements",
  "hymns and children's songs":                  "Hymns & Children's Song Arrangements",
  "hymns and children's song arrangements":      "Hymns & Children's Song Arrangements",
  "hymns & childrens songs":                     "Hymns & Children's Song Arrangements",
  "books & collections":                         "Books & Collections",
  "books and collections":                       "Books & Collections",
}

export const ACCOMPANIMENTS = [
  'Piano','Organ','Piano or Organ',
  'A cappella','Orchestra','Guitar','Other',
]

// Voicing groups use pattern matching — each group has a test function
export const VOICING_GROUPS = [
  {
    label: 'SATB & Mixed',
    description: 'SATB, SSATB, SSATTBB, SSAATTBB and variations',
    test: v => v.toUpperCase().includes('SATB') || v.toUpperCase().includes('SSATT') || v.toUpperCase().includes('SSAATT'),
  },
  {
    label: 'Treble Voices (SSA)',
    description: 'SSA, SSAA, SAA and variations',
    test: v => v.toUpperCase().startsWith('SSA') || v === 'SAA',
  },
  {
    label: 'SA & Flexible',
    description: 'SA, SAB, and flexible voicings',
    test: v => v.toUpperCase() === 'SA' || v.toUpperCase().startsWith('SAB') || v.toUpperCase().includes('SA,') || (v.toUpperCase().includes('SA') && v.includes('/')),
  },
  {
    label: "Men's Voices",
    description: 'TTBB, TBB, TB and variations',
    test: v => v.toUpperCase().includes('TTBB') || v.toUpperCase().startsWith('TBB') || v.toUpperCase() === 'TB',
  },
  {
    label: '2-Part',
    description: '2-Part, 2 part and variations',
    test: v => v.toLowerCase().replace('-', ' ').includes('2 part') || v.toLowerCase().includes('2part'),
  },
  {
    label: 'Unison',
    description: 'Unison',
    test: v => v.toLowerCase().includes('unison'),
  },
  {
    label: 'Other',
    description: 'All other voicings',
    test: () => false, // catch-all, handled separately in Browse
  },
]

export const VOICING_COLORS = {
  'SATB':     { bg:'#DBEAFE', color:'#1E40AF' },
  'SSATB':    { bg:'#DBEAFE', color:'#1E40AF' },
  'SSATTBB':  { bg:'#DBEAFE', color:'#1E40AF' },
  'SSAATTBB': { bg:'#DBEAFE', color:'#1E40AF' },
  'SSA':      { bg:'#EDE9FE', color:'#5B21B6' },
  'SSAA':     { bg:'#EDE9FE', color:'#5B21B6' },
  'SAB':      { bg:'#D1FAE5', color:'#065F46' },
  'SAT':      { bg:'#D1FAE5', color:'#065F46' },
  'TTBB':     { bg:'#FEF3C7', color:'#92400E' },
  'TBB':      { bg:'#FEF3C7', color:'#92400E' },
  'TB':       { bg:'#FEF3C7', color:'#92400E' },
  '2-Part':   { bg:'#FCE7F3', color:'#9D174D' },
  'Unison':   { bg:'#ECFDF5', color:'#065F46' },
  'Other':    { bg:'#F3F4F6', color:'#374151' },
}
