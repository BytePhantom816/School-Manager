import React, { useState, useEffect, useCallback, memo } from 'react';
import { Search, Users, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import CONFIG from '../config';

const StudentSelection = memo(({ onStudentSelect, disabled = false, allowGlobalSearch = false }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${CONFIG.API_BASE_URL}/admin/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
      }
    } catch (err) {
      setError('Failed to fetch classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch students for selected class
  const fetchStudents = useCallback(async (classId) => {
    if (!classId) return;

    try {
      setLoading(true);
      setError('');
      setPermissionStatus(null);

      const res = await fetch(`${CONFIG.API_BASE_URL}/students/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data || []);
      } else {
        setError('Failed to fetch students');
      }
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch global students by search term
  const fetchGlobalStudents = useCallback(async (term) => {
    if (!term || term.length < 3) return;
    try {
      setLoading(true);
      setError('');
      setPermissionStatus(null);
      // Assuming there is an endpoint for searching students globally or we filter locally if manageable?
      // Ideally: GET /api/students/search?q={term}
      // For now, let's assume we search within the classes we fetched or a new endpoint?
      // Let's use a hypothetical search endpoint.
      const res = await fetch(`${CONFIG.API_BASE_URL}/students/search?q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else {
        // fallback or empty
        setStudents([]);
      }
    } catch (err) {
      console.error("Global search error", err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Check student permission
  const checkPermission = useCallback(async (studentId) => {
    if (!studentId) return;

    try {
      setLoading(true);
      const res = await fetch(`${CONFIG.API_BASE_URL}/permissions/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPermissionStatus(data);
      } else {
        setPermissionStatus({ hasPermission: false, message: 'No active permission found' });
      }
    } catch (err) {
      setPermissionStatus({ hasPermission: false, message: 'Error checking permission' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initialize
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Handle class change
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedStudent('');
    setPermissionStatus(null);
    setError('');
    fetchStudents(classId);
  };

  // Handle student change
  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);
    setPermissionStatus(null);
    setError('');

    if (studentId) {
      checkPermission(studentId);
      // Find student details
      const student = students.find(s => s.id == studentId);
      if (student && onStudentSelect) {
        onStudentSelect(student);
      }
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Users size={24} color="var(--primary-color)" />
          Student Permission Check
        </h3>
      </div>

      {error && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--error-color)',
          marginBottom: 'var(--spacing-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        {/* Class Selection - Optional if Global Search is allowed */}
        <div className="input-group">
          <label className="input-label">Select Class {allowGlobalSearch && '(Optional for Global Search)'}</label>
          <select
            className="select-field"
            value={selectedClass}
            onChange={handleClassChange}
            disabled={disabled || loading}
          >
            <option value="">{allowGlobalSearch ? 'All Classes (Global Search)' : 'Choose a class...'}</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Global Search Input (Active when no class selected and global allowed) */}
        {allowGlobalSearch && !selectedClass && (
          <div className="input-group">
            <label className="input-label">Global Search (Name, Roll No, or ID)</label>
            <div style={{ position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: 'var(--spacing-md)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)'
                }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Enter Name, Roll No, or Student ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Trigger global search here if needed, or debounced
                  if (e.target.value.length > 2) fetchGlobalStudents(e.target.value);
                }}
                style={{ paddingLeft: 'calc(var(--spacing-lg) + 24px)' }}
                disabled={disabled || loading}
              />
            </div>
            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Enter at least 3 characters to search.</p>
            )}
          </div>
        )}

        {/* Student Selection with Search (Class Selected) */}
        {selectedClass && (
          <>
            <div className="input-group">
              <label className="input-label">Search Student in Class</label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={20}
                  style={{
                    position: 'absolute',
                    left: 'var(--spacing-md)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)'
                  }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Filter by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 'calc(var(--spacing-lg) + 24px)' }}
                  disabled={disabled || loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Select Student</label>
              <select
                className="select-field"
                value={selectedStudent}
                onChange={handleStudentChange}
                disabled={disabled || loading}
              >
                <option value="">Choose a student...</option>
                {filteredStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.roll_no}) - House: {student.house || 'NONE'}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Global Search Results List */}
        {allowGlobalSearch && !selectedClass && students.length > 0 && (
          <div className="input-group">
            <label className="input-label">Search Results</label>
            <div style={{
              maxHeight: '250px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--glass-bg)',
            }}>
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => {
                    // Simulate event object for handleStudentChange
                    handleStudentChange({ target: { value: student.id } });
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--spacing-md)',
                    background: selectedStudent == student.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    color: selectedStudent == student.id ? 'var(--primary-color)' : 'var(--text-main)',
                    border: 'none',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'block'
                  }}
                  className="hover:bg-white/5"
                >
                  <div style={{ fontWeight: '600' }}>{student.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Roll: {student.roll_no} • Class: {student.class_name || 'N/A'} • ID: {student.student_id_number}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Permission Status Display */}
        {permissionStatus && (
          <div style={{
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${permissionStatus.hasPermission ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            background: permissionStatus.hasPermission ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            animation: 'slideDown 0.3s ease-out'
          }}>
            {permissionStatus.hasPermission ? (
              <>
                <CheckCircle size={24} color="var(--primary-color)" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--primary-color)', marginBottom: 'var(--spacing-xs)' }}>
                        Permission Valid
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        {permissionStatus.permission?.student_name && <div style={{ fontWeight: 'bold' }}>{permissionStatus.permission.student_name}</div>}
                        {permissionStatus.permission?.reason && <div>Reason: {permissionStatus.permission.reason}</div>}
                        {permissionStatus.permission?.destination && <div>Destination: {permissionStatus.permission.destination}</div>}
                        {permissionStatus.permission?.valid_until && <div>Valid until: {new Date(permissionStatus.permission.valid_until).toLocaleString()}</div>}
                      </div>
                    </div>
                    {permissionStatus.permission?.photo_url && (
                      <img
                        src={permissionStatus.permission.photo_url.startsWith('http') ? permissionStatus.permission.photo_url : `${CONFIG.API_BASE_URL}${permissionStatus.permission.photo_url}`}
                        alt="Student"
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <XCircle size={24} color="var(--error-color)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--error-color)', marginBottom: 'var(--spacing-xs)' }}>
                    No Active Permission
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: 'var(--spacing-sm)' }}>
                    {permissionStatus.message}
                  </div>
                  {onStudentSelect && selectedStudent && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const student = students.find(s => s.id == selectedStudent);
                        if (student) onStudentSelect(student);
                      }}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Issue Pass
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-xl)',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--primary-color)' }}>
              <Loader2 size={20} className="animate-spin" />
              Loading...
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

StudentSelection.displayName = 'StudentSelection';

export default StudentSelection;