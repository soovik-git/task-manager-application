import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import Pagination from '../components/Pagination';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?page=${page}&limit=9&search=${search}`);
      setTasks(res.data.data.tasks);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    // Debounce search
    const handler = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchTasks]);

  const handleSaveTask = async (taskData, id) => {
    try {
      if (id) {
        // Update
        await api.patch(`/tasks/${id}`, taskData);
      } else {
        // Create
        await api.post('/tasks', taskData);
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving task');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
      await api.patch(`/tasks/${id}`, { status });
    } catch (err) {
      // Revert on fail
      fetchTasks();
      alert('Failed to update status');
    }
  };

  const openCreateModal = () => {
    setCurrentTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  return (
    <div>
      <Navbar />
      
      <div className="container">
        <div className="dashboard-header">
          <input 
            type="text" 
            className="search-box glass-panel" 
            placeholder="Search tasks by title..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to page 1 on new search
            }}
          />
          <button className="btn-primary" onClick={openCreateModal}>
            + Create New Task
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--color-text-secondary)' }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', padding: '3rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--border-radius)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>No tasks found</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Start organizing your life by creating a task.</p>
          </div>
        ) : (
          <>
            <div className="task-grid">
              {tasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onEdit={openEditModal}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
            
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              onPageChange={setPage} 
            />
          </>
        )}
      </div>

      {isModalOpen && (
        <TaskForm 
          initialData={currentTask} 
          onSave={handleSaveTask} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
