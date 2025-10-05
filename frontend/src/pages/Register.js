import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import authService from '../features/auth/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    adminCode: ''
  });

  const [showAdminCode, setShowAdminCode] = useState(false);

  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData({ ...formData, role: newRole });
    setShowAdminCode(newRole === 'admin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        adminCode: formData.adminCode
      };

      const response = await authService.register(userData);
      if (response) {
        toast.success('Registration successful!');
        navigate(response.role === 'admin' ? '/admin' : '/employee');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <RegisterContainer>
      <FormContainer
        className="glass-morphism"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
          <select
            value={formData.role}
            onChange={handleRoleChange}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          {showAdminCode && (
            <input
              type="password"
              placeholder="Admin Access Code"
              value={formData.adminCode}
              onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
              required={formData.role === 'admin'}
            />
          )}
          
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </FormContainer>
    </RegisterContainer>
  );
};

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
`;

const FormContainer = styled(motion.div)`
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  text-align: center;

  h1 {
    margin-bottom: 2rem;
    color: var(--primary);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    input, select {
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
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.02);
      }
    }
  }

  p {
    margin-top: 1rem;
    
    a {
      color: var(--primary);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

export default Register;
