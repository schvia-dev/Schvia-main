// src/pages/timetable/TimetablePage.tsx

import React, { useEffect, useMemo, useState } from 'react'
import { PlusCircle, Edit, Trash2, Clock } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SelectInput from '../../components/ui/SelectInput'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

import {
  fetchDepartmentOptions,
  fetchSectionOptions,
  getSemesterOptions,
  Option
} from '../../constants/fetchTimetableFilters'

import {
  fetchSubjectOptions,
  fetchFacultyOptions
} from '../../constants/fetchSlotOptions'

import {
  createTimetable,
  fetchPeriods,
  fetchEntries,
  saveEntry,
  deleteEntry,
  Period,
  Entry
} from '../../constants/timetable'

const weekDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

interface Slot {
  entryId?: number
  periodId: number
  time: string
  subjectId?: number
  facultyId?: string
  subject?: string
  faculty?: string
}
type DaySchedule = Record<string, Slot[]>

const TimetablePage: React.FC = () => {
  const { theme } = useTheme()
  const { user } = useAuth()
  const collegeId = user?.college_id

  // ── Filters ───────────────────────────────────
  const [deptOpts, setDeptOpts]   = useState<Option[]>([])
  const [sectOpts, setSectOpts]   = useState<Option[]>([])
  const semOpts                   = getSemesterOptions()
  const [deptSel, setDeptSel]     = useState('')
  const [sectSel, setSectSel]     = useState('')
  const [semSel, setSemSel]       = useState('')

  // ── Slot dropdowns ────────────────────────────
  const [subjectOpts, setSubjectOpts] = useState<Option[]>([])
  const [facultyOpts, setFacultyOpts] = useState<Option[]>([])

  // ── Timetable data ───────────────────────────
  const [periods, setPeriods]   = useState<Period[]>([])
  const [entries, setEntries]   = useState<Entry[]>([])

  // ── Create-timetable modal ───────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [numPeriods, setNumPeriods] = useState(6)
  const [times,      setTimes]      = useState<string[]>([])

  // ── Edit-slot modal ──────────────────────────
  const [showEdit,  setShowEdit]  = useState(false)
  const [modalDay,  setModalDay]  = useState('')
  const [modalIdx,  setModalIdx]  = useState(0)
  const [modalMode, setModalMode] = useState<'create'|'edit'>('create')
  const [formData,  setFormData]  = useState<{ entryId?: number; subjectId: string; facultyId: string }>({
    subjectId: '',
    facultyId: ''
  })

  // ── Notifications ────────────────────────────
  const [notify, setNotify] = useState<{ type:'success'|'error'; message:string }|null>(null)

  // ── Load departments ──────────────────────────
  useEffect(() => {
    if (!collegeId) return
    fetchDepartmentOptions(collegeId).then(setDeptOpts)
  }, [collegeId])

  // ── Load sections on dept change ─────────────
  useEffect(() => {
    if (!collegeId) return
    const did = deptSel ? Number(deptSel) : undefined
    fetchSectionOptions(collegeId, did).then(setSectOpts)
  }, [collegeId, deptSel])

  // ── Load subjects when dept+sem set ───────────
  useEffect(() => {
    if (collegeId && deptSel && semSel) {
      fetchSubjectOptions(collegeId, Number(deptSel), Number(semSel)).then(setSubjectOpts)
    }
  }, [collegeId, deptSel, semSel])

  // ── Load faculties when dept set ─────────────
  useEffect(() => {
    if (collegeId && deptSel) {
      fetchFacultyOptions(collegeId, Number(deptSel)).then(setFacultyOpts)
    }
  }, [collegeId, deptSel])

  // ── Load periods & entries when section+sem change
  useEffect(() => {
    if (!sectSel || !semSel) return
    const s  = Number(sectSel)
    const sm = Number(semSel)
    fetchPeriods(s).then(setPeriods)
    fetchEntries(s, sm).then(setEntries)
  }, [sectSel, semSel])

  // ── Keep times[] in sync with numPeriods ─────
  useEffect(() => {
    setTimes(ts => {
      const arr = [...ts]; arr.length = numPeriods
      for (let i = 0; i < numPeriods; i++) if (arr[i] == null) arr[i] = ''
      return arr
    })
  }, [numPeriods])

  // ── Build the schedule grid ──────────────────
  const schedule = useMemo<DaySchedule>(() => {
    const grid: DaySchedule = {}
    weekDays.forEach(day => {
      grid[day] = periods.map(p => {
        const e = entries.find(x => x.weekday === day && x.period_id === p.id)
        return {
          entryId:   e?.id,
          periodId:  p.id,
          time:      p.time,
          subjectId: e?.subject_id,
          facultyId: e?.faculty_id,
          subject:   e?.subject,
          faculty:   e?.faculty
        }
      })
    })
    return grid
  }, [periods, entries])

  // ── Create Timetable (validate HH:MM-HH:MM) ──
  const handleCreateTimetable = async () => {
    for (let i = 0; i < times.length; i++) {
      const raw = times[i].trim()
      const m = /^(\d\d):(\d\d)-(\d\d):(\d\d)$/.exec(raw)
      if (!m) {
        setNotify({ type:'error', message:`Period ${i+1}: invalid format` })
        return
      }
      const [, sh, sm, eh, em] = m
      const start = +sh * 60 + +sm
      const end   = +eh * 60 + +em
      if (start >= end) {
        setNotify({ type:'error', message:`Period ${i+1}: start must be before end` })
        return
      }
    }
    try {
      await createTimetable(Number(sectSel), Number(semSel), times)
      setShowCreate(false)
      setNotify({ type:'success', message:`Created ${times.length} periods.` })
      setPeriods(await fetchPeriods(Number(sectSel)))
      setEntries([])
    } catch (err: any) {
      setNotify({ type:'error', message: err.message })
    }
  }

  // ── Open the edit/create slot modal ──────────
  const openCell = (day: string, idx: number) => {
    const slot = schedule[day][idx]
    if (slot.subjectId) {
      setModalMode('edit')
      setFormData({
        entryId:   slot.entryId,
        subjectId: String(slot.subjectId),
        facultyId: slot.facultyId || ''
      })
    } else {
      setModalMode('create')
      setFormData({ subjectId:'', facultyId:'' })
    }
    setModalDay(day)
    setModalIdx(idx)
    setShowEdit(true)
  }

  // ── Save slot (faculty_id stays a string) ───
  const onSaveCell = async () => {
    const slot = schedule[modalDay][modalIdx]
    const payload = {
      id:           modalMode==='edit'? formData.entryId : undefined,
      section_id:   Number(sectSel),
      weekday:      modalDay,
      period_id:    slot.periodId,
      subject_id:   Number(formData.subjectId),
      faculty_id:   formData.facultyId,
      semester_no:  Number(semSel)
    }
    try {
      await saveEntry(payload)
      setShowEdit(false)
      setNotify({ type:'success', message: modalMode==='edit'?'Updated':'Created' })
      setEntries(await fetchEntries(Number(sectSel), Number(semSel)))
    } catch (err: any) {
      setNotify({ type:'error', message: err.message })
    }
  }

  // ── Delete slot ──────────────────────────────
  const onDeleteCell = async () => {
    if (!formData.entryId) return
    try {
      await deleteEntry(formData.entryId)
      setShowEdit(false)
      setNotify({ type:'success', message:'Deleted.' })
      setEntries(await fetchEntries(Number(sectSel), Number(semSel)))
    } catch (err: any) {
      setNotify({ type:'error', message: err.message })
    }
  }

  // ── Theming ──────────────────────────────────
  const bg = theme==='light' ? 'bg-white'     : 'bg-[#3F3D56]'
  const bc = theme==='light' ? 'border-gray-200' : 'border-gray-700'
  const tc = theme==='light' ? 'text-[#333]'  : 'text-[#E5E5E5]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Timetable Management</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={()=>setShowCreate(true)}
          disabled={!sectSel || !semSel}
        >
          Create Timetable
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <SelectInput
            label="Department"
            options={[{ value:'', label:'All Departments' }, ...deptOpts]}
            value={deptSel}
            onChange={e=>setDeptSel(e.target.value)}
          />
          <SelectInput
            label="Section"
            options={[{ value:'', label:'All Sections' }, ...sectOpts]}
            value={sectSel}
            onChange={e=>setSectSel(e.target.value)}
          />
          <SelectInput
            label="Semester"
            options={[{ value:'', label:'All Semesters' }, ...semOpts]}
            value={semSel}
            onChange={e=>setSemSel(e.target.value)}
          />
        </div>
      </Card>

      {/* Timetable Grid */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${bc} border-b`}>
                <th className={`py-3 px-4 ${tc}`}>Time</th>
                {weekDays.map(day => (
                  <th key={day} className={`py-3 px-4 ${tc}`}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, idx) => (
                <tr key={p.id} className={`${bc} border-b`}>
                  <td className={`py-4 px-4 ${tc}`}>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2" />
                      {p.name}
                      <span className="ml-2 text-xs text-gray-400">
                        {p.time}
                      </span>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const slot = schedule[day][idx]
                    return (
                      <td key={`${day}-${idx}`} className="py-4 px-4">
                        <div
                          className={
                            slot.subject
                              ? `${bg} p-3 rounded-lg shadow-sm cursor-pointer`
                              : 'h-20 flex items-center justify-center border-2 border-dashed rounded-lg border-gray-200 cursor-pointer'
                          }
                          onClick={()=>openCell(day, idx)}
                        >
                          {slot.subject ? (
                            <>
                              <div className={`font-medium ${tc}`}>
                                {slot.subject}
                              </div>
                              <div className="text-sm text-gray-500">
                                {slot.faculty}
                              </div>
                              <div className="text-xs text-gray-400">
                                {slot.time}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">
                              No class
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create-Timetable Modal */}
      <Modal
        isOpen={showCreate}
        onClose={()=>setShowCreate(false)}
        title="Create Timetable"
        footer={
          <Button variant="primary" onClick={handleCreateTimetable}>
            Save Timetable
          </Button>
        }
      >
        <Input
          type="number"
          label="Number of Periods"
          value={String(numPeriods)}
          onChange={e=>setNumPeriods(Number(e.target.value))}
        />
        <div className="space-y-2 mt-4">
          {times.map((t,i) => (
            <Input
              key={i}
              label={`Period ${i+1} time (HH:MM-HH:MM)`}
              placeholder="09:00-10:00"
              value={t}
              onChange={e => {
                const arr = [...times]
                arr[i] = e.target.value
                setTimes(arr)
              }}
            />
          ))}
        </div>
      </Modal>

      {/* Edit/Create Slot Modal */}
      <Modal
        isOpen={showEdit}
        onClose={()=>setShowEdit(false)}
        title={modalMode==='edit'?'Edit Slot':'Create Slot'}
        footer={
          <div className="flex justify-between w-full">
            {modalMode==='edit' && (
              <Button variant="danger" icon={<Trash2 size={14}/>} onClick={onDeleteCell}>
                Delete
              </Button>
            )}
            <Button variant="primary" icon={<Edit size={14}/>} onClick={onSaveCell}>
              {modalMode==='edit'?'Save':'Create'}
            </Button>
          </div>
        }
      >
        <SelectInput
          label="Subject"
          options={[{ value:'', label:'Select Subject' }, ...subjectOpts]}
          value={formData.subjectId}
          onChange={e=>setFormData(f=>({...f,subjectId:e.target.value}))}
        />
        <SelectInput
          label="Faculty"
          options={[{ value:'', label:'Select Faculty' }, ...facultyOpts]}
          value={formData.facultyId}
          onChange={e=>setFormData(f=>({...f,facultyId:e.target.value}))}
        />
      </Modal>

      {/* Notification */}
      <Modal
        isOpen={!!notify}
        onClose={()=>setNotify(null)}
        title={notify?.type==='success'?'Success':'Error'}
        footer={<Button variant="primary" onClick={()=>setNotify(null)}>OK</Button>}
      >
        <p>{notify?.message}</p>
      </Modal>
    </div>
  )
}

export default TimetablePage
