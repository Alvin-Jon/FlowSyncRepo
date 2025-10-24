import { MdEmail } from 'react-icons/md';
import { AiOutlineEyeInvisible, AiOutlineEye } from 'react-icons/ai';
import { useState } from 'react';
import api from '../api/api';
import { RotatingLines } from 'react-loader-spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import {ThreeDots} from 'react-loading-icons'



const Login = ({sendNotification}) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const {setDeviceDetails, setIsAuthenticated, checkAuth} = useAuth();
    

    const navigate = useNavigate()
  
    const togglePasswordVisibility = () => {
      setPasswordVisible(!passwordVisible);
    };

    const authenticateLogin = async (e) => {
      e.preventDefault()
     if(loading) return
      try {
        setLoading(true)
        const response = await api.post('auth/login', {email, password});
        setIsAuthenticated(true);
        setDeviceDetails(response.data.user);
        checkAuth().catch(console.error);
        sendNotification('Welcome', `Thank you ${response.data.user.Username} for choosing flowsync`, 'info');
        navigate('/');
      }catch (e){
        setErrorMessage(e.response.data.message)
        console.log(e)
      } finally {
        setLoading(false)
      }
    }
  
    return (
      <form className='login-form' onSubmit={(e) => authenticateLogin(e)}>
        <h2>Welcome Back 🖐 !</h2>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div>
        <input
            type="email"
            placeholder=' '
            required
            maxLength={40}
            value={email}
            onChange={(e) =>setEmail(e.target.value)}
            name='email'
          />
          <label>Email</label>
        <MdEmail size={24} color="#555" className='log-icon'/>
        </div>
        <div>
        <input
            type={passwordVisible ? 'text' : 'password'} required placeholder=' ' maxLength={35}
            value={password} onChange={(e) => setPassword(e.target.value)} name='password'
            />
          <label>Password</label>
          {passwordVisible ? (
            <AiOutlineEye className='log-icon' size={24} color="#555" onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }} />
          ) : (
            <AiOutlineEyeInvisible className='log-icon' size={24} color="#555" onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }} />
          )}
        </div>
        <p className='forgot'><a href='login/forgot-password'>Forgot Password? </a></p>
        <button type="submit" >
          {loading ? <ThreeDots strokeColor="#fff" width="35px"/>  : 'Login'}
        </button>

        <p className='register'>Don't have an account? <a href='register'>Register</a></p>
      </form>
    );
  };
  
  export default Login;
