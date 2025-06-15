import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, Edit, Trash2, Clock, List } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SelectInput from '../../components/ui/SelectInput';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  fetchDepartmentOptions,
  fetchSectionOptions,
  fetchSemesterOptions,
  Option,
} from '../../constants/fetchTimetableFilters';
import { fetchSubjectOptions, fetchFacultyOptions } from '../../constants/fetchSlotOptions';
import { createTimetable, fetchPeriods, fetchEntries, saveEntry, deleteEntry, Period, Entry, fetchTimetables, deleteTimetable, Timetable, BASE } from '../../constants/timetable';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Slot {
  entryId?: number;
  periodId: number;
  time: string;
  subjectId?: number;
  facultyId?: string;
  subject?: string;
  faculty?: string;
}
type DaySchedule = Record<string, Slot[]>;

const TimetablePage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const collegeId = user?.college_id;

  // General Filters
  const [deptOpts, setDeptOpts] = useState<Option[]>([]);
  const [sectOpts, setSectOpts] = useState<Option[]>([]);
  const [semOpts, setSemOpts] = useState<Option[]>([]);
  const [deptSel, setDeptSel] = useState('');
  const [sectSel, setSectSel] = useState('');
  const [semSel, setSemSel] = useState('');

  // Create Modal Filters
  const [createDeptOpts, setCreateDeptOpts] = useState<Option[]>([]);
  const [createSectOpts, setCreateSectOpts] = useState<Option[]>([]);
  const [createSemOpts, setCreateSemOpts] = useState<Option[]>([]);
  const [createDeptSel, setCreateDeptSel] = useState('');
  const [createSectSel, setCreateSectSel] = useState('');
  const [createSemSel, setCreateSemSel] = useState('');

  // Slot dropdowns
  const [subjectOpts, setSubjectOpts] = useState<Option[]>([]);
  const [facultyOpts, setFacultyOpts] = useState<Option[]>([]);

  // Timetable data
  const [periods, setPeriods] = useState<Period[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<{ batch_id: string; semester_no: string } | null>(null);

  // Create-timetable modal
  const [showCreate, setShowCreate] = useState(false);
  const [numPeriods, setNumPeriods] = useState(6);
  const [times, setTimes] = useState<string[]>([]);

  // Edit-slot modal
  const [showEdit, setShowEdit] = useState(false);
  const [modalDay, setModalDay] = useState('');
  const [modalIdx, setModalIdx] = useState(0);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<{ entryId?: number; subjectId: string; facultyId: string }>({
    subjectId: '',
    facultyId: '',
  });

  // Notifications
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load departments
  useEffect(() => {
    if (!collegeId) return;
    console.log('Fetching departments for collegeId:', collegeId); // Debug
    fetchDepartmentOptions(collegeId)
      .then(data => {
        setDeptOpts(data);
        setCreateDeptOpts(data);
      })
      .catch(err => setNotify({ type: 'error', message: err.message || 'Failed to load departments' }));
    setDeptSel('');
    setSectOpts([]);
    setSectSel('');
    setSemOpts([]);
    setSemSel('');
  }, [collegeId]);

  // Load sections for general filters
  useEffect(() => {
    if (!collegeId) return;
    console.log('Fetching sections for collegeId:', collegeId, 'deptSel:', deptSel); // Debug
    const did = deptSel ? Number(deptSel) : undefined;
    fetchSectionOptions(collegeId, did)
      .then(setSectOpts)
      .catch(err => setNotify({ type: 'error', message: err.message || 'Failed to load sections' }));
    setSectSel('');
    setSemOpts([]);
    setSemSel('');
  }, [collegeId, deptSel]);

  // Load semesters for general filters
  useEffect(() => {
    if (!sectSel) return;
    console.log('Fetching semesters for batch_id:', sectSel); // Debug
    fetchSemesterOptions(Number(sectSel))
      .then(setSemOpts)
      .catch(err => setNotify({ type: 'error', message: err.message || 'Failed to load semesters' }));
    setSemSel('');
  }, [sectSel]);

  // Load sections for create modal
  useEffect(() => {
    if (!collegeId || !createDeptSel) return;
    console.log('Fetching sections for create modal:', collegeId, createDeptSel); // Debug
    fetchSectionOptions(collegeId, Number(createDeptSel))
      .then(setCreateSectOpts)
      .catch(err => setNotify({ type: 'error', message: err.message || 'Failed to load sections' }));
    setCreateSectSel('');
    setCreateSemOpts([]);
    setCreateSemSel('');
  }, [collegeId, createDeptSel]);

  // Load semesters for create modal
  useEffect(() => {
    if (!createSectSel) return;
    console.log('Fetching semesters for create modal batch_id:', createSectSel); // Debug
    fetchSemesterOptions(Number(createSectSel))
      .then(setCreateSemOpts)
      .catch(err => setNotify({ type: 'error', message: err.message || 'Failed to load semesters' }));
    setCreateSemSel('');
  }, [createSectSel]);

  // Load timetables based on filters
  useEffect(() => {
    if (!collegeId) return;
    console.log('Fetching timetables with filters:', { collegeId, deptSel, sectSel, semSel }); // Debug
    fetchTimetables(
      collegeId,
      deptSel ? Number(deptSel) : undefined,
      sectSel ? Number(sectSel) : undefined,
      semSel ? Number(semSel) : undefined
    )
      .then(setTimetables)
      .catch(err => setNotify({ type: 'error', message: err.message || 'Failed to load timetables' }));
    setSubjectOpts([]);
    setFacultyOpts([]);
    setPeriods([]);
    setEntries([]);
    setSelectedTimetable(null);
  }, [collegeId, deptSel, sectSel, semSel]);

  // Load subjects, faculties, periods, and entries for selected timetable
  useEffect(() => {
    if (!collegeId || !selectedTimetable) return;
    const s = Number(selectedTimetable.batch_id);
    const sm = Number(selectedTimetable.semester_no);
    console.log('Fetching data for batch_id:', s, 'semester_no:', sm); // Debug
    fetchSubjectOptions(collegeId, s, sm)
      .then(data => {
        console.log('Fetched subjects:', data); // Debug
        if (data.length === 0) {
          setNotify({ type: 'error', message: 'No subjects available for this batch and semester.' });
        }
        setSubjectOpts(data);
      })
      .catch(err => {
        console.error('Subject fetch error:', err.message); // Debug
        setNotify({ type: 'error', message: err.message || 'Failed to load subjects' });
      });
    fetchFacultyOptions(collegeId, s, sm)
      .then(data => {
        console.log('Fetched faculties:', data); // Debug
        if (data.length === 0) {
          setNotify({ type: 'error', message: 'No faculties available for this batch and semester.' });
        }
        setFacultyOpts(data);
      })
      .catch(err => {
        console.error('Faculty fetch error:', err.message); // Debug
        setNotify({ type: 'error', message: err.message || 'Failed to load faculties' });
      });
    fetchPeriods(s, sm)
      .then(periods => {
        console.log('Fetched periods:', periods); // Debug
        setPeriods(periods);
      })
      .catch(err => {
        console.error('Periods fetch error:', err.message); // Debug
        setNotify({ type: 'error', message: err.message || 'Failed to load periods' });
      });
    fetchEntries(s, sm)
      .then(entries => {
        console.log('Fetched entries:', entries); // Debug
        setEntries(entries);
      })
      .catch(err => {
        console.error('Entries fetch error:', err.message); // Debug
        setNotify({ type: 'error', message: err.message || 'Failed to load entries' });
      });
  }, [collegeId, selectedTimetable]);

  // Refetch faculties when subject changes in edit modal
  useEffect(() => {
    if (showEdit && collegeId && selectedTimetable && formData.subjectId) {
      console.log('Refetching faculties for subject_id:', formData.subjectId); // Debug
      fetchFacultyOptions(collegeId, Number(selectedTimetable.batch_id), Number(selectedTimetable.semester_no), Number(formData.subjectId))
        .then(data => {
          console.log('Fetched faculties for subject:', data); // Debug
          setFacultyOpts(data);
        })
        .catch(err => setNotify({ type: 'error', message: err.message || 'Failed to load faculties' }));
    }
  }, [showEdit, collegeId, selectedTimetable, formData.subjectId]);

  // Sync times with numPeriods
  useEffect(() => {
    setTimes(ts => {
      const arr = [...ts];
      arr.length = numPeriods;
      for (let i = 0; i < numPeriods; i++) if (arr[i] == null) arr[i] = '';
      return arr;
    });
  }, [numPeriods]);

  // Build schedule grid
  const schedule = useMemo<DaySchedule>(() => {
    const grid: DaySchedule = {};
    weekDays.forEach(day => {
      grid[day] = periods.map(p => {
        const e = entries.find(x => x.weekday === day && x.period_id === p.id);
        return {
          entryId: e?.id,
          periodId: p.id,
          time: p.time,
          subjectId: e?.subject_id,
          facultyId: e?.faculty_id,
          subject: e?.subject,
          faculty: e?.faculty,
        };
      });
    });
    return grid;
  }, [periods, entries]);

  // Select timetable
  const handleSelectTimetable = async (timetable: Timetable) => {
    console.log('Selecting timetable:', timetable); // Debug
    const batchId = timetable.batch_id;
    const semesterNo = timetable.semester_no;
    try {
      const batchRes = await fetch(`${BASE}/fetchBatchDetails?batch_id=${batchId}`);
      if (!batchRes.ok) {
        const error = await batchRes.json();
        console.error('Fetch batch details error:', error); // Debug
        throw new Error(error.message || 'Failed to fetch batch details.');
      }
      const { department_id } = await batchRes.json();
      setDeptSel(String(department_id));
      setSectSel(String(batchId));
      setSemSel(String(semesterNo));
      setSelectedTimetable({ batch_id: String(batchId), semester_no: String(semesterNo) });
    } catch (err: any) {
      console.error('Select timetable failed:', err.message); // Debug
      setNotify({ type: 'error', message: err.message || 'Failed to select timetable.' });
    }
  };

  // Delete timetable
  const handleDeleteTimetable = async (batch_id: number, semester_no: number) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;
    try {
      console.log('Deleting timetable:', { batch_id, semester_no }); // Debug
      await deleteTimetable(batch_id, semester_no);
      setTimetables(timetables.filter(t => t.batch_id !== batch_id || t.semester_no !== semester_no));
      setNotify({ type: 'success', message: 'Timetable deleted successfully.' });
      if (selectedTimetable?.batch_id === String(batch_id) && selectedTimetable?.semester_no === String(semester_no)) {
        setSelectedTimetable(null);
        setPeriods([]);
        setEntries([]);
      }
    } catch (err: any) {
      console.error('Delete timetable failed:', err.message); // Debug
      setNotify({ type: 'error', message: err.message || 'Failed to delete timetable.' });
    }
  };

  // Create Timetable
  const handleCreateTimetable = async () => {
    if (!createSectSel || !createSemSel) {
      setNotify({ type: 'error', message: 'Please select batch and semester.' });
      return;
    }
    const timeRanges: { start: number; end: number }[] = [];
    for (let i = 0; i < times.length; i++) {
      const raw = times[i].trim();
      const m = /^(\d\d):(\d\d)-(\d\d):(\d\d)$/.exec(raw);
      if (!m) {
        setNotify({ type: 'error', message: `Period ${i + 1}: invalid format (use HH:MM-HH:MM)` });
        return;
      }
      const [, sh, sm, eh, em] = m;
      const start = +sh * 60 + +sm;
      const end = +eh * 60 + +em;
      if (start >= end) {
        setNotify({ type: 'error', message: `Period ${i + 1}: start must be before end` });
        return;
      }
      for (const range of timeRanges) {
        if (!(end <= range.start || start >= range.end)) {
          setNotify({ type: 'error', message: `Period ${i + 1}: overlaps with another period` });
          return;
        }
      }
      timeRanges.push({ start, end });
    }
    try {
      console.log('Creating timetable with:', { batch_id: Number(createSectSel), semester_no: Number(createSemSel), times }); // Debug
      await createTimetable(Number(createSectSel), Number(createSemSel), times);
      setShowCreate(false);
      setNotify({ type: 'success', message: `Created ${times.length} periods.` });
      // Refresh timetables
      const updatedTimetables = await fetchTimetables(
        collegeId!,
        deptSel ? Number(deptSel) : undefined,
        sectSel ? Number(sectSel) : undefined,
        semSel ? Number(semSel) : undefined
      );
      setTimetables(updatedTimetables);
      // Auto-select the new timetable
      setSelectedTimetable({ batch_id: createSectSel, semester_no: createSemSel });
      setDeptSel(createDeptSel);
      setSectSel(createSectSel);
      setSemSel(createSemSel);
      setCreateDeptSel('');
      setCreateSectSel('');
      setCreateSemSel('');
      setNumPeriods(6);
      setTimes([]);
    } catch (err: any) {
      console.error('Timetable creation failed:', err.message); // Debug
      setNotify({ type: 'error', message: err.message || 'Failed to create timetable' });
    }
  };

  // Open edit/create slot modal
  const openCell = (day: string, idx: number) => {
    const slot = schedule[day][idx];
    console.log('Opening slot:', { day, idx, slot }); // Debug
    if (slot.subjectId) {
      setModalMode('edit');
      setFormData({
        entryId: slot.entryId,
        subjectId: String(slot.subjectId),
        facultyId: slot.facultyId || '',
      });
    } else {
      setModalMode('create');
      setFormData({ subjectId: '', facultyId: '' });
    }
    setModalDay(day);
    setModalIdx(idx);
    setShowEdit(true);
  };

  // Save slot
  const onSaveCell = async () => {
    if (!formData.subjectId || !formData.facultyId) {
      setNotify({ type: 'error', message: 'Subject and faculty are required.' });
      return;
    }
    const slot = schedule[modalDay][modalIdx];
    const payload = {
      id: modalMode === 'edit' ? formData.entryId : undefined,
      batch_id: Number(selectedTimetable!.batch_id),
      weekday: modalDay,
      period_id: slot.periodId,
      subject_id: Number(formData.subjectId),
      faculty_id: formData.facultyId,
      semester_no: Number(selectedTimetable!.semester_no),
    };
    try {
      console.log('Saving slot with payload:', payload); // Debug
      await saveEntry(payload);
      setShowEdit(false);
      setNotify({ type: 'success', message: modalMode === 'edit' ? 'Updated' : 'Created' });
      const entries = await fetchEntries(Number(selectedTimetable!.batch_id), Number(selectedTimetable!.semester_no));
      console.log('Fetched entries after save:', entries); // Debug
      setEntries(entries);
    } catch (err: any) {
      console.error('Save cell failed:', err.message); // Debug
      setNotify({ type: 'error', message: err.message || 'Failed to save slot' });
    }
  };

  // Delete slot
  const onDeleteCell = async () => {
    if (!formData.entryId) return;
    try {
      console.log('Deleting entry:', formData.entryId); // Debug
      await deleteEntry(formData.entryId);
      setShowEdit(false);
      setNotify({ type: 'success', message: 'Deleted.' });
      const entries = await fetchEntries(Number(selectedTimetable!.batch_id), Number(selectedTimetable!.semester_no));
      console.log('Fetched entries after delete:', entries); // Debug
      setEntries(entries);
    } catch (err: any) {
      console.error('Delete cell failed:', err.message); // Debug
      setNotify({ type: 'error', message: err.message || 'Failed to delete slot' });
    }
  };

  // Theming
  const bg = theme === 'light' ? 'bg-white' : 'bg-[#3F3D56]';
  const bc = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const tc = theme === 'light' ? 'text-[#333]' : 'text-[#E5E5E5]';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Timetable Management</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => setShowCreate(true)}
        >
          Create Timetable
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <SelectInput
            label="Department"
            options={[{ value: '', label: 'All Departments' }, ...deptOpts]}
            value={deptSel}
            onChange={e => setDeptSel(e.target.value)}
          />
          <SelectInput
            label="Section"
            options={[{ value: '', label: 'All Sections' }, ...sectOpts]}
            value={sectSel}
            onChange={e => setSectSel(e.target.value)}
          />
          <SelectInput
            label="Semester"
            options={[{ value: '', label: 'All Semesters' }, ...semOpts]}
            value={semSel}
            onChange={e => setSemSel(e.target.value)}
          />
        </div>
      </Card>

      {/* Timetable List */}
      <Card>
        <div className="flex items-center mb-4">
          <List size={20} className="mr-2" />
          <h2 className="text-lg font-semibold">Available Timetables</h2>
        </div>
        {timetables.length === 0 ? (
          <p className="text-gray-500">No timetables available.</p>
        ) : (
          <div className="space-y-2">
            {timetables.map(t => (
              <div
                key={`${t.batch_id}-${t.semester_no}`}
                className={`flex justify-between items-center p-3 rounded-lg ${selectedTimetable?.batch_id === String(t.batch_id) && selectedTimetable?.semester_no === String(t.semester_no) ? 'bg-blue-100' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                <span
                  className="cursor-pointer"
                  onClick={() => handleSelectTimetable(t)}
                >
                  {t.department_name} - {t.batch_name} - Semester {t.semester_no}
                </span>
                <Button
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleDeleteTimetable(t.batch_id, t.semester_no)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Timetable Grid */}
      {selectedTimetable && (
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
                {periods.length === 0 && (
                  <tr>
                    <td colSpan={weekDays.length + 1} className="py-4 text-center text-gray-500">
                      No periods defined.
                    </td>
                  </tr>
                )}
                {periods.map((p, idx) => (
                  <tr key={p.id} className={`${bc} border-b`}>
                    <td className={`py-4 px-4 ${tc}`}>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2" />
                        {p.name}
                        <span className="ml-2 text-xs text-gray-400">{p.time}</span>
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const slot = schedule[day][idx];
                      return (
                        <td key={`${day}-${idx}`} className="py-4 px-4">
                          <div
                            className={
                              slot.subject
                                ? `${bg} p-3 rounded-lg shadow-sm cursor-pointer`
                                : 'h-20 flex items-center justify-center border-2 border-dashed rounded-lg border-gray-200 cursor-pointer'
                            }
                            onClick={() => openCell(day, idx)}
                          >
                            {slot.subject ? (
                              <>
                                <div className={`font-medium ${tc}`}>{slot.subject}</div>
                                <div className="text-sm text-gray-500">{slot.faculty}</div>
                                <div className="text-xs text-gray-400">{slot.time}</div>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">No class</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create-Timetable Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreateDeptSel('');
          setCreateSectSel('');
          setCreateSemSel('');
          setNumPeriods(6);
          setTimes([]);
        }}
        title="Create Timetable"
        footer={
          <Button variant="primary" onClick={handleCreateTimetable}>
            Save Timetable
          </Button>
        }
      >
        <SelectInput
          label="Department"
          options={[{ value: '', label: 'Select Department' }, ...createDeptOpts]}
          value={createDeptSel}
          onChange={e => setCreateDeptSel(e.target.value)}
        />
        <SelectInput
          label="Section"
          options={[{ value: '', label: 'Select Section' }, ...createSectOpts]}
          value={createSectSel}
          onChange={e => setCreateSectSel(e.target.value)}
        />
        <SelectInput
          label="Semester"
          options={[{ value: '', label: 'Select Semester' }, ...createSemOpts]}
          value={createSemSel}
          onChange={e => setCreateSemSel(e.target.value)}
        />
        <Input
          type="number"
          label="Number of Periods"
          value={String(numPeriods)}
          onChange={e => setNumPeriods(Number(e.target.value))}
          min="1"
        />
        <div className="space-y-2 mt-4">
          {times.map((t, i) => (
            <Input
              key={i}
              label={`Period ${i + 1} time (HH:MM-HH:MM)`}
              placeholder="09:00-10:00"
              value={t}
              onChange={e => {
                const arr = [...times];
                arr[i] = e.target.value;
                setTimes(arr);
              }}
            />
          ))}
        </div>
      </Modal>

      {/* Edit/Create Slot Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title={modalMode === 'edit' ? 'Edit Slot' : 'Create Slot'}
        footer={
          <div className="flex justify-between w-full">
            {modalMode === 'edit' && (
              <Button variant="danger" icon={<Trash2 size={14} />} onClick={onDeleteCell}>
                Delete
              </Button>
            )}
            <Button variant="primary" icon={<Edit size={14} />} onClick={onSaveCell}>
              {modalMode === 'edit' ? 'Save' : 'Create'}
            </Button>
          </div>
        }
      >
        <SelectInput
          label="Subject"
          options={[{ value: '', label: 'Select Subject' }, ...subjectOpts]}
          value={formData.subjectId}
          onChange={e => setFormData(f => ({ ...f, subjectId: e.target.value }))}
        />
        <SelectInput
          label="Faculty"
          options={[{ value: '', label: 'Select Faculty' }, ...facultyOpts]}
          value={formData.facultyId}
          onChange={e => setFormData(f => ({ ...f, facultyId: e.target.value }))}
        />
      </Modal>

      {/* Notification */}
      <Modal
        isOpen={!!notify}
        onClose={() => setNotify(null)}
        title={notify?.type === 'success' ? 'Success' : 'Error'}
        footer={<Button variant="primary" onClick={() => setNotify(null)}>OK</Button>}
      >
        <p>{notify?.message}</p>
      </Modal>
    </div>
  );
};

export default TimetablePage;