import { useState } from 'react'
import { VOICINGS, CATEGORIES, ACCOMPANIMENTS } from '../lib/constants.js'

const EMPTY = {
  title:'', composer:'', arranger:'', voicing:'SATB',
  accompaniment:'Piano', category:"Hymns & Children's Songs",
  publisher:'', publication_year:'', total_copies:'', topic:'', notes:'',
}

export default function MusicForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY)

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return alert('Title is required.')
    onSave({
      ...form,
      publication_year: form.publication_year ? parseInt(form.publication_year) : null,
      total_copies: form.total_copies !== '' && form.total_copies !== null ? parseInt(form.total_copies) : null,
    })
  }

  const Field = ({ label, children }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row form-row-2">
        <Field label="Title *">
          <input className="input" value={form.title} onChange={e=>set('title',e.target.value)} required />
        </Field>
        <Field label="Total copies (optional)">
          <input className="input" type="number" min="0" value={form.total_copies} onChange={e=>set('total_copies',e.target.value)} />
        </Field>
      </div>

      <div className="form-row form-row-2">
        <Field label="Composer">
          <input className="input" value={form.composer} onChange={e=>set('composer',e.target.value)} />
        </Field>
        <Field label="Arranger">
          <input className="input" value={form.arranger} onChange={e=>set('arranger',e.target.value)} />
        </Field>
      </div>

      <div className="form-row form-row-3">
        <Field label="Voicing">
          <select className="input select" value={form.voicing} onChange={e=>set('voicing',e.target.value)}>
            {VOICINGS.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Accompaniment">
          <select className="input select" value={form.accompaniment} onChange={e=>set('accompaniment',e.target.value)}>
            {ACCOMPANIMENTS.map(a => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="input select" value={form.category} onChange={e=>set('category',e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <div className="form-row form-row-2">
        <Field label="Publisher">
          <input className="input" value={form.publisher} onChange={e=>set('publisher',e.target.value)} />
        </Field>
        <Field label="Publication year">
          <input className="input" type="number" min="1800" max="2099" value={form.publication_year} onChange={e=>set('publication_year',e.target.value)} />
        </Field>
      </div>

      <Field label="Topic / notes">
        <textarea className="input" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}
          style={{ resize:'vertical' }} />
      </Field>

      <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save piece'}
        </button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}
