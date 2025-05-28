import React, { useState } from 'react';
import api from '../services/api';
import './Login.css';

export default function Login({ onCreate, onSuccess }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { login, senha });
      // Pass user_id and role together
      onSuccess({ user_id: res.data.user_id, role: res.data.role });
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Login ou senha inválidos');
    }
  };

  return (
    <section className="login">
      <h2>Entrar</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <input
          placeholder="Login (email)"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
      </form>
      <p className="link" onClick={onCreate}>
        Criar usuário
      </p>
    </section>
  );
}
