import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import logo from '../components/Images/Logo.png';
import { Form, Button, InputGroup } from 'react-bootstrap'; // Import React-Bootstrap components

const Login = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [invalidInput, setInvalidInput] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim() || !password.trim()) {
            setInvalidInput(true);
            setError('Both fields are required.');
            return;
        }

        try {
            const response = await axios.post(
                'https://api.avessecurity.com/api/auth/login',
                { name, password },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const { token } = response.data;

            if (token) {
                const decoded = jwtDecode(token);
                const { email, name, OrganizationId, planId } = decoded;

                localStorage.setItem('access_token', token);
                localStorage.setItem('email', email || '');
                localStorage.setItem('name', name || '');
                localStorage.setItem('OrganizationId', OrganizationId || '');

                if (planId?.features) {
                    localStorage.setItem('planFeatures', JSON.stringify(planId.features));
                }

                if (planId) {
                    localStorage.setItem('userPlan', JSON.stringify(planId));
                }

                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3 text-start" controlId="formBasicEmail">
                                <Form.Label className="fw-bold">Email or Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter email or username..."
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setInvalidInput(false);
                                        setError('');
                                    }}
                                    isInvalid={invalidInput}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3 text-start" controlId="formBasicPassword">
                                <Form.Label className="fw-bold">Password</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setInvalidInput(false);
                                            setError('');
                                        }}
                                        isInvalid={invalidInput}
                                    />
                                    <Button
                                        variant=""
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </Button>
                                </InputGroup>
                            </Form.Group>

                            {error && <div className="text-danger mb-3">{error}</div>}

                            <Button variant="dark" type="submit" className="w-100">
                                Sign in
                            </Button>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;