import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users/';

// Register user
const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  if (response.data) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userRole', response.data.role);
  }
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userRole', response.data.role);
  }
  return response.data;
};

const authService = {
  register,
  login
};

export default authService;
