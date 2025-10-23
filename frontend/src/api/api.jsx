import axios from 'axios';

export default axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // Include cookies with every request
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
   'Access-Control-Allow-Origin': 'http://localhost:5173/', // remove in deployment
  },
});
