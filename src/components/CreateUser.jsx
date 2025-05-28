import React, { useState } from 'react';
import api from '../services/api';
import './CreateUser.css';

export default function CreateUser({ onCancel }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('user');
  const [msg, setMsg] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post('/users', { login, senha, role });
      setMsg('Usuário criado com sucesso');
    } catch (err) {
      setMsg('Erro ao criar usuário');
    }
  };

  return (
    <section className="create-user">
      <h2>Criar Usuário</h2>
      {msg && <p className="message">{msg}</p>}
      <form onSubmit={handleSubmit} className="create-form">
        <input placeholder="Login" value={login} onChange={e => setLogin(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} required />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="user">Usuário</option>
          <option value="admin">Admin</option>
        </select>
        <div className="buttons">
          <button type="submit">Criar</button>
          <button type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </section>
  );
}
