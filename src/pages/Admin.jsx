import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase.js'
import { VOICINGS, CATEGORIES, ACCOMPANIMENTS, CATEGORY_ALIASES } from '../lib/constants.js'
import MusicTable from '../components/MusicTable.jsx'
import MusicForm from '../components/MusicForm.jsx'

const ADMIN_TABS = ['Library', 'Add piece', 'Import CSV', 'Active checkouts']

export default function Admin() {
  const [tab, setTab] = useState('Library')
  const [pieces, setPieces] = useState([])
  const [checkouts, setCheckouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editPiece, setEditPiece] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [csvRows, setCsvRows] = useState([])
  const [csvError, setCsvError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: music }, { data: cos }, { data: activecos }] = await Promise.all([
      supabase.from('music').select('*').order('title'),
      supabase.from('checkouts').select('*, music(title)').is('returned_at', null).order('checked_out_at', { ascending: false }),
      supabase.from('checkouts').select('music_id, copies_taken').is('returned_at', null),
    ])
    // Manually compute available_copies so admin table still shows it
    const cosMap = {}
    for (const c of (activecos || [])) {
      cosMap[c.music_id] = (cosMap[c.music_id] || 0) + c.copies_taken
    }
    const musicWithAvail = (music || []).map(m => ({
      ...m,
      copies_out: cosMap[m.id] || 0,
      available_copies: m.total_copies != null ? m.total_copies - (cosMap[m.id] || 0) : null,
    }))
    setPieces(musicWithAvail)
    setCheckouts(cos || [])
    setLoading(false)
  }

  async function handleSaveNew(data) {
    setSaving(true)
    const saveData = {
      title:            data.title,
      composer:         data.composer,
      arranger:         data.arranger,
      voicing:          data.voicing,
      accompaniment:    data.accompaniment,
      category:         data.category,
      publisher:        data.publisher,
      publication_year: data.publication_year,
      total_copies:     data.total_copies,
      topic:            data.topic,
      notes:            data.notes,
    }
    const { error } = await supabase.from('music').insert(saveData)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    await fetchAll()
    setTab('Library')
  }

  async function handleSaveEdit(data) {
    setSaving(true)
    // Explicitly pick only real music table columns — never pass view-computed fields
    const saveData = {
      title:            data.title,
      composer:         data.composer,
      arranger:         data.arranger,
      voicing:          data.voicing,
      accompaniment:    data.accompaniment,
      category:         data.category,
      publisher:        data.publisher,
      publication_year: data.publication_year,
      total_copies:     data.total_copies,
      topic:            data.topic,
      notes:            data.notes,
    }
    const { error } = await supabase.from('music').update(saveData).eq('id', editPiece.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    await fetchAll()
    setEditPiece(null)
  }

  async function handleDelete(piece) {
    if (!confirm(`Delete "${piece.title}"? This cannot be undone.`)) return
    setDeleting(piece.id)
    const { error } = await supabase.from('music').delete().eq('id', piece.id)
    setDeleting(null)
    if (error) { alert('Error: ' + error.message); return }
    await fetchAll()
  }

  async function handleReturn(id) {
    await supabase.from('checkouts').update({ returned_at: new Date().toISOString() }).eq('id', id)
    await fetchAll()
  }

  // CSV import
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setCsvError('')
    setCsvRows([])
    setImportResult(null)
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) { setCsvError('No rows found in file.'); return }
        // Normalise column names to lowercase-underscored
        const rows = results.data.map(r => {
          const norm = {}
          for (const [k, v] of Object.entries(r)) {
            const key = k.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
            norm[key] = typeof v === 'string' ? v.trim() : v
          }
          return norm
        })
        setCsvRows(rows)
      },
      error: (err) => setCsvError(err.message),
    })
  }

  function mapRow(r) {
    // "Composer/Arranger" normalises to "composerarranger" after stripping non-alphanumeric chars
    const combined = r.composerarranger || r.composer_arranger || ''
    const composer = r.composer || ''
    const arranger = r.arranger || combined

    return {
      title:            r.title || r.piece_title || r.name || '',
      composer:         composer,
      arranger:         arranger,
      voicing:          r.voicing || r.voice_type || r.voice || '',
      accompaniment:    r.accompaniment || r.accomp || r.piano || '',
      category:         (()=>{ const raw = (r.category || r.topic || r.type || '').trim(); return CATEGORY_ALIASES[raw.toLowerCase()] || raw; })(),
      publisher:        r.publisher || r.pub || '',
      publication_year: r.publication_year || r.year || r.pub_year ? parseInt(r.publication_year || r.year || r.pub_year) || null : null,
      total_copies:     r.total_copies || r.copies || r.quantity ? parseInt(r.total_copies || r.copies || r.quantity) || 0 : 0,
      notes:            r.notes || r.topic || '',
    }
  }

  async function handleImport() {
    if (!csvRows.length) return
    setImporting(true)
    const mapped = csvRows.map(mapRow).filter(r => r.title)
    const { data, error } = await supabase.from('music').insert(mapped).select()
    setImporting(false)
    if (error) { setCsvError('Import error: ' + error.message); return }
    setImportResult({ count: data.length })
    setCsvRows([])
    if (fileRef.current) fileRef.current.value = ''
    await fetchAll()
  }

  const filtered = pieces.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.title?.toLowerCase().includes(q) ||
      p.composer?.toLowerCase().includes(q) ||
      p.arranger?.toLowerCase().includes(q)
  })

  const Tab = ({ t }) => (
    <button onClick={() => { setTab(t); setEditPiece(null) }} style={{
      padding:'8px 16px', border:'none', cursor:'pointer', fontSize:13,
      fontWeight: tab===t ? 500 : 400,
      color: tab===t ? 'var(--gold)' : 'var(--ink-md)',
      background: tab===t ? 'var(--gold-bg)' : 'transparent',
      borderBottom: tab===t ? '2px solid var(--gold)' : '2px solid transparent',
      position:'relative',
    }}>
      {t}
      {t === 'Active checkouts' && checkouts.length > 0 && (
        <span style={{ marginLeft:6, background:'var(--red)', color:'#fff',
          borderRadius:20, fontSize:10, padding:'1px 6px', fontWeight:600 }}>
          {checkouts.length}
        </span>
      )}
    </button>
  )

  return (
    <div className="page">
      <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:32, marginBottom:4 }}>Library administration</h1>
          <p style={{ color:'var(--ink-md)' }}>{pieces.length} pieces · {checkouts.length} currently checked out</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--bd)', marginBottom:'1.5rem' }}>
        {ADMIN_TABS.map(t => <Tab key={t} t={t} />)}
      </div>

      {/* ── Library tab ── */}
      {tab === 'Library' && (
        <>
          {editPiece ? (
            <div className="card" style={{ padding:'1.5rem', maxWidth:780 }}>
              <h2 style={{ fontSize:22, marginBottom:'1.5rem' }}>Edit: {editPiece.title}</h2>
              <MusicForm
                initial={editPiece}
                onSave={handleSaveEdit}
                onCancel={() => setEditPiece(null)}
                saving={saving}
              />
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:10, marginBottom:'1rem' }}>
                <input className="input" placeholder="Search library…"
                  style={{ maxWidth:320 }} value={search} onChange={e=>setSearch(e.target.value)} />
                {search && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Clear</button>
                )}
              </div>
              {loading ? (
                <div style={{ padding:'2rem', color:'var(--ink-lt)' }}>Loading…</div>
              ) : (
                <div className="card" style={{ overflow:'hidden' }}>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead>
                        <tr>
                          {['Title','Composer','Arranger','Voicing','Category','Accompaniment','Year','Copies','Available',''].map(h => (
                            <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:500,
                              color:'var(--ink-md)', textTransform:'uppercase', letterSpacing:'.06em',
                              borderBottom:'1px solid var(--bd)', background:'var(--cream)', whiteSpace:'nowrap' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => (
                          <tr key={p.id}
                            style={{ background: i%2===0 ? '#fff' : 'var(--cream)' }}
                            onMouseEnter={e => e.currentTarget.style.background='var(--gold-bg)'}
                            onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'var(--cream)'}
                          >
                            <td style={{ padding:'9px 12px', fontWeight:500 }}>{p.title}</td>
                            <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{p.composer||'—'}</td>
                            <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{p.arranger||'—'}</td>
                            <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{p.voicing||'—'}</td>
                            <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{p.category||'—'}</td>
                            <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{p.accompaniment||'—'}</td>
                            <td style={{ padding:'9px 12px', color:'var(--ink-lt)' }}>{p.publication_year||'—'}</td>
                            <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{p.total_copies}</td>
                            <td style={{ padding:'9px 12px', color: (p.available_copies??p.total_copies)===0 ? 'var(--red)' : 'var(--teal)' }}>
                              {p.available_copies ?? p.total_copies}
                            </td>
                            <td style={{ padding:'9px 12px' }}>
                              <div style={{ display:'flex', gap:6 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditPiece(p)}>Edit</button>
                                <button className="btn btn-danger btn-sm"
                                  disabled={deleting === p.id}
                                  onClick={() => handleDelete(p)}>
                                  {deleting===p.id ? '…' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filtered.length === 0 && (
                          <tr><td colSpan={10} style={{ padding:'3rem', textAlign:'center', color:'var(--ink-lt)' }}>
                            {search ? 'No pieces match your search.' : 'No pieces yet. Use "Add piece" or "Import CSV".'}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Add piece tab ── */}
      {tab === 'Add piece' && (
        <div className="card" style={{ padding:'1.5rem', maxWidth:780 }}>
          <h2 style={{ fontSize:22, marginBottom:'1.5rem' }}>Add a new piece</h2>
          <MusicForm onSave={handleSaveNew} saving={saving} />
        </div>
      )}

      {/* ── Import CSV tab ── */}
      {tab === 'Import CSV' && (
        <div className="card" style={{ padding:'1.5rem', maxWidth:700 }}>
          <h2 style={{ fontSize:22, marginBottom:8 }}>Import from CSV</h2>
          <p style={{ color:'var(--ink-md)', marginBottom:'1.5rem', fontSize:14 }}>
            Export your Google Drive spreadsheet as CSV and upload it here.
            The importer recognizes these column names (case-insensitive):
          </p>

          <div style={{ background:'var(--cream)', borderRadius:'var(--r)', padding:'1rem',
            fontFamily:'monospace', fontSize:12, marginBottom:'1.5rem', lineHeight:2 }}>
            <strong>title</strong> (required) · composer · arranger · voicing · accompaniment ·
            category · publisher · publication_year (or <em>year</em>) ·
            total_copies (or <em>copies</em>) · notes
          </div>

          <div className="form-group">
            <label className="label">Choose CSV file</label>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
              style={{ display:'block', marginTop:4 }} />
          </div>

          {csvError && (
            <div style={{ background:'var(--red-lt)', border:'1px solid var(--red)', borderRadius:'var(--r)',
              padding:'0.75rem 1rem', color:'var(--red)', marginBottom:'1rem', fontSize:13 }}>
              {csvError}
            </div>
          )}

          {csvRows.length > 0 && (
            <>
              <div style={{ marginBottom:'1rem', fontSize:14 }}>
                <strong>{csvRows.length} rows</strong> found. Preview (first 5):
              </div>
              <div style={{ overflowX:'auto', marginBottom:'1.5rem' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr>{Object.keys(csvRows[0]).slice(0,7).map(k => (
                      <th key={k} style={{ padding:'6px 10px', background:'var(--cream)',
                        borderBottom:'1px solid var(--bd)', textAlign:'left',
                        fontSize:10, textTransform:'uppercase', letterSpacing:'.05em' }}>{k}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {csvRows.slice(0,5).map((r,i) => (
                      <tr key={i} style={{ background: i%2===0?'#fff':'var(--cream)' }}>
                        {Object.values(r).slice(0,7).map((v,j) => (
                          <td key={j} style={{ padding:'6px 10px', borderBottom:'1px solid var(--bd)' }}>
                            {String(v).slice(0,40)}{String(v).length>40?'…':''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary" disabled={importing} onClick={handleImport}>
                {importing ? 'Importing…' : `Import ${csvRows.length} pieces`}
              </button>
            </>
          )}

          {importResult && (
            <div style={{ background:'var(--teal-lt)', border:'1px solid var(--teal)', borderRadius:'var(--r)',
              padding:'1rem', marginTop:'1rem', color:'var(--teal)', fontSize:14 }}>
              ✓ Successfully imported <strong>{importResult.count}</strong> pieces into the library.
            </div>
          )}
        </div>
      )}

      {/* ── Active checkouts tab ── */}
      {tab === 'Active checkouts' && (
        <div>
          {loading ? (
            <div style={{ padding:'2rem', color:'var(--ink-lt)' }}>Loading…</div>
          ) : checkouts.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✓</div><div>No music currently checked out.</div></div>
          ) : (
            <div className="card" style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['Piece','Choir / Ward','Director','Contact','Copies','Checked out','Due','Status',''].map(h => (
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:500,
                        color:'var(--ink-md)', textTransform:'uppercase', letterSpacing:'.06em',
                        borderBottom:'1px solid var(--bd)', background:'var(--cream)', whiteSpace:'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checkouts.map((co, i) => {
                    const overdue = co.expected_return && new Date(co.expected_return) < new Date()
                    return (
                      <tr key={co.id} style={{ background: i%2===0?'#fff':'var(--cream)' }}>
                        <td style={{ padding:'9px 12px', fontWeight:500 }}>{co.music?.title}</td>
                        <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{co.choir_ward}</td>
                        <td style={{ padding:'9px 12px', color:'var(--ink-md)' }}>{co.director_name}</td>
                        <td style={{ padding:'9px 12px', color:'var(--ink-md)', fontSize:12 }}>
                          {co.contact_email && <div>{co.contact_email}</div>}
                          {co.contact_phone && <div>{co.contact_phone}</div>}
                        </td>
                        <td style={{ padding:'9px 12px' }}>{co.copies_taken}</td>
                        <td style={{ padding:'9px 12px', color:'var(--ink-lt)', fontSize:12 }}>
                          {new Date(co.checked_out_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding:'9px 12px', fontSize:12, color: overdue ? 'var(--red)' : 'var(--ink-lt)' }}>
                          {co.expected_return
                            ? new Date(co.expected_return + 'T00:00:00').toLocaleDateString()
                            : '—'}
                        </td>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20,
                            background: overdue ? 'var(--red-lt)' : 'var(--teal-lt)',
                            color: overdue ? 'var(--red)' : 'var(--teal)' }}>
                            {overdue ? 'Overdue' : 'Out'}
                          </span>
                        </td>
                        <td style={{ padding:'9px 12px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleReturn(co.id)}>
                            Mark returned
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
