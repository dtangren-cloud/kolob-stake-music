import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { CATEGORIES, VOICING_GROUPS, ACCOMPANIMENTS, VOICING_COLORS } from '../lib/constants.js'
import MusicTable from '../components/MusicTable.jsx'

const VIEWS = ['All Music', 'By Category', 'By Voicing']

export default function Browse() {
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('All Music')
  const [search, setSearch] = useState('')
  const [fVoicing, setFVoicing] = useState('')
  const [fCat, setFCat] = useState('')
  const [fAccomp, setFAccomp] = useState('')
  const [expandedGroup, setExpandedGroup] = useState(null)

  useEffect(() => { fetchMusic() }, [])

  async function fetchMusic() {
    setLoading(true)
    const { data } = await supabase.from('music_with_availability').select('*').order('title')
    setPieces(data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let r = pieces
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.composer?.toLowerCase().includes(q) ||
        p.arranger?.toLowerCase().includes(q) ||
        p.publisher?.toLowerCase().includes(q)
      )
    }
    if (fVoicing) r = r.filter(p => p.voicing === fVoicing)
    if (fCat)     r = r.filter(p => p.category === fCat)
    if (fAccomp)  r = r.filter(p => p.accompaniment === fAccomp)
    return r
  }, [pieces, search, fVoicing, fCat, fAccomp])

  const stats = useMemo(() => ({
    total: pieces.length,
    available: pieces.filter(p => (p.available_copies ?? p.total_copies) > 0).length,
    checkedOut: pieces.reduce((s,p) => s + (p.copies_out||0), 0),
  }), [pieces])

  const voicings = useMemo(() => [...new Set(pieces.map(p=>p.voicing).filter(Boolean))].sort(), [pieces])

  // -- RENDER HELPERS --

  const Stat = ({ label, value }) => (
    <div style={{ background:'#fff', border:'1px solid var(--bd)', borderRadius:'var(--r-lg)',
      padding:'1rem 1.25rem', boxShadow:'var(--shadow)' }}>
      <div style={{ fontSize:12, color:'var(--ink-md)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:28, fontFamily:'Lora,serif', color:'var(--gold)' }}>{value}</div>
    </div>
  )

  const Tab = ({ t }) => (
    <button onClick={() => setView(t)} style={{
      padding:'8px 16px', borderRadius:'var(--r)', border:'none', cursor:'pointer',
      fontSize:13, fontWeight: view===t ? 500 : 400,
      color: view===t ? 'var(--gold)' : 'var(--ink-md)',
      background: view===t ? 'var(--gold-bg)' : 'transparent',
      borderBottom: view===t ? '2px solid var(--gold)' : '2px solid transparent',
      transition:'all .12s',
    }}>{t}</button>
  )

  const CategoryCard = ({ cat }) => {
    const catPieces = filtered.filter(p => p.category === cat)
    const avail = catPieces.filter(p => (p.available_copies ?? p.total_copies) > 0).length
    const isOpen = expandedGroup === cat
    const icons = {
      "Hymns & Children's Song Arrangements":'♩',
      'Easter':'✝',
      'Christmas':'❄',
      'Thanksgiving':'✦',
      'Other Sacred Music':'♪',
      'Books & Collections':'📚',
    }
    return (
      <div className="card" style={{ overflow:'hidden' }}>
        <div
          onClick={() => setExpandedGroup(isOpen ? null : cat)}
          style={{ padding:'1.25rem', cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'space-between', userSelect:'none' }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:'var(--r)',
              background:'var(--gold-bg)', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:18, color:'var(--gold)' }}>
              {icons[cat] || '♪'}
            </div>
            <div>
              <div style={{ fontFamily:'Lora,serif', fontSize:16 }}>{cat}</div>
              <div style={{ fontSize:12, color:'var(--ink-md)', marginTop:2 }}>
                {catPieces.length} pieces · {avail} available
              </div>
            </div>
          </div>
          <span style={{ color:'var(--ink-lt)', fontSize:18 }}>{isOpen ? '▲' : '▼'}</span>
        </div>
        {isOpen && (
          <div style={{ borderTop:'1px solid var(--bd)' }}>
            <MusicTable pieces={catPieces} emptyMessage="No pieces in this category." />
          </div>
        )}
      </div>
    )
  }

  const VOICING_LABEL_ABBR = {
    'SATB & Mixed': 'SATB',
    'Treble Voices (SSA)': 'SSA',
    'SA & Flexible': 'SA',
    "Men's Voices": 'TTBB',
    '2-Part': '2pt',
    'Unison': 'Uni',
    'Other': '?',
  }

  const VOICING_LABEL_COLOR = {
    'SATB & Mixed':       { bg:'#DBEAFE', color:'#1E40AF' },
    'Treble Voices (SSA)':{ bg:'#EDE9FE', color:'#5B21B6' },
    'SA & Flexible':      { bg:'#D1FAE5', color:'#065F46' },
    "Men's Voices":       { bg:'#FEF3C7', color:'#92400E' },
    '2-Part':             { bg:'#FCE7F3', color:'#9D174D' },
    'Unison':             { bg:'#ECFDF5', color:'#065F46' },
    'Other':              { bg:'#F3F4F6', color:'#374151' },
  }

  const VoicingCard = ({ group }) => {
    const grpPieces = group.label === 'Other'
      ? filtered.filter(p => p.voicing && !VOICING_GROUPS.slice(0,-1).some(g => g.test(p.voicing)))
      : filtered.filter(p => p.voicing && group.test(p.voicing))
    const avail = grpPieces.filter(p => (p.available_copies ?? p.total_copies) > 0).length
    const isOpen = expandedGroup === group.label
    const sampleColor = VOICING_LABEL_COLOR[group.label] || { bg:'#EDE9FE', color:'#5B21B6' }
    const abbr = VOICING_LABEL_ABBR[group.label] || '?'
    return (
      <div className="card" style={{ overflow:'hidden' }}>
        <div
          onClick={() => setExpandedGroup(isOpen ? null : group.label)}
          style={{ padding:'1.25rem', cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'space-between', userSelect:'none' }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:'var(--r)',
              background:sampleColor.bg, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:12, fontWeight:600, color:sampleColor.color }}>
              {abbr}
            </div>
            <div>
              <div style={{ fontFamily:'Lora,serif', fontSize:16 }}>{group.label}</div>
              <div style={{ fontSize:12, color:'var(--ink-md)', marginTop:2 }}>
                {group.description} · {grpPieces.length} pieces · {avail} available
              </div>
            </div>
          </div>
          <span style={{ color:'var(--ink-lt)', fontSize:18 }}>{isOpen ? '▲' : '▼'}</span>
        </div>
        {isOpen && (
          <div style={{ borderTop:'1px solid var(--bd)' }}>
            <MusicTable pieces={grpPieces} emptyMessage="No pieces for this voicing." />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      {/* Page header */}
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontSize:34, marginBottom:6 }}>Music Library</h1>
        <p style={{ color:'var(--ink-md)', fontSize:15 }}>
          Browse the stake choral music collection. Visit the library in person to check out music.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:'2rem' }}>
        <Stat label="Total pieces" value={loading ? '…' : stats.total} />
        <Stat label="Available now" value={loading ? '…' : stats.available} />
        <Stat label="Copies checked out" value={loading ? '…' : stats.checkedOut} />
      </div>

      {/* View tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--bd)', marginBottom:'1.5rem' }}>
        {VIEWS.map(t => <Tab key={t} t={t} />)}
      </div>

      {/* Filters (shown in All Music view) */}
      {view === 'All Music' && (
        <div style={{ display:'flex', gap:10, marginBottom:'1rem', flexWrap:'wrap' }}>
          <input
            className="input" placeholder="Search title, composer, arranger…"
            style={{ flex:1, minWidth:200, maxWidth:340 }}
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="select" value={fVoicing} onChange={e=>setFVoicing(e.target.value)}>
            <option value="">All voicings</option>
            {voicings.map(v => <option key={v}>{v}</option>)}
          </select>
          <select className="select" value={fCat} onChange={e=>setFCat(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select" value={fAccomp} onChange={e=>setFAccomp(e.target.value)}>
            <option value="">All accompaniments</option>
            {ACCOMPANIMENTS.map(a => <option key={a}>{a}</option>)}
          </select>
          {(search||fVoicing||fCat||fAccomp) && (
            <button className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setFVoicing(''); setFCat(''); setFAccomp('') }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding:'3rem', textAlign:'center', color:'var(--ink-lt)' }}>Loading library…</div>
      ) : (
        <>
          {view === 'All Music' && (
            <div className="card" style={{ overflow:'hidden' }}>
              <MusicTable
                pieces={filtered}
                emptyMessage={search||fVoicing||fCat||fAccomp
                  ? 'No pieces match your filters.'
                  : 'No music has been added yet. Ask your administrator to import the library.'}
              />
            </div>
          )}

          {view === 'By Category' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {CATEGORIES.map(cat => <CategoryCard key={cat} cat={cat} />)}
            </div>
          )}

          {view === 'By Voicing' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {VOICING_GROUPS.map(g => <VoicingCard key={g.label} group={g} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}