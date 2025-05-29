import React, { useState } from 'react';
import api from '../services/api';
import './Login.css';
import logo from '../assets/logo.png';

export default function Login({ onCreate, onSuccess }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { login, senha });
      onSuccess({ user_id: res.data.user_id, role: res.data.role });
    } catch {
      setError('Login ou senha inválidos');
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <img src={logo} className="logo" alt="Logo da Fila Inteligente" />
        <h1>Fila Inteligente</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Usuário ou E-mail"
            value={login}
            onChange={e => setLogin(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
        <p className="link" onClick={onCreate}>
          Criar uma conta
        </p>
      </div>
    </div>
  );
}