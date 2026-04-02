import React, { useState, useEffect } from 'react';

const TaskForm = ({ onSave, initialData, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setStatus(initialData.status);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (title.length < 3) {
      return setError('Title must be at least 3 characters long');
    }

    onSave({ title, description, status }, initialData?.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-msg" style={{marginBottom: '1rem'}}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="E.g., Complete project presentation"
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Optional details..."
              rows="4"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button type="submit" className="btn-primary">Save Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
