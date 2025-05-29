import React, { useState } from 'react';
import api from '../services/api';
import './CreateUser.css';

export default function CreateUser({ onCancel }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('user');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/users', { login, senha, role });
      setIsError(false);
      setMsg('Usuário criado com sucesso');
    } catch (err) {
      setIsError(true);
      setMsg('Erro ao criar usuário');
    }
  };

  return (
    <div className="container">
      <div className="create-box">
        <h2>Criar Usuário</h2>
        {msg && (
          <p className={`message ${isError ? 'error' : 'success'}`}>
            {msg}
          </p>
        )}
        <form onSubmit={handleSubmit} className="create-form">
          <input
            type="text"
            placeholder="Login"
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
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="user">Usuário</option>
            <option value="admin">Admin</option>
          </select>

          <div className="buttons">
            <button type="submit" className="submit-btn">
              Criar
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}