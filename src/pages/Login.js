// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import logo from '../components/Images/Logo.svg'

// const Login = () => {
//     const navigate = useNavigate();
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [invalidEmail, setInvalidEmail] = useState(false); // State to track invalid email

//     // Email validation function
//     const validateEmail = (email) => {
//         const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         return re.test(String(email).toLowerCase());
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         // Check email validation before proceeding
//         if (!validateEmail(email)) {
//             setInvalidEmail(true);
//             setError('Invalid email format. Please check and try again.');
//             return;
//         }

//         try {
//             const response = await axios.post(`/admin/login`, { email, password });

//             // Handle successful login
//             if (response.status === 200) {
//                 const { token } = response.data;

//                 // Save the token to localStorage (or any state management solution)
//                 localStorage.setItem('adminToken', token);

//                 // Navigate to admin dashboard  
//                 navigate('/dashboard');
//             }
//         } catch (err) {
//             // Handle error response
//             if (err.response) {
//                 const { status, data } = err.response;
//                 if (status === 409) {
//                     setError(data.message); // Admin not found
//                 } else if (status === 401) {
//                     setError(data.message); // Wrong password
//                 } else {
//                     setError('Something went wrong. Please try again later.');
//                 }
//             } else {
//                 setError('Network error. Please try again.');
//             }
//         }
//     };

//     return (
//         <div className="d-flex justify-content-center align-items-center" style={
//             {
//                 height: '100vh',
//             }
//         }>
//             <div className="Signin text-center" style={{ maxWidth: '448px', width: '100%' }}>
//                 {/* <img
//                     src="https://imagedelivery.net/r89jzjNfZziPHJz5JXGOCw/1dd59d6a-7b64-49d7-ea24-1366e2f48300/public"
//                     alt="Logo"
//                     className="d-block m-auto"
//                     style={{ width: '100px' }}
//                 /> */}
//                 <img src={logo} alt="Logo" className="logo" />
//                 <h3 className="fw-bold">Admin Portal</h3>
//                 <p className="text-muted">Sign in to your account</p>
//                 <div className="card p-2 mt-4 b-shad">
//                     <div className="card-body">

//                         <form onSubmit={handleSubmit}>
//                             <div className="form-group text-start mb-2">
//                                 <label className="label text-black mb-1 fw-bold" htmlFor="email">
//                                     Email
//                                 </label>
//                                 <input
//                                     className={`py-2 form-control mb-2 ${invalidEmail ? 'is-invalid' : ''}`}
//                                     type="email"
//                                     id="email"
//                                     name="email"
//                                     placeholder="Enter Email Address..."
//                                     value={email}
//                                     onChange={(e) => {
//                                         setEmail(e.target.value);
//                                         setInvalidEmail(false); // Reset invalid email state
//                                         setError(''); // Clear error
//                                     }}
//                                     required
//                                 />
//                                 {invalidEmail && <div className="invalid-feedback">Invalid email format</div>}
//                             </div>
//                             <div className="form-group position-relative text-start mb-2">
//                                 <label className="label text-black mb-1 fw-bold" htmlFor="password">
//                                     Password
//                                 </label>
//                                 <input
//                                     type="password"
//                                     placeholder="Enter password"
//                                     className="form-control mb-2 py-2"
//                                     id="password"
//                                     name="password"
//                                     value={password}
//                                     onChange={(e) => setPassword(e.target.value)}
//                                     required
//                                 />
//                             </div>
//                             <div className='d-flex justify-content-between mb-2'>
//                                 <div>
//                                     <input type="checkbox" /> Remember me
//                                 </div>
//                                 <div>
//                                     <a href="#">Forgot Password?</a>
//                                 </div>
//                             </div>
//                             <button type="submit" className="loginBtn px-3 py-2 mt-3 w-100 border-0 rounded" >
//                                 Sign in
//                             </button>
//                             {error && <p className="text-danger mt-2">{error}</p>}
//                         </form>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../components/Images/Logo.svg';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [invalidInput, setInvalidInput] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            navigate('/dashboard', { replace: true }); // Redirect to dashboard if logged in
        }
    }, [navigate]);
    // Check if input is an email
    const isEmail = (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (emailOrUsername.trim() === '' || password.trim() === '') {
            setInvalidInput(true);
            setError('Both fields are required.');
            return;
        }

        try {
            const payload = {
                [isEmail(emailOrUsername) ? "email" : "username"]: emailOrUsername,
                password,
            };

            const headers = {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Access-Control-Allow-Origin": "*",
            };

            const response = await axios.post(`https://api.avessecurity.com/api/users/Signin`, payload, { headers });

            if (response.data.success) {
                const { token, username } = response.data;

                localStorage.setItem("access_token", token);
                localStorage.setItem("username", username);

                // onLogin(token); // Notify parent component
                navigate('/dashboard');
            } else {
                setError('Login failed. Please check your details.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="Signin text-center" style={{ maxWidth: '448px', width: '100%' }}>
                <img src={logo} alt="Logo" className="logo" />
                <h3 className="fw-bold">Admin Portal</h3>
                <p className="text-muted">Sign in to your account</p>
                <div className="card p-2 mt-4 b-shad">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group text-start mb-2">
                                <label className="label text-black mb-1 fw-bold" htmlFor="emailOrUsername">
                                    Email or Username
                                </label>
                                <input
                                    className={`py-2 form-control mb-2 ${invalidInput ? 'is-invalid' : ''}`}
                                    type="text"
                                    id="emailOrUsername"
                                    name="emailOrUsername"
                                    placeholder="Enter Email or Username..."
                                    value={emailOrUsername}
                                    onChange={(e) => {
                                        setEmailOrUsername(e.target.value);
                                        setInvalidInput(false);
                                        setError('');
                                    }}
                                    required
                                />
                            </div>
                            <div className="form-group text-start mb-2">
                                <label className="label text-black mb-1 fw-bold" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="form-control mb-2 py-2"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='d-flex justify-content-between mb-2'>
                                <div>
                                    <input type="checkbox" /> Remember me
                                </div>
                                <div>
                                    <a href="#">Forgot Password?</a>
                                </div>
                            </div>
                            <button type="submit" className="loginBtn px-3 py-2 mt-3 w-100 border-0 rounded">
                                Sign in
                            </button>
                            {error && <p className="text-danger mt-2">{error}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
