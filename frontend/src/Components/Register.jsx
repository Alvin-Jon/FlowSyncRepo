import { MdEmail } from 'react-icons/md'; 
import { AiOutlineEyeInvisible, AiOutlineEye } from 'react-icons/ai';
import { FaUser } from 'react-icons/fa';
import { Cpu } from 'lucide-react';
import { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const Register = ({setOtpEmail}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [username, setUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate()
  

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setErrorMessage('You must accept the terms and conditions.');
      return;
    }

    try {
      const user = {
        username,
        email,
        password,
        deviceId
      };

      const response = await api.post('auth/register', user);

      // Handle successful response
      if (response.status === 200 || response.status === 201) {
        setSuccessMessage('Registration successful! Please log in.');
        navigate('/login');
        setOtpEmail(email);
        setErrorMessage('');
        await api.post('auth/send-email-registered', {email:email})
      } 
    } catch (err) {
      // Handle errors
      setErrorMessage(err.response.data.message)
    }
  };

  return (
    <form className="login-form register-form" onSubmit={handleRegister}>
      <h1>Register</h1>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      <div>
        <input
          type="text"
          placeholder=" "
          required
          maxLength={40}
          minLength={6}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          name='username'
        />
        <label>Username</label>
        <FaUser size={24} color="#555" className="log-icon" />
      </div>

      <div>
        <input
          type="email"
          placeholder=" "
          required
          maxLength={40}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          name='email'
        />
        <label>Email</label>
        <MdEmail size={24} color="#555" className="log-icon" />
      </div>

      <div>
        <input
          type={passwordVisible ? 'text' : 'password'}
          required
          placeholder=" "
          maxLength={35}
          value={password}
          minLength={5}
          onChange={(e) => setPassword(e.target.value)}
          name='password'
        />
        <label>Password</label>
        {passwordVisible ? (
          <AiOutlineEye
            className="log-icon"
            size={24}
            color="#555"
            onClick={togglePasswordVisibility}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <AiOutlineEyeInvisible
            className="log-icon"
            size={24}
            color="#555"
            onClick={togglePasswordVisibility}
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder=""
          required
          maxLength={40}
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          name='deviceId'
        />
        <label>DeviceId</label>
        <Cpu size={24} color="#555" className="log-icon" />
      </div>

      <label className="terms">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
        />{' '}
        I agree to the terms & conditions
      </label>

      <button type="submit">
        Register
      </button>
      <p className="register">
        Already have an account? <a href="login">Login</a>
      </p>
    </form>
  );
};



export default Register;
