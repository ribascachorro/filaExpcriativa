// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]);
  const [idInput, setIdInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patsRes, queueRes] = await Promise.all([
          api.get('/patients'),
          api.get('/queue'),
        ]);
        setPatients(patsRes.data);
        setQueue(queueRes.data);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };
    loadData();
  }, []);

  const refreshQueue = async () => {
    try {
      const res = await api.get('/queue');
      setQueue(res.data);
    } catch (err) {
      console.error('Erro ao recarregar fila:', err);
    }
  };

  const handleAdd = async () => {
    const pid = Number(idInput);
    if (!patients.some(p => p.id === pid)) {
      setError('Paciente não encontrado');
      return;
    }
    setError('');
    try {
      await api.post('/queue', { patient_id: pid, is_priority: false });
      setIdInput('');
      refreshQueue();
    } catch (err) {
      console.error('Erro ao adicionar à fila:', err);
      setError('Erro ao adicionar paciente');
    }
  };

  const handleAction = (entryId, action) => {
    api
      .patch(`/queue/${entryId}/${action}`)
      .then(refreshQueue)
      .catch(err => console.error(`Erro ao ${action}:`, err));
  };

  const getName = pid => {
    const p = patients.find(x => x.id === pid);
    return p ? p.name : 'Desconhecido';
  };

  return (
    <div className="container">
      <div className="admin-box">
        <h2>Painel de Administração</h2>
        <p className="greeting">Olá Doutor! Selecione o paciente:</p>
        <div className="admin-add">
          <input
            type="number"
            placeholder="ID do paciente"
            value={idInput}
            onChange={e => setIdInput(e.target.value)}
          />
          <button className="add-btn" onClick={handleAdd}>
            Adicionar
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <ul className="admin-list">
          {queue.map(item => (
            <li key={item.id} className="admin-item">
              <span>#{item.id} – {getName(item.patient_id)}</span>
              <div className="admin-actions">
                <button
                  className="action-btn serve-btn"
                  onClick={() => handleAction(item.id, 'serve')}
                >
                  Atender
                </button>
                <button
                  className="action-btn cancel-btn"
                  onClick={() => handleAction(item.id, 'cancel')}
                >
                  Cancelar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}