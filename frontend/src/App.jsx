import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, BedDouble, CheckCircle2, ChevronDown, ClipboardList, Edit3, HelpCircle, LayoutDashboard, Menu, Plus, Search, Stethoscope, Trash2, UserRound, Users, X } from 'lucide-react'
import { healthApi, patientApi } from './api'
import { emptyPatient, options, todayIST, wardDepartments } from './constants'
import { titleCaseName, validatePatient } from './validators'

function App() {
  return <AppShell />
}

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [health, setHealth] = useState(true)
  const [toast, setToast] = useState(null)
  const [userOpen, setUserOpen] = useState(false)
  const location = useLocation()
  const greeting = useMemo(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }, [])
  const notify = useCallback((message, type = 'success') => setToast({ message, type }), [])

  useEffect(() => { document.title = 'DScribe – Patient Management' }, [])
  useEffect(() => { let active = true; const check = () => healthApi().then(() => active && setHealth(true)).catch(() => active && setHealth(false)); check(); const timer = setInterval(check, 30000); return () => { active = false; clearInterval(timer) } }, [])
  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 4000); return () => clearTimeout(timer) }, [toast])

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'mobile-visible' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={20} /></div><span>DScribe</span></div>
      <div className="sidebar-label">Workspace</div>
      <nav>
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={18} /> Overview</NavLink>
        <NavLink to="/patients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><ClipboardList size={18} /> Patient records</NavLink>
      </nav>
      <div className="sidebar-bottom"><div className="user-card"><div className="avatar">JD</div><div><strong>Jane Doe</strong><span>Hospital Staff</span></div><button className="chevron-button" onClick={() => setUserOpen(!userOpen)} aria-label="Open user menu"><ChevronDown size={15} /></button>{userOpen && <div className="user-menu"><strong>Jane Doe</strong><span>Demo hospital staff</span></div>}</div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation"><Menu size={21} /></button><div><p className="eyebrow">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h1>{greeting}, Jane <span>👋</span></h1></div><div className="topbar-actions"><div className={`online-dot ${health ? '' : 'offline'}`}><span /> {health ? 'System operational' : 'Server unreachable'}</div><div className="avatar">JD</div></div></header>
      <Routes><Route path="/" element={<Overview notify={notify} />} /><Route path="/patients" element={<Patients notify={notify} />} /><Route path="*" element={<Overview notify={notify} />} /></Routes>
    </main>
    {toast && <div className={`toast ${toast.type}`} role="status"><span>{toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}</span>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </div>
}

