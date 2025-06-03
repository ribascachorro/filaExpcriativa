// src/pages/DoctorDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DoctorDashboard.css';

export default function DoctorDashboard({ userId }) {
  const [nextPatient, setNextPatient] = useState(null);
  const [queueSize, setQueueSize] = useState(0);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [errorQueue, setErrorQueue] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [anamneses, setAnamneses] = useState([]);
  const [loadingAnamnese, setLoadingAnamnese] = useState(false);
  const [errorAnamnese, setErrorAnamnese] = useState('');

  const fetchQueueData = async () => {
    try {
      const response = await api.get('/queue');
      const patients = response.data;
      setQueueSize(patients.length);
      setNextPatient(patients[0] || null);
      setLoadingQueue(false);
    } catch (err) {
      setErrorQueue('Erro ao carregar dados da fila');
      setLoadingQueue(false);
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
      setErrorQueue('Erro ao atender paciente');
    }
  };

  const handleOpenModal = async () => {
    if (!nextPatient) return;
    setShowModal(true);
    setLoadingAnamnese(true);
    setErrorAnamnese('');
    try {
      const response = await api.get(`/queue/${nextPatient.id}/anamnesis`);
      setAnamneses(response.data);
    } catch (err) {
      console.error('Erro ao carregar anamneses:', err);
      setErrorAnamnese('Não foi possível carregar a anamnese.');
    } finally {
      setLoadingAnamnese(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAnamneses([]);
    setErrorAnamnese('');
  };

  const getPriorityText = (priority) => {
    return priority === 1 ? 'Prioridade' : 'Normal';
  };

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
            <div className="buttons-row">
              <button
                onClick={() => handleAttendPatient(nextPatient.id)}
                className="attend-button"
              >
                Atender Paciente
              </button>
              <button
                onClick={handleOpenModal}
                className="attend-button"
              >
                Anamnese
              </button>
            </div>
          </div>
        ) : (
          <p className="no-patients">Não há pacientes na fila no momento</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={handleCloseModal}>
              &times;
            </button>
            <h2>Anamnese do Paciente #{nextPatient.id}</h2>
            {loadingAnamnese && <p>Carregando anamnese...</p>}
            {errorAnamnese && <p className="error">{errorAnamnese}</p>}
            {!loadingAnamnese && !errorAnamnese && anamneses.length === 0 && (
              <p>Sem anamnese registrada para este paciente.</p>
            )}
            {!loadingAnamnese && !errorAnamnese && anamneses.map(anam => (
              <div key={anam.id} className="card-anamnese">
                <p><strong>Data da Consulta:</strong> {anam.data_consulta}</p>
                <p><strong>Queixa Principal:</strong> {anam.queixa_principal}</p>
                {anam.historia_da_doenca_atual && (
                  <p><strong>História da Doença Atual:</strong> {anam.historia_da_doenca_atual}</p>
                )}
                {anam.historico_medico && (
                  <p><strong>Histórico Médico:</strong> {anam.historico_medico}</p>
                )}
                {anam.medicacoes_em_uso && (
                  <p><strong>Medicações em Uso:</strong> {anam.medicacoes_em_uso}</p>
                )}
                {anam.alergias && (
                  <p><strong>Alergias:</strong> {anam.alergias}</p>
                )}
                {anam.historico_familiar && (
                  <p><strong>Histórico Familiar:</strong> {anam.historico_familiar}</p>
                )}
                {anam.habitos_de_vida && (
                  <p><strong>Hábitos de Vida:</strong> {anam.habitos_de_vida}</p>
                )}
                {anam.sintomas_rev_sistemas && (
                  <p><strong>Sintomas (rev. sistemas):</strong> {anam.sintomas_rev_sistemas}</p>
                )}
                {anam.outras_informacoes && (
                  <p><strong>Outras Informações:</strong> {anam.outras_informacoes}</p>
                )}
                <p><em>Registrado em: {anam.created_at}</em></p>
                <hr />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
