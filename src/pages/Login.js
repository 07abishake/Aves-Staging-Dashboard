// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logo from '../components/Images/Logo.png';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [invalidInput, setInvalidInput] = useState(false);



    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            setInvalidInput(true);
            setError('Both fields are required.');
            return;
        }

        try {
            const response = await axios.post(
                'https://api.avessecurity.com/api/auth/login',
                { email, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const { token } = response.data;
            if (token) {
                const decoded = jwtDecode(token);
                const { email, name, OrganizationId } = decoded;

                localStorage.setItem('access_token', token);
                localStorage.setItem('email', email);
                localStorage.setItem('name', name);
                localStorage.setItem('OrganizationId', OrganizationId);

                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed.');
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="Signin text-center" style={{ maxWidth: '448px', width: '100%' }}>
                <img src={logo} alt="Logo" className="logo" style={{ width: '200px', height: '100px' }} />
                <h3 className="fw-bold">Admin Portal</h3>
                <p className="text-muted">Sign in to your account</p>
                <div className="card p-2 mt-4 b-shad">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group text-start mb-2">
                                <label className="label text-black mb-1 fw-bold" htmlFor="email">Email</label>
                                <input
                                    className={`py-2 form-control mb-2 ${invalidInput ? 'is-invalid' : ''}`}
                                    type="email"
                                    id="email"
                                    placeholder="Enter Email..."
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setInvalidInput(false);
                                        setError('');
                                    }}
                                    required
                                />
                            </div>
                            <div className="form-group text-start mb-2">
                                <label className="label text-black mb-1 fw-bold" htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    className="form-control mb-2 py-2"
                                    id="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
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