function usePatientsData(params = {}) {
  const [state, setState] = useState({ patients: [], stats: { total: 0, admitted: 0, discharged: 0 }, recent_admissions: [], total: 0, loading: true, error: '' })
  const key = JSON.stringify(params)
  const load = useCallback(async () => { setState((s) => ({ ...s, loading: true, error: '' })); try { const { data } = await patientApi.list(params); setState({ ...data.data, loading: false, error: '' }) } catch (err) { setState((s) => ({ ...s, loading: false, error: err.response?.data?.error || 'Unable to connect to the backend.' })) } }, [key])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

function Overview({ notify }) {
  const data = usePatientsData()
  const [formMode, setFormMode] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const navigate = useNavigate()
  const refresh = () => data.reload()
  const executeDelete = async () => { try { await patientApi.delete(confirm.patient.id); setConfirm(null); notify('Patient record deleted.'); refresh() } catch { notify('Could not delete patient.', 'error') } }
  const executeDischarge = async () => { try { await patientApi.discharge(confirm.patient.id); setConfirm(null); notify('Patient marked as discharged.'); refresh() } catch { notify('Could not discharge patient.', 'error') } }
  return <>
    <PageHeading eyebrow="Patient management" title="Overview" subtitle="Monitor and manage hospital admissions in one place." action={<button className="primary-button" onClick={() => setFormMode('add')}><Plus size={18} /> Add patient</button>} />
    <section className="stats-grid"><StatCard icon={<Users />} label="Total patients" value={data.stats.total} helper="All registered records" tone="blue" /><StatCard icon={<BedDouble />} label="Currently admitted" value={data.stats.admitted} helper="Patients in care" tone="purple" /><StatCard icon={<CheckCircle2 />} label="Discharged patients" value={data.stats.discharged} helper="Successfully discharged" tone="green" /></section>
    <section className="records-card"><div className="records-header"><div><h3>Recent admissions</h3><p>Latest patient records added to the system.</p></div><button className="secondary-button" onClick={() => navigate('/patients')}>View all <ChevronDown size={15} className="rotate-right" /></button></div><div className="table-wrap">{data.loading ? <LoadingState /> : data.error ? <ErrorState message={data.error} retry={refresh} /> : data.recent_admissions.length === 0 ? <EmptyState first={true} onAdd={() => setFormMode('add')} /> : <PatientTable patients={data.recent_admissions} onEdit={(p) => { setSelected(p); setFormMode('edit') }} onDelete={(p) => setConfirm({ type: 'delete', patient: p })} onDischarge={(p) => setConfirm({ type: 'discharge', patient: p })} onDetails={setSelected} />}</div></section>
    {formMode && <PatientForm mode={formMode} patient={selected} onClose={() => { setFormMode(null); setSelected(null) }} onSaved={() => { setFormMode(null); setSelected(null); refresh() }} notify={notify} />}
    {selected && !formMode && <DetailsModal patient={selected} onClose={() => setSelected(null)} />}
    {confirm?.type === 'delete' && <ConfirmModal title={`Delete ${confirm.patient.name}?`} message="This cannot be undone." confirmLabel="Delete patient" danger onCancel={() => setConfirm(null)} onConfirm={executeDelete} />}
    {confirm?.type === 'discharge' && <ConfirmModal title={`Discharge ${confirm.patient.name}?`} message="The patient will be marked as discharged today." confirmLabel="Discharge patient" onCancel={() => setConfirm(null)} onConfirm={executeDischarge} />}
  </>
}

function Patients({ notify }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [qInput, setQInput] = useState(searchParams.get('q') || '')
  const [debouncedQ, setDebouncedQ] = useState(searchParams.get('q') || '')
  const [selected, setSelected] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const filters = { q: debouncedQ, ward: searchParams.get('ward') || '', department: searchParams.get('department') || '', doctor: searchParams.get('doctor') || '', status: searchParams.get('status') || '' }
  const data = usePatientsData(filters)
  useEffect(() => { const timer = setTimeout(() => { const next = new URLSearchParams(searchParams); if (qInput.trim()) next.set('q', qInput.trim()); else next.delete('q'); setSearchParams(next, { replace: true }); setDebouncedQ(qInput.trim()) }, 300); return () => clearTimeout(timer) }, [qInput])
  const updateFilter = (key, value) => { const next = new URLSearchParams(searchParams); if (value) next.set(key, value); else next.delete(key); if (key === 'ward' && filters.department && !(wardDepartments[value] || []).includes(filters.department)) next.delete('department'); setSearchParams(next) }
  const clear = () => { setQInput(''); setDebouncedQ(''); setSearchParams({}) }
  const openEdit = (patient) => { setSelected(patient); setFormMode('edit') }
  const executeDelete = async () => { try { await patientApi.delete(confirm.patient.id); setConfirm(null); notify('Patient record deleted.'); data.reload() } catch { notify('Could not delete patient.', 'error') } }
  const executeDischarge = async () => { try { await patientApi.discharge(confirm.patient.id); setConfirm(null); notify('Patient marked as discharged.'); data.reload() } catch { notify('Could not discharge patient.', 'error') } }
  const activeCount = Object.values(filters).filter(Boolean).length
  return <>
    <PageHeading eyebrow="Patient management" title="Patient records" subtitle="Manage all current and past admissions." action={<button className="primary-button" onClick={() => setFormMode('add')}><Plus size={18} /> Add patient</button>} />
    <section className="records-card"><div className="records-header"><div><h3>All patients</h3><p>Search, filter, and update admission records.</p></div><span className="record-count">Showing {data.patients.length} of {data.total}</span></div><div className="filters"><div className="search-box"><Search size={18} /><input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search by patient name..." aria-label="Search patients" /></div><FilterSelect value={filters.ward} label="All wards" values={options.wards} onChange={(v) => updateFilter('ward', v)} /><FilterSelect value={filters.department} label="All departments" values={filters.ward ? wardDepartments[filters.ward] || [] : options.departments} onChange={(v) => updateFilter('department', v)} /><FilterSelect value={filters.doctor} label="All doctors" values={options.doctors} onChange={(v) => updateFilter('doctor', v)} /><FilterSelect value={filters.status} label="All statuses" values={options.statuses} onChange={(v) => updateFilter('status', v)} />{activeCount > 0 && <button className="clear-button" onClick={clear}>Clear filters</button>}</div><div className="table-wrap">{data.loading ? <LoadingState /> : data.error ? <ErrorState message={data.error} retry={data.reload} /> : data.patients.length === 0 ? <EmptyState first={data.total === 0 && !activeCount} onAdd={() => setFormMode('add')} onClear={clear} /> : <PatientTable patients={data.patients} onEdit={openEdit} onDetails={setSelected} onDelete={(p) => setConfirm({ type: 'delete', patient: p })} onDischarge={(p) => setConfirm({ type: 'discharge', patient: p })} />}</div></section>
    {formMode && <PatientForm mode={formMode} patient={selected} onClose={() => { setFormMode(null); setSelected(null) }} onSaved={() => { setFormMode(null); setSelected(null); data.reload() }} notify={notify} />}
    {selected && !formMode && <DetailsModal patient={selected} onClose={() => setSelected(null)} />}
    {confirm?.type === 'delete' && <ConfirmModal title={`Delete ${confirm.patient.name}?`} message="This cannot be undone." confirmLabel="Delete patient" danger onCancel={() => setConfirm(null)} onConfirm={executeDelete} />}
    {confirm?.type === 'discharge' && <ConfirmModal title={`Discharge ${confirm.patient.name}?`} message="The patient will be marked as discharged today." confirmLabel="Discharge patient" onCancel={() => setConfirm(null)} onConfirm={executeDischarge} />}
  </>
}

function PageHeading({ eyebrow, title, subtitle, action }) { return <section className="page-heading"><div><p className="eyebrow blue">{eyebrow}</p><h2>{title}</h2><p className="subheading">{subtitle}</p></div>{action}</section> }
function StatCard({ icon, label, value, helper, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong><span>{helper}</span></div><div className={`stat-decoration ${tone}`} /></div> }
function FilterSelect({ value, label, values, onChange }) { return <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}><option value="">{label}</option>{values.map((v) => <option key={v}>{v}</option>)}</select> }
function LoadingState() { return <div className="loading-state"><div className="skeleton-line wide" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="spinner" />Loading records...</div> }
function ErrorState({ message, retry }) { return <div className="empty-state"><div className="empty-icon error-icon"><X size={24} /></div><h3>{message}</h3><button className="secondary-button" onClick={retry}>Retry</button></div> }
function EmptyState({ first, onAdd, onClear }) { return <div className="empty-state"><div className="empty-icon"><UserRound size={24} /></div><h3>{first ? 'No patients yet. Add your first patient' : 'No patients match your filters'}</h3><p>{first ? 'Your patient records will appear here.' : 'Try clearing one or more filters.'}</p>{first ? <button className="secondary-button" onClick={onAdd}><Plus size={16} /> Add patient</button> : <button className="secondary-button" onClick={onClear}>Clear filters</button>}</div> }
function PatientTable({ patients, onEdit, onDelete, onDischarge, onDetails }) { return <table><thead><tr><th>Patient</th><th>Age / Gender</th><th>Ward</th><th>Department</th><th>Doctor</th><th>Admission date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{patients.map((patient) => <tr key={patient.id} onClick={() => onDetails?.(patient)}><td><div className="patient-cell"><div className="patient-avatar">{patient.name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</div><strong>{patient.name}</strong></div></td><td>{patient.age} yrs <span className="muted">· {patient.gender}</span></td><td>{patient.ward}</td><td>{patient.department}</td><td>{patient.doctor}</td><td>{formatDate(patient.admission_date)}</td><td><span className={`status ${patient.status.toLowerCase()}`}>{patient.status}</span>{patient.discharged_at && <small className="discharged-date">{formatDate(patient.discharged_at)}</small>}</td><td onClick={(e) => e.stopPropagation()}><div className="row-actions"><button aria-label="Edit" title="Edit" onClick={() => onEdit(patient)}><Edit3 size={16} /></button><button aria-label="Mark as discharged" title={patient.status === 'Discharged' ? 'Already discharged' : 'Mark as discharged'} disabled={patient.status === 'Discharged'} onClick={() => onDischarge?.(patient)}><CheckCircle2 size={16} /></button><button aria-label="Delete" title="Delete" className="danger" onClick={() => onDelete?.(patient)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table> }
function formatDate(value) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

function PatientForm({ mode, patient, onClose, onSaved, notify }) {
  const [form, setForm] = useState(patient ? { ...patient } : emptyPatient())
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmReAdmit, setConfirmReAdmit] = useState(false)
  const departments = form.ward ? wardDepartments[form.ward] || [] : options.departments
  const setField = (field, value) => { setForm((current) => ({ ...current, [field]: field === 'name' ? value : value })); setTouched((current) => ({ ...current, [field]: true })) }
  const validate = () => { const next = validatePatient(form); setErrors(next); setTouched({ name: true, age: true, gender: true, ward: true, department: true, doctor: true, admission_date: true, status: true }); return next }
  const submit = async (event, allowReAdmit = false) => { event.preventDefault(); const next = validate(); if (Object.keys(next).length) return; if (mode === 'edit' && patient?.status === 'Discharged' && form.status === 'Admitted' && !allowReAdmit) { setConfirmReAdmit(true); return } setSaving(true); try { const payload = { ...form, name: titleCaseName(form.name), age: Number(form.age) }; const result = mode === 'add' ? await patientApi.create(payload) : await patientApi.update(patient.id, payload); if (result.data.warnings?.length) notify(result.data.warnings[0], 'warning'); else notify(mode === 'add' ? 'Patient added successfully.' : 'Patient updated successfully.'); onSaved() } catch (err) { setTouched({ name: true, age: true, gender: true, ward: true, department: true, doctor: true, admission_date: true, status: true }); setErrors(err.response?.data?.errors || { form: err.response?.data?.error || 'Could not save patient.' }) } finally { setSaving(false) } }
  useEffect(() => { if (form.ward && form.department && !(wardDepartments[form.ward] || []).includes(form.department)) setForm((current) => ({ ...current, department: '' })) }, [form.ward])
  const field = (key) => touched[key] ? errors[key] : ''
  return <div className="modal-backdrop"><div className="modal modal-scroll"><div className="modal-header"><div><p className="eyebrow blue">Patient record</p><h2>{mode === 'add' ? 'Add new patient' : 'Edit patient'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><form onSubmit={submit} noValidate><div className="form-grid"><FormInput field="name" label="Full name" value={form.name} error={field('name')} onChange={setField} onBlur={() => setTouched((v) => ({ ...v, name: true }))} /><FormInput field="age" label="Age" type="number" value={form.age} error={field('age')} onChange={setField} onBlur={() => setTouched((v) => ({ ...v, age: true }))} /><FormSelect field="gender" label="Gender" value={form.gender} values={options.genders} error={field('gender')} onChange={setField} /><FormSelect field="ward" label="Ward" value={form.ward} values={options.wards} error={field('ward')} onChange={setField} /><FormSelect field="department" label="Department" value={form.department} values={departments} error={field('department')} onChange={setField} /><FormSelect field="doctor" label="Doctor" value={form.doctor} values={options.doctors} error={field('doctor')} onChange={setField} /><FormInput field="admission_date" label="Admission date" type="date" value={form.admission_date} error={field('admission_date')} onChange={setField} onBlur={() => setTouched((v) => ({ ...v, admission_date: true }))} /><FormSelect field="status" label="Status" value={form.status} values={options.statuses} error={field('status')} onChange={setField} /></div>{errors.form && <div className="form-error">{errors.form}</div>}<div className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : mode === 'add' ? 'Add patient' : 'Save changes'}</button></div></form></div>{confirmReAdmit && <ConfirmModal title="Re-admit this patient?" message="This will change their status back to Admitted." confirmLabel="Re-admit patient" onCancel={() => setConfirmReAdmit(false)} onConfirm={(e) => { setConfirmReAdmit(false); submit(e, true) }} />}</div>
}
function FormInput({ field, label, type = 'text', value, error, onChange, onBlur }) { return <label className="form-field"><span>{label}<b>*</b></span><input type={type} value={value ?? ''} max={type === 'number' ? 120 : undefined} onChange={(e) => onChange(field, e.target.value)} onBlur={onBlur} className={error ? 'invalid' : ''} />{error && <small>{error}</small>}</label> }
function FormSelect({ field, label, value, values, error, onChange }) { return <label className="form-field"><span>{label}<b>*</b></span><select value={value || ''} onChange={(e) => onChange(field, e.target.value)} className={error ? 'invalid' : ''}><option value="">Select {label.toLowerCase()}</option>{values.map((v) => <option key={v}>{v}</option>)}</select>{error && <small>{error}</small>}</label> }
function ConfirmModal({ title, message, confirmLabel, danger, onCancel, onConfirm }) { return <div className="modal-backdrop confirm-layer"><div className="confirm-modal"><div className={`confirm-icon ${danger ? 'danger-bg' : ''}`}>{danger ? <Trash2 size={22} /> : <CheckCircle2 size={22} />}</div><h2>{title}</h2><p>{message}</p><div className="modal-footer"><button className="secondary-button" onClick={onCancel}>Cancel</button><button className={`primary-button ${danger ? 'danger-button' : ''}`} onClick={onConfirm}>{confirmLabel}</button></div></div></div> }
function DetailsModal({ patient, onClose }) { return <div className="modal-backdrop"><div className="modal details-modal"><div className="modal-header"><div><p className="eyebrow blue">Patient details</p><h2>{patient.name}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><div className="details-grid">{[['Age', `${patient.age} years`], ['Gender', patient.gender], ['Ward', patient.ward], ['Department', patient.department], ['Doctor', patient.doctor], ['Admission date', formatDate(patient.admission_date)], ['Status', patient.status], ['Discharged date', formatDate(patient.discharged_at)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></div></div> }

export default App

