// src/pages/DoctorDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import AnamneseModal from './AnamneseModal';
import './DoctorDashboard.css';

export default function DoctorDashboard({ userId }) {
  // --- 1. Estados da fila e paciente atual ---
  const [pacienteAtual, setPacienteAtual] = useState(null);
  const [queueSize, setQueueSize] = useState(0);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [errorQueue, setErrorQueue] = useState('');

  // --- 2. Estados da anamnese ---
  const [anamnese, setAnamnese] = useState(null);
  const [showAnamneseModal, setShowAnamneseModal] = useState(false);
  //const [loadingAnamnese, setLoadingAnamnese] = useState(false);
  //const [errorAnamnese, setErrorAnamnese] = useState('');

  // --- 3. Função para buscar dados da fila ---
  const fetchQueueData = async () => {
    try {
      const response = await api.get('/queue');
      const patients = response.data;
      setQueueSize(patients.length);
      setPacienteAtual(patients[0] || null);
      setLoadingQueue(false);

      // Se houver paciente atual, buscar sua anamnese
      if (patients[0]) {
        try {
          const resAnamnese = await api.get(`/patients/${patients[0].patient_id}/anamnesis`);
          if (resAnamnese.data && resAnamnese.data.length > 0) {
            setAnamnese(resAnamnese.data[0]);
          } else {
            setAnamnese(null);
          }
        } catch (err) {
          console.error('Erro ao buscar anamnese:', err);
          setAnamnese(null);
        }
      } else {
        setAnamnese(null);
      }
    } catch (err) {
      console.error(err);
      setErrorQueue('Erro ao carregar dados da fila');
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const intervalId = setInterval(fetchQueueData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // --- 4. Função para atender paciente ---
  const handleAttendPatient = async (patientId) => {
    try {
      await api.post(`/queue/${patientId}/attend`);
      fetchQueueData();
    } catch (err) {
      console.error(err);
      setErrorQueue('Erro ao atender paciente');
    }
  };

  // --- 5. Helper para texto de prioridade ---
  const getPriorityText = (priority) => {
    return priority === 1 ? 'Prioridade' : 'Normal';
  };

  // --- 6. Render ---
  if (loadingQueue) return <div>Carregando...</div>;
  if (errorQueue) return <div className="error">{errorQueue}</div>;

  return (
    <div className="doctor-dashboard">
      <h2>Painel do Médico</h2>

      <div className="queue-info">
        <div className="queue-size">
          <h3>Tamanho da Fila</h3>
          <span className="size-number">{queueSize - 1}</span>
          <p>pacientes aguardando</p>
        </div>
      </div>

      <div className="paciente-atual">
        <h3>Paciente Atual</h3>
        {pacienteAtual ? (
          <div className="patient-card">
            <div className="patient-info">
              <div className="info-row">
                <span className="label">Nome:</span>
                <span className="value">{pacienteAtual.name}</span>
              </div>
              <div className="info-row">
                <span className="label">Sexo:</span>
                <span className="value">{pacienteAtual.gender}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{pacienteAtual.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Telefone:</span>
                <span className="value">{pacienteAtual.phone}</span>
              </div>
              <div className="info-row">
                <span className="label">CPF:</span>
                <span className="value">{pacienteAtual.cpf}</span>
              </div>
              <div className="info-row">
                <span className="label">Prioridade:</span>
                <span className={`priority-badge ${pacienteAtual.is_priority === 1 ? 'priority' : 'normal'}`}>
                  {getPriorityText(pacienteAtual.is_priority)}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Horário de Chegada:</span>
                <span className="value">
                  {new Date(pacienteAtual.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="buttons-row">
              <button
                onClick={() => handleAttendPatient(pacienteAtual.id)}
                className="attend-button"
              >
                Atender Paciente
              </button>
              <button
                onClick={() => setShowAnamneseModal(true)}
                className="attend-button"
              >
                {anamnese ? 'Anamnese' : 'Anamnese'}
              </button>
            </div>
          </div>
        ) : (
          <p className="no-patients">Não há pacientes na fila no momento</p>
        )}
      </div>

      {showAnamneseModal && pacienteAtual && (
        <AnamneseModal
          patientId={pacienteAtual.patient_id}
          existingAnamnese={anamnese}
          onClose={() => {
            setShowAnamneseModal(false);
            fetchQueueData(); // Recarrega os dados após fechar o modal
          }}
        />
      )}
    </div>
  );
}
