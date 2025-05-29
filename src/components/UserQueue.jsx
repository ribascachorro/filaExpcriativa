import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './UserQueue.css';  // agora puxando do mesmo folder

export default function UserQueue({ userId }) {
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  const fetchCount = async () => {
    try {
      const res = await api.get('/queue');
      setCount(res.data.length);
    } catch (err) {
      console.error('Erro ao buscar contagem da fila:', err);
    }
  };

  useEffect(() => {
    fetchCount();
    const intervalId = setInterval(fetchCount, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleEnterQueue = async () => {
    setError('');
    try {
      const resPat = await api.get('/patients/byuser', { params: { user_id: userId } });
      if (!resPat.data.exists) {
        setError('Você ainda não está cadastrado como paciente.');
        return;
      }
      const cpf = resPat.data.patient.cpf;
      await api.post('/queue', { cpf, is_priority: false });
      setJoined(true);
      fetchCount();
    } catch (err) {
      console.error('Erro ao entrar na fila:', err);
      setError('Erro ao entrar na fila.');
    }
  };

  return (
    <div className="container">
      <div className="queue-box">
        <h2>Visão do Usuário</h2>
        <p className="queue-count">{count} pessoas na fila</p>
        <p className="queue-time">Tempo estimado: {count * 10} minutos</p>
        {!joined ? (
          <button className="enter-btn" onClick={handleEnterQueue}>
            Entrar na Fila
          </button>
        ) : (
          <p className="success">Você está na fila!</p>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}