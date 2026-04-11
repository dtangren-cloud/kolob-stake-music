import { useState } from 'react'
import { VOICING_COLORS } from '../lib/constants.js'

function VoicingBadge({ v }) {
  // Try exact match first, then partial match for variants like 'SATB + Solo'
  const s = VOICING_COLORS[v] || 
    Object.entries(VOICING_COLORS).find(([k]) => v && v.toUpperCase().startsWith(k))?.[1] ||
    { bg:'#F3F4F6', color:'#374151' }
  return <span className="tag" style={{ background:s.bg, color:s.color }}>{v || '—'}</span>
}

function AvailDot({ avail, total }) {
  if (total === null || total === undefined) {
    return <span style={{ color:'var(--ink-lt)', fontSize:13 }}>—</span>
  }
  const color = avail === 0 ? 'var(--red)' : avail <= Math.ceil(total * 0.25) ? 'var(--amber)' : 'var(--teal)'
  return (
    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
      <span style={{ color:'var(--ink-md)' }}>{avail} / {total}</span>
    </span>
  )
}

const COLS = [
  { key:'title',            label:'Title',         w:'22%' },
  { key:'composer',         label:'Composer',      w:'13%' },
  { key:'arranger',         label:'Composer or Arranger', w:'13%' },
  { key:'voicing',          label:'Voicing',       w:'9%'  },
  { key:'accompaniment',    label:'Accompaniment', w:'12%' },
  { key:'category',         label:'Category',      w:'13%' },
  { key:'publication_year', label:'Year',          w:'6%'  },
  { key:'available_copies', label:'Available',     w:'9%'  },
]

export default function MusicTable({ pieces=[], actionLabel, onAction, isActionDisabled, emptyMessage }) {
  const [col, setCol] = useState('title')
  const [dir, setDir] = useState('asc')

  const sort = (k) => { setDir(d => col===k ? (d==='asc'?'desc':'asc') : 'asc'); setCol(k) }

  const rows = [...pieces].sort((a,b) => {
    let va = a[col] ?? '', vb = b[col] ?? ''
    if (typeof va==='string') { va=va.toLowerCase(); vb=vb.toLowerCase() }
    return va < vb ? (dir==='asc'?-1:1) : va > vb ? (dir==='asc'?1:-1) : 0
  })

  if (!pieces.length) return (
    <div className="empty-state">
      <div className="empty-icon">♩</div>
      <div>{emptyMessage || 'No pieces found.'}</div>
    </div>
  )

  const TH = ({ k, label, w }) => (
    <th onClick={() => sort(k)} style={{
      width:w, padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:500,
      color:'var(--ink-md)', textTransform:'uppercase', letterSpacing:'.06em',
      borderBottom:'1px solid var(--bd)', background:'var(--cream)',
      cursor:'pointer', userSelect:'none', whiteSpace:'nowrap',
    }}>
      {label}
      <span style={{ marginLeft:4, color: col===k ? 'var(--gold)' : 'var(--ink-lt)' }}>
        {col===k ? (dir==='asc'?'↑':'↓') : '↕'}
      </span>
    </th>
  )

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>
            {COLS.map(c => <TH key={c.key} k={c.key} label={c.label} w={c.w} />)}
            {actionLabel && <th style={{ padding:'9px 12px', borderBottom:'1px solid var(--bd)', background:'var(--cream)', width:'8%' }} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const avail = p.available_copies ?? p.total_copies
            const disabled = isActionDisabled ? isActionDisabled(p) : avail <= 0
            return (
              <tr key={p.id}
                style={{ background: i%2===0 ? '#fff' : 'var(--cream)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--gold-bg)'}
                onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'var(--cream)'}
              >
                <td style={{ padding:'10px 12px', fontWeight:500 }}>{p.title}</td>
                <td style={{ padding:'10px 12px', color:'var(--ink-md)' }}>{p.composer||'—'}</td>
                <td style={{ padding:'10px 12px', color:'var(--ink-md)' }}>{p.arranger||'—'}</td>
                <td style={{ padding:'10px 12px' }}><VoicingBadge v={p.voicing} /></td>
                <td style={{ padding:'10px 12px', color:'var(--ink-md)' }}>{p.accompaniment||'—'}</td>
                <td style={{ padding:'10px 12px', color:'var(--ink-md)' }}>{p.category||'—'}</td>
                <td style={{ padding:'10px 12px', color:'var(--ink-lt)' }}>{p.publication_year||'—'}</td>
                <td style={{ padding:'10px 12px' }}><AvailDot avail={avail} total={p.total_copies} /></td>
                {actionLabel && (
                  <td style={{ padding:'10px 12px' }}>
                    <button
                      className={`btn btn-sm ${disabled ? 'btn-ghost' : 'btn-primary'}`}
                      disabled={disabled}
                      onClick={() => !disabled && onAction(p)}
                      style={{ opacity:disabled?.45:1, cursor:disabled?'not-allowed':'pointer' }}
                    >{disabled ? 'Out' : actionLabel}</button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
