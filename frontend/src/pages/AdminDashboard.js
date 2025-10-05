import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { formatDate } from '../utils/dateFormatter';

const AdminDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: ''
  });
  const [editingTask, setEditingTask] = useState(null);
  const [returnComments, setReturnComments] = useState({}); // Store comments by task ID

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      toast.error('Error fetching tasks');
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      toast.error('Error fetching employees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/tasks', newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Task created successfully');
      fetchTasks();
      setNewTask({ title: '', description: '', assignedTo: '', deadline: '' });
    } catch (error) {
      toast.error('Error creating task');
    }
  };

  const handleStatusUpdate = async (taskId, status, comment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}/status`, 
        { status, comment },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Task updated successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Task deleted successfully');
        fetchTasks();
      } catch (error) {
        toast.error('Error deleting task');
      }
    }
  };

  const handleUpdate = async (task) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${task._id}`,
        editingTask,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Task updated successfully');
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const handleUpdateDeadline = async (taskId, newDeadline) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`,
        { deadline: newDeadline },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Deadline updated successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Error updating deadline');
    }
  };

  const handleFileDownload = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/tasks/${taskId}/file`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'download';

      const url = window.URL.createObjectURL(new Blob([response.data], { 
        type: response.headers['content-type'] 
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Error downloading file');
    }
  };

  const handleReturnTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}/status`,
        { 
          status: 'returned',
          comment: returnComments[taskId] || '' 
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('Task returned to employee');
      
      // Clear only this task's comment
      setReturnComments(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      
      fetchTasks();
    } catch (error) {
      toast.error('Error returning task');
    }
  };

  return (
    <DashboardContainer className="glass-morphism">
      <h1>Admin Dashboard</h1>
      
      <Section>
        <h2>Create New Task</h2>
        <Form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
          />
          <select
            value={newTask.assignedTo}
            onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={newTask.deadline}
            onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
          />
          <button type="submit">Create Task</button>
        </Form>
      </Section>

      <Section>
        <h2>All Tasks</h2>
        <TaskGrid>
          {tasks.map(task => (
            <TaskCard key={task._id} className="glass-morphism">
              {editingTask?.id === task._id ? (
                <EditForm onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(task);
                }}>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  />
                  <textarea
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  />
                  <input
                    type="datetime-local"
                    value={editingTask.deadline}
                    onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value})}
                  />
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingTask(null)}>Cancel</button>
                </EditForm>
              ) : (
                <>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  <p>Assigned to: {task.assignedTo.name}</p>
                  <p>Status: {task.status}</p>
                  <p>Deadline: {formatDate(task.deadline)}</p>
                  
                  {task.status === 'deadline-exceeded' && (
                    <DeadlineUpdate>
                      <input
                        type="datetime-local"
                        onChange={(e) => handleUpdateDeadline(task._id, e.target.value)}
                      />
                      <button>Update Deadline</button>
                    </DeadlineUpdate>
                  )}

                  {task.status === 'submitted' && (
                    <div className="submission-actions">
                      <button onClick={() => handleFileDownload(task._id)}>
                        Download Submission
                      </button>
                      <button onClick={() => handleStatusUpdate(task._id, 'completed')}>
                        Approve
                      </button>
                      <div className="return-section">
                        <textarea
                          placeholder="Enter reason for return (optional)"
                          value={returnComments[task._id] || ''}
                          onChange={(e) => setReturnComments(prev => ({
                            ...prev,
                            [task._id]: e.target.value
                          }))}
                        />
                        <button onClick={() => handleReturnTask(task._id)}>
                          Return Task
                        </button>
                      </div>
                    </div>
                  )}

                  <ActionButtons>
                    <button onClick={() => setEditingTask({
                      id: task._id,
                      title: task.title,
                      description: task.description,
                      deadline: task.deadline
                    })}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(task._id)}>Delete</button>
                  </ActionButtons>
                </>
              )}
            </TaskCard>
          ))}
        </TaskGrid>
      </Section>
    </DashboardContainer>
  );
};

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 2rem auto;
`;

const Section = styled.section`
  margin: 2rem 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
  margin: 1rem 0;

  input, select, textarea {
    padding: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.9);
  }

  button {
    padding: 0.8rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
`;

const TaskGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const TaskCard = styled.div`
  padding: 1rem;
  border-radius: 10px;

  h3 {
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0.5rem 0;
  }

  button {
    margin: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    
    &:first-child {
      background: var(--success);
      color: white;
    }

    &:last-child {
      background: var(--error);
      color: white;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  
  button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    
    &:first-child {
      background: var(--primary);
      color: white;
    }
    
    &:last-child {
      background: var(--error);
      color: white;
    }
  }
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  input, textarea {
    padding: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 5px;
  }

  button {
    padding: 0.5rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    
    &:first-of-type {
      background: var(--success);
      color: white;
    }
    
    &:last-of-type {
      background: var(--error);
      color: white;
    }
  }
`;

const DeadlineUpdate = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 5px;

  input {
    padding: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 5px;
  }

  button {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 5px;
    padding: 0.5rem;
    cursor: pointer;
  }
`;

const ReturnSection = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 5px;

  textarea {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 5px;
    min-height: 60px;
  }

  button {
    width: 100%;
    background: var(--error);
  }
`;

export default AdminDashboard;
