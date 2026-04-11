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
]

export const ACCOMPANIMENTS = [
  'Piano','Organ','Piano or Organ',
  'A cappella','Orchestra','Guitar','Other',
]

export const VOICING_GROUPS = [
  { label: 'SATB & Mixed',      values: ['SATB','SSATB','SSATTBB','SSAATTBB'] },
  { label: 'Treble (SSA/SSAA)', values: ['SSA','SSAA'] },
  { label: 'SAB / SAT',         values: ['SAB','SAT'] },
  { label: "Men's Voices",      values: ['TTBB','TBB','TB'] },
  { label: '2-Part',            values: ['2-Part'] },
  { label: 'Unison',            values: ['Unison'] },
  { label: 'Other',             values: ['Other'] },
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
