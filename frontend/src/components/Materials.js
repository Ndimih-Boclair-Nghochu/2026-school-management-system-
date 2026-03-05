import React, { useMemo, useState } from 'react';
import './Materials.css';

const CLASS_OPTIONS = ['All Classes', 'Grade 4 Science', 'Grade 5 Math', 'Grade 6 English', 'Grade 7 History'];
const SUBJECT_OPTIONS = ['All Subjects', 'Science', 'Math', 'English', 'History'];
const TYPE_OPTIONS = ['All Types', 'Notes', 'Worksheet', 'Slides', 'Past Paper', 'Guide'];
const FORMAT_OPTIONS = ['PDF', 'DOCX', 'PPT', 'XLSX', 'TXT', 'ZIP', 'JPG', 'PNG'];

const DEFAULT_TEACHER = {
  name: 'John Smith',
  role: 'Grade 5 Math Teacher',
  avatar: 'https://via.placeholder.com/40'
};

const initialMaterials = [
  { id: 1, title: 'Algebra Formula Sheet', className: 'Grade 5 Math', subject: 'Math', type: 'Notes', format: 'PDF', size: '1.2 MB', updatedAt: '2026-03-05', published: true, uploadedBy: DEFAULT_TEACHER, fileName: 'algebra_formula_sheet.pdf' },
  { id: 2, title: 'Essay Structure Template', className: 'Grade 6 English', subject: 'English', type: 'Guide', format: 'DOCX', size: '860 KB', updatedAt: '2026-03-04', published: true, uploadedBy: DEFAULT_TEACHER, fileName: 'essay_template.docx' },
  { id: 3, title: 'Science Lab Slides', className: 'Grade 4 Science', subject: 'Science', type: 'Slides', format: 'PPT', size: '3.6 MB', updatedAt: '2026-03-03', published: true, uploadedBy: DEFAULT_TEACHER, fileName: 'science_lab_slides.ppt' },
  { id: 4, title: 'Mid-Term Past Questions', className: 'Grade 7 History', subject: 'History', type: 'Past Paper', format: 'PDF', size: '2.1 MB', updatedAt: '2026-03-02', published: true, uploadedBy: DEFAULT_TEACHER, fileName: 'mid_term_past_questions.pdf' },
  { id: 5, title: 'Class Practice Worksheet', className: 'Grade 5 Math', subject: 'Math', type: 'Worksheet', format: 'XLSX', size: '740 KB', updatedAt: '2026-03-01', published: true, uploadedBy: DEFAULT_TEACHER, fileName: 'class_practice_worksheet.xlsx' },
  { id: 6, title: 'Reading Comprehension Pack', className: 'Grade 6 English', subject: 'English', type: 'Notes', format: 'ZIP', size: '5.4 MB', updatedAt: '2026-02-28', published: true, uploadedBy: DEFAULT_TEACHER, fileName: 'reading_comprehension_pack.zip' }
];

const formatAcronym = (format) => (format || '').toUpperCase().slice(0, 4);

const getFormatFromFileName = (fileName = '') => {
  const ext = fileName.split('.').pop().toUpperCase();
  if (FORMAT_OPTIONS.includes(ext)) return ext;
  return 'PDF';
};

const getReadableFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const Materials = () => {
  const [materials, setMaterials] = useState(initialMaterials);
  const [classFilter, setClassFilter] = useState('All Classes');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [search, setSearch] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newClass, setNewClass] = useState('Grade 5 Math');
  const [newSubject, setNewSubject] = useState('Math');
  const [newType, setNewType] = useState('Notes');
  const [newFormat, setNewFormat] = useState('PDF');
  const [newFile, setNewFile] = useState(null);
  const [editingMaterialId, setEditingMaterialId] = useState(null);

  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials.filter((item) => {
      const classOk = classFilter === 'All Classes' || item.className === classFilter;
      const subjectOk = subjectFilter === 'All Subjects' || item.subject === subjectFilter;
      const typeOk = typeFilter === 'All Types' || item.type === typeFilter;
      const searchOk = !q
        || item.title.toLowerCase().includes(q)
        || item.format.toLowerCase().includes(q)
        || item.subject.toLowerCase().includes(q)
        || (item.fileName || '').toLowerCase().includes(q);
      return classOk && subjectOk && typeOk && searchOk;
    });
  }, [materials, classFilter, subjectFilter, typeFilter, search]);

  const resetForm = () => {
    setNewTitle('');
    setNewClass('Grade 5 Math');
    setNewSubject('Math');
    setNewType('Notes');
    setNewFormat('PDF');
    setNewFile(null);
    setEditingMaterialId(null);
  };

  const handleSelectedFile = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setNewFile(file);
    setNewFormat(getFormatFromFileName(file.name));
  };

  const saveMaterial = () => {
    const title = newTitle.trim();
    if (!title) {
      alert('Please enter a material title.');
      return;
    }

    if (!editingMaterialId && !newFile) {
      alert('Please upload a file or document before publishing.');
      return;
    }

    if (editingMaterialId) {
      setMaterials((prev) => prev.map((item) => {
        if (item.id !== editingMaterialId) return item;
        return {
          ...item,
          title,
          className: newClass,
          subject: newSubject,
          type: newType,
          format: newFile ? getFormatFromFileName(newFile.name) : newFormat,
          size: newFile ? getReadableFileSize(newFile.size) : item.size,
          fileName: newFile ? newFile.name : item.fileName,
          file: newFile || item.file,
          updatedAt: new Date().toISOString().slice(0, 10),
          published: item.published,
          uploadedBy: item.uploadedBy || DEFAULT_TEACHER
        };
      }));

      resetForm();
      alert('Material updated successfully.');
      return;
    }

    const nextMaterial = {
      id: Date.now(),
      title,
      className: newClass,
      subject: newSubject,
      type: newType,
      format: newFormat,
      size: newFile ? getReadableFileSize(newFile.size) : '0 KB',
      fileName: newFile ? newFile.name : '',
      file: newFile,
      published: true,
      uploadedBy: DEFAULT_TEACHER,
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    setMaterials((prev) => [nextMaterial, ...prev]);
    resetForm();
    alert('Material uploaded and published successfully.');
  };

  const startEditMaterial = (material) => {
    setEditingMaterialId(material.id);
    setNewTitle(material.title);
    setNewClass(material.className);
    setNewSubject(material.subject);
    setNewType(material.type);
    setNewFormat(material.format);
    setNewFile(null);
  };

  const deleteMaterial = (id) => {
    setMaterials((prev) => prev.filter((item) => item.id !== id));
    if (editingMaterialId === id) resetForm();
  };

  const togglePublishMaterial = (id) => {
    setMaterials((prev) => prev.map((item) => (
      item.id === id ? { ...item, published: !item.published, updatedAt: new Date().toISOString().slice(0, 10) } : item
    )));
  };

  const downloadMaterial = (material) => {
    let blob;
    let fileName;

    if (material.file) {
      blob = material.file;
      fileName = material.fileName || `${material.title.replace(/\s+/g, '_')}.${material.format.toLowerCase()}`;
    } else {
      const content = `Material: ${material.title}\nClass: ${material.className}\nSubject: ${material.subject}\nType: ${material.type}\nFormat: ${material.format}\nGenerated for student download.`;
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      fileName = `${material.title.replace(/\s+/g, '_')}.${material.format.toLowerCase()}`;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="materials-root">
      <div className="materials-header">
        <h2>Learning Materials</h2>
        <p>Organize notes, worksheets, slides and downloadable documents for students by class and subject.</p>
      </div>

      <section className="materials-card upload-card">
        <h3>{editingMaterialId ? 'Edit Material' : 'Upload / Publish Material'}</h3>
        <div className="upload-grid">
          <div className="field">
            <label>Title</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Quadratic Equations Notes" />
          </div>
          <div className="field">
            <label>Class</label>
            <select value={newClass} onChange={(e) => setNewClass(e.target.value)}>
              {CLASS_OPTIONS.slice(1).map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Subject</label>
            <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)}>
              {SUBJECT_OPTIONS.slice(1).map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Type</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {TYPE_OPTIONS.slice(1).map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Format</label>
            <select value={newFormat} onChange={(e) => setNewFormat(e.target.value)}>
              {FORMAT_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field file-upload-field">
            <label>File / Document</label>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt,.zip,.jpg,.jpeg,.png" onChange={handleSelectedFile} />
            <small>{newFile ? `${newFile.name} (${getReadableFileSize(newFile.size)})` : editingMaterialId ? 'Select a new file to replace the current one (optional).' : 'Upload a file before publishing.'}</small>
          </div>
        </div>
        <div className="form-actions">
          <button className="primary-btn" onClick={saveMaterial}>{editingMaterialId ? 'Save Changes' : 'Publish Material'}</button>
          {editingMaterialId && <button className="secondary-btn" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </section>

      <section className="materials-card">
        <div className="materials-tools">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials..." />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>{CLASS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>{SUBJECT_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>{TYPE_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select>
        </div>

        <div className="materials-grid">
          {filteredMaterials.map((material) => (
            <article key={material.id} className={`material-item-card ${material.published ? '' : 'unpublished'}`}>
              <div className="material-top">
                <div className="format-badge">{formatAcronym(material.format)}</div>
                <div>
                  <h4>{material.title}</h4>
                  <p>{material.className} • {material.subject}</p>
                </div>
              </div>

              <div className="meta-row">
                <span>{material.type}</span>
                <span>{material.size}</span>
                <span>Updated: {material.updatedAt}</span>
                <span className={material.published ? 'status-chip live' : 'status-chip muted'}>{material.published ? 'Published' : 'Unpublished'}</span>
              </div>

              <div className="teacher-row">
                <img src={material.uploadedBy?.avatar || DEFAULT_TEACHER.avatar} alt={material.uploadedBy?.name || DEFAULT_TEACHER.name} />
                <div>
                  <strong>{material.uploadedBy?.name || DEFAULT_TEACHER.name}</strong>
                  <p>{material.uploadedBy?.role || DEFAULT_TEACHER.role}</p>
                </div>
              </div>

              {material.fileName && <p className="file-name">{material.fileName}</p>}

              <div className="material-actions action-grid">
                <button className="secondary-btn" onClick={() => downloadMaterial(material)}>Download</button>
                <button className="secondary-btn" onClick={() => startEditMaterial(material)}>Edit</button>
                <button className="secondary-btn" onClick={() => togglePublishMaterial(material.id)}>{material.published ? 'Unpublish' : 'Publish'}</button>
                <button className="danger-btn" onClick={() => deleteMaterial(material.id)}>Delete</button>
              </div>
            </article>
          ))}

          {filteredMaterials.length === 0 && <p className="empty">No materials match your filter.</p>}
        </div>
      </section>
    </div>
  );
};

export default Materials;
