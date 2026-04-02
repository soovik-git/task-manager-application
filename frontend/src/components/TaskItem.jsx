import React from 'react';

const TaskItem = ({ task, onEdit, onDelete, onStatusChange }) => {
  return (
    <div className="task-card glass-panel">
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <span className={`task-status status-${task.status}`}>
          {task.status}
        </span>
      </div>
      <p className="task-desc">
        {task.description || <span style={{fontStyle: 'italic', color: 'rgba(255,255,255,0.3)'}}>No description provided</span>}
      </p>
      
      <div className="task-actions">
        <select 
          value={task.status} 
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          style={{ background: 'rgba(15, 23, 42, 0.8)' }}
        >
          <option value="pending">Pending</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
        <button 
          onClick={() => onEdit(task)} 
          style={{ background: 'transparent', color: 'var(--color-secondary)' }}
        >
          Edit
        </button>
        <button 
          onClick={() => {
            if(window.confirm('Are you sure you want to delete this task?')) {
              onDelete(task.id);
            }
          }} 
          style={{ background: 'transparent', color: 'var(--color-danger)' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
