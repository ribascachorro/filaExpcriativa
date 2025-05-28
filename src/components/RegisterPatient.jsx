// src/components/RegisterPatient.jsx
import React, { useState } from 'react';
import api from '../services/api';
import './RegisterPatient.css';

export default function RegisterPatient({ userId, onRegistered }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    insurance_provider: '',
    insurance_number: '',
    cpf: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/patients', { ...form, user_id: userId });
      setSuccess('Cadastro realizado com sucesso!');
      onRegistered();
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      setError(err.response?.data?.error || 'Erro ao cadastrar paciente');
    }
  };

  return (
    <section className="register-patient">
      <h2>Cadastro Completo do Paciente</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form className="form" onSubmit={handleSubmit}>
        <input
          name="cpf"
          placeholder="CPF (somente números)"
          value={form.cpf}
          onChange={handleChange}
          required
        />
        <input
          name="name"
          placeholder="Nome completo"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Telefone"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          name="birth_date"
          type="date"
          value={form.birth_date}
          onChange={handleChange}
          required
        />
        <input
          name="insurance_provider"
          placeholder="Convênio"
          value={form.insurance_provider}
          onChange={handleChange}
        />
        <input
          name="insurance_number"
          placeholder="Número do convênio"
          value={form.insurance_number}
          onChange={handleChange}
        />
        <button type="submit">Cadastrar Paciente</button>
      </form>
    </section>
  );
}
