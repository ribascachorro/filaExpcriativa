import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DoctorDashboard.css';

export default function DoctorDashboard({ userId }) {
  const [nextPatient, setNextPatient] = useState(null);
  const [queueSize, setQueueSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueueData = async () => {
    try {
      const response = await api.get('/queue');
      const patients = response.data;
      setQueueSize(patients.length);
      setNextPatient(patients[0] || null); // Pega o primeiro paciente da fila
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados da fila');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const intervalId = setInterval(fetchQueueData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleAttendPatient = async (patientId) => {
    try {
      await api.post(`/queue/${patientId}/attend`);
      fetchQueueData();
    } catch (err) {
      setError('Erro ao atender paciente');
    }
  };

  const getPriorityText = (priority) => {
    return priority === 1 ? 'Prioridade' : 'Normal';
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="doctor-dashboard">
      <h2>Painel do Médico</h2>
      
      <div className="queue-info">
        <div className="queue-size">
          <h3>Tamanho da Fila</h3>
          <span className="size-number">{queueSize-1}</span>
          <p>pacientes aguardando</p>
        </div>
      </div>

      <div className="next-patient">
        <h3>Paciente Atual</h3>
        {nextPatient ? (
          <div className="patient-card">
            <div className="patient-info">
              <div className="info-row">
                <span className="label">Nome:</span>
                <span className="value">{nextPatient.name}</span>
              </div>
              <div className="info-row">
                <span className="label">Sexo:</span>
                <span className="value">{nextPatient.gender}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{nextPatient.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Telefone:</span>
                <span className="value">{nextPatient.phone}</span>
              </div>
              <div className="info-row">
                <span className="label">CPF:</span>
                <span className="value">{nextPatient.cpf}</span>
              </div>
              <div className="info-row">
                <span className="label">Prioridade:</span>
                <span className={`priority-badge ${nextPatient.is_priority === 1 ? 'priority' : 'normal'}`}>
                  {getPriorityText(nextPatient.is_priority)}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Horário de Chegada:</span>
                <span className="value">{new Date(nextPatient.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
            <button
              onClick={() => handleAttendPatient(nextPatient.id)}
              className="attend-button"
            >
              Atender Paciente
            </button>
            <button className="attend-button">Anamnese</button>
          </div>
        ) : (
          <p className="no-patients">Não há pacientes na fila no momento</p>
        )}
      </div>
    </div>
  );
} 