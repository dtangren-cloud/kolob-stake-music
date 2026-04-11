import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { VOICING_COLORS } from '../lib/constants.js'

const EMPTY_FORM = {
  choir_ward:'', director_name:'', contact_email:'', contact_phone:'',
  copies_taken:'', expected_return:'',
}

export default function Checkout() {
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [activeCheckouts, setActiveCheckouts] = useState([])
  const [tab, setTab] = useState('checkout') // 'checkout' | 'checkin'
  const [returningId, setReturningId] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: music }, { data: checkouts }] = await Promise.all([
      supabase.from('music_with_availability').select('*').order('title'),
      supabase.from('checkouts').select('*, music(title, voicing)').is('returned_at', null).order('checked_out_at', { ascending:false }),
    ])
    setPieces(music || [])
    setActiveCheckouts(checkouts || [])
    setLoading(false)
  }

  const results = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return pieces.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.composer?.toLowerCase().includes(q) ||
      p.voicing?.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [pieces, search])

  const avail = selected ? (selected.available_copies ?? selected.total_copies) : 0

  async function handleCheckout(e) {
    e.preventDefault()
    if (!selected) return
    const copies = parseInt(form.copies_taken)
    if (!copies || copies < 1) return alert('Enter a valid number of copies.')
    if (copies > avail) return alert(`Only ${avail} copies available.`)
    setSubmitting(true)
    const { error } = await supabase.from('checkouts').insert({
      music_id: selected.id,
      choir_ward: form.choir_ward,
      director_name: form.director_name,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      copies_taken: copies,
      expected_return: form.expected_return || null,
    })
    setSubmitting(false)
    if (error) { alert('Error saving checkout: ' + error.message); return }
    setSuccess({ title: selected.title, copies, choir: form.choir_ward })
    setSelected(null)
    setSearch('')
    setForm(EMPTY_FORM)
    fetchAll()
  }

  async function handleReturn(checkoutId) {
    setReturningId(checkoutId)
    const { error } = await supabase.from('checkouts')
      .update({ returned_at: new Date().toISOString() })
      .eq('id', checkoutId)
    setReturningId(null)
    if (error) { alert('Error: ' + error.message); return }
    fetchAll()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }))

  const VBadge = ({ v }) => {
    const s = VOICING_COLORS[v] || { bg:'#F3F4F6', color:'#374151' }
    return <span className="tag" style={{ background:s.bg, color:s.color }}>{v}</span>
  }

  if (success) return (
    <div className="page-sm" style={{ paddingTop:'4rem', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:'1rem' }}>✓</div>
      <h2 style={{ fontSize:28, marginBottom:8 }}>Checked out!</h2>
      <p style={{ color:'var(--ink-md)', marginBottom:'0.5rem' }}>
        <strong>{success.copies} {success.copies === 1 ? 'copy' : 'copies'}</strong> of <strong>{success.title}</strong>
      </p>
      <p style={{ color:'var(--ink-md)', marginBottom:'2rem' }}>checked out to <strong>{success.choir}</strong></p>
      <button className="btn btn-primary" onClick={() => setSuccess(null)}>Check out another piece</button>
    </div>
  )

  return (
    <div className="page-sm">
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontSize:32, marginBottom:6 }}>Music Checkout</h1>
        <p style={{ color:'var(--ink-md)' }}>
          Search for a piece, fill in your choir's information, and confirm your checkout.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--bd)', marginBottom:'1.5rem' }}>
        {['checkout','checkin'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'8px 16px', border:'none', cursor:'pointer', fontSize:13,
            fontWeight: tab===t ? 500 : 400,
            color: tab===t ? 'var(--gold)' : 'var(--ink-md)',
            background: tab===t ? 'var(--gold-bg)' : 'transparent',
            borderBottom: tab===t ? '2px solid var(--gold)' : '2px solid transparent',
          }}>
            {t === 'checkout' ? 'Check out music' : `Return music (${activeCheckouts.length})`}
          </button>
        ))}
      </div>

      {tab === 'checkout' && (
        <>
          {/* Search */}
          <div className="form-group">
            <label className="label">Search for a piece</label>
            <input
              className="input"
              placeholder="Type title, composer, or voicing…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
              autoFocus
            />
          </div>

          {/* Search results */}
          {results.length > 0 && !selected && (
            <div className="card" style={{ marginBottom:'1.5rem', overflow:'hidden' }}>
              {results.map((p, i) => {
                const a = p.available_copies ?? p.total_copies
                return (
                  <div key={p.id}
                    onClick={() => { if (a > 0) { setSelected(p); setSearch(p.title) } }}
                    style={{
                      padding:'10px 14px',
                      borderBottom: i < results.length-1 ? '1px solid var(--bd)' : 'none',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      cursor: a > 0 ? 'pointer' : 'not-allowed',
                      opacity: a > 0 ? 1 : 0.5,
                      background:'#fff',
                    }}
                    onMouseEnter={e => { if (a>0) e.currentTarget.style.background='var(--gold-bg)' }}
                    onMouseLeave={e => e.currentTarget.style.background='#fff'}
                  >
                    <div>
                      <div style={{ fontWeight:500, marginBottom:2 }}>{p.title}</div>
                      <div style={{ fontSize:12, color:'var(--ink-md)' }}>
                        {p.composer || ''}{p.composer && p.arranger ? ' · ' : ''}{p.arranger ? `arr. ${p.arranger}` : ''}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      <VBadge v={p.voicing} />
                      <span style={{ fontSize:12, color: a===0 ? 'var(--red)' : 'var(--teal)', whiteSpace:'nowrap' }}>
                        {a === 0 ? 'None available' : `${a} available`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Selected piece banner */}
          {selected && (
            <div style={{ background:'var(--teal-lt)', border:'1px solid var(--teal)', borderRadius:'var(--r-lg)',
              padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex',
              justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:500, fontFamily:'Lora,serif', fontSize:16 }}>{selected.title}</div>
                <div style={{ fontSize:13, color:'var(--ink-md)', marginTop:3 }}>
                  <VBadge v={selected.voicing} />
                  <span style={{ marginLeft:8 }}>{avail} of {selected.total_copies} copies available</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setSearch('') }}>
                Change
              </button>
            </div>
          )}

          {/* Checkout form */}
          {selected && (
            <form onSubmit={handleCheckout} className="card" style={{ padding:'1.5rem' }}>
              <h3 style={{ fontSize:18, marginBottom:'1.25rem' }}>Checkout information</h3>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="label">Choir / Ward *</label>
                  <input className="input" required value={form.choir_ward}
                    onChange={e=>set('choir_ward',e.target.value)} placeholder="e.g. Millcreek 2nd Ward" />
                </div>
                <div className="form-group">
                  <label className="label">Director name *</label>
                  <input className="input" required value={form.director_name}
                    onChange={e=>set('director_name',e.target.value)} placeholder="Full name" />
                </div>
              </div>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.contact_email}
                    onChange={e=>set('contact_email',e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={form.contact_phone}
                    onChange={e=>set('contact_phone',e.target.value)} placeholder="(555) 555-5555" />
                </div>
              </div>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="label">Copies needed * (max {avail})</label>
                  <input className="input" type="number" required min={1} max={avail}
                    value={form.copies_taken} onChange={e=>set('copies_taken',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Expected return date</label>
                  <input className="input" type="date" value={form.expected_return}
                    onChange={e=>set('expected_return',e.target.value)}
                    min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width:'100%', justifyContent:'center', marginTop:8 }}>
                {submitting ? 'Saving…' : 'Confirm checkout →'}
              </button>
            </form>
          )}
        </>
      )}

      {tab === 'checkin' && (
        <div>
          {loading ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--ink-lt)' }}>Loading…</div>
          ) : activeCheckouts.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✓</div><div>No music currently checked out.</div></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {activeCheckouts.map(co => {
                const overdue = co.expected_return && new Date(co.expected_return) < new Date()
                return (
                  <div key={co.id} className="card" style={{ padding:'1rem 1.25rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                      <div>
                        <div style={{ fontWeight:500, fontFamily:'Lora,serif', fontSize:15, marginBottom:4 }}>
                          {co.music?.title}
                        </div>
                        <div style={{ fontSize:13, color:'var(--ink-md)' }}>
                          {co.choir_ward} · {co.director_name}
                        </div>
                        <div style={{ fontSize:12, color:'var(--ink-lt)', marginTop:2 }}>
                          {co.copies_taken} copies · checked out {new Date(co.checked_out_at).toLocaleDateString()}
                          {co.expected_return && (
                            <span style={{ color: overdue ? 'var(--red)' : 'var(--ink-lt)' }}>
                              {' '}· {overdue ? 'Overdue — ' : 'Due '}
                              {new Date(co.expected_return + 'T00:00:00').toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={returningId === co.id}
                        onClick={() => handleReturn(co.id)}
                      >
                        {returningId === co.id ? '…' : 'Return'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
