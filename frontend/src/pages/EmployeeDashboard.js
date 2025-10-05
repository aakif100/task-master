import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { formatDate } from '../utils/dateFormatter';

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [taskFiles, setTaskFiles] = useState({}); // Store files by task ID

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks/employee', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      toast.error('Error fetching tasks');
    }
  };

  const handleFileSelect = (taskId, file) => {
    setTaskFiles(prev => ({
      ...prev,
      [taskId]: file
    }));
  };

  const handleSubmitTask = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    
    // Check deadline before attempting submission
    if (new Date(task.deadline) < new Date() && task.status !== 'returned') {
      toast.error('Cannot submit task after deadline. Please contact admin for deadline extension.', {
        autoClose: 5000
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', 'submitted');
      formData.append('taskFile', taskFiles[taskId]);

      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      toast.success('Task submitted successfully');
      
      // Clear only this task's file
      setTaskFiles(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting task');
    }
  };

  const isDeadlineExceeded = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const handleSubmitAttempt = (task) => {
    if (isDeadlineExceeded(task.deadline)) {
      toast.error('Submission attempt after deadline. Please contact the admin to allow submission.', {
        autoClose: 5000
      });
      return;
    }
    handleSubmitTask(task._id);
  };

  return (
    <DashboardContainer className="glass-morphism">
      <h1>Employee Dashboard</h1>
      
      <Section>
        <h2>My Tasks</h2>
        <TaskGrid>
          {tasks.map(task => (
            <TaskCard key={task._id} className="glass-morphism">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <p>Status: {task.status}</p>
              <p>Deadline: {formatDate(task.deadline)}</p>
              {task.status === 'deadline-exceeded' && (
                <p className="deadline-exceeded">
                  Deadline exceeded. Waiting for admin to update deadline.
                </p>
              )}
              {task.status === 'pending' && (
                <div className="submission-section">
                  <input
                    type="file"
                    onChange={(e) => handleFileSelect(task._id, e.target.files[0])}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <button 
                    onClick={() => handleSubmitTask(task._id)}
                    disabled={!taskFiles[task._id]}
                  >
                    Submit Task
                  </button>
                  {isDeadlineExceeded(task.deadline) && (
                    <p className="deadline-warning">
                      ⚠️ Deadline has passed. Contact admin for submission permission.
                    </p>
                  )}
                </div>
              )}
              {task.status === 'not-submitted' && (
                <div className="not-submitted-message">
                  <p>Task was not submitted before the deadline.</p>
                  <p>Please contact the admin to request submission permission.</p>
                </div>
              )}
              {task.status === 'returned' && (
                <div className="returned-message">
                  <p>Task was returned. Please review and resubmit.</p>
                  {task.comments && task.comments.length > 0 && (
                    <div className="return-comment">
                      <p className="comment-header">Reason for Return:</p>
                      <p className="comment-text">
                        "{task.comments[task.comments.length - 1].text}"
                      </p>
                    </div>
                  )}
                  <div className="submission-section">
                    <input
                      type="file"
                      onChange={(e) => handleFileSelect(task._id, e.target.files[0])}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <button 
                      onClick={() => handleSubmitTask(task._id)}
                      disabled={!taskFiles[task._id]}
                    >
                      Resubmit Task
                    </button>
                  </div>
                </div>
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
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  .returned-message {
    margin-top: 1rem;
    padding: 0.5rem;
    background: rgba(255, 68, 68, 0.1);
    border-radius: 5px;
    
    p {
      color: var(--error);
      margin-bottom: 0.5rem;
    }

    .return-comment {
      margin: 0.5rem 0;
      padding: 0.8rem;
      background: rgba(255, 68, 68, 0.05);
      border-radius: 5px;
      
      p {
        margin: 0.25rem 0;
        color: var(--text);
        
        &.comment-header {
          color: var(--error);
          font-weight: bold;
        }

        &.comment-text {
          font-style: italic;
          padding-left: 0.5rem;
          border-left: 2px solid var(--error);
        }
      }
    }
  }

  .deadline-exceeded {
    color: var(--error);
    font-weight: bold;
    margin-top: 1rem;
  }

  .submission-section {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    input[type="file"] {
      padding: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.9);
    }
  }

  .deadline-warning {
    color: var(--error);
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }

  .not-submitted-message {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(255, 68, 68, 0.1);
    border-radius: 5px;
    text-align: center;

    p {
      color: var(--error);
      margin: 0.25rem 0;
      
      &:first-child {
        font-weight: bold;
      }
    }
  }
`;

export default EmployeeDashboard;
