import React, { useState } from 'react';
import Login from './components/Login';
import CreateUser from './components/CreateUser';
import RegisterPatient from './components/RegisterPatient';
import UserQueue from './components/UserQueue';
import AdminDashboard from './components/AdminDashboard';
import api from './services/api';

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login' | 'create-user' | 'register-patient' | 'user-queue' | 'admin'
  const [user, setUser] = useState({ user_id: null, role: null });

  // Após login bem-sucedido
  const handleLoginSuccess = async ({ user_id, role }) => {
    setUser({ user_id, role });
    if (role === 'admin') {
      setScreen('admin');
    } else {
      // Verifica se já existe paciente vinculado a este usuário
      try {
        const res = await api.get('/patients/byuser', { params: { user_id } });
        console.log('Verificando paciente por usuário:', res.data);
        if (res.data.exists) {
          setScreen('user-queue');
        } else {
          setScreen('register-patient');
        }
      } catch (err) {
        console.error('Erro ao verificar paciente por usuário:', err);
        setScreen('register-patient');
      }
    }
  };

  // Quando paciente for cadastrado com sucesso
  const handleRegistered = () => {
    setScreen('user-queue');
  };

  return (
    <div className="container">
      <h1>Fila Inteligente</h1>

      {screen === 'login' && (
        <Login
          onCreate={() => setScreen('create-user')}
          onSuccess={handleLoginSuccess}
        />
      )}

      {screen === 'create-user' && (
        <CreateUser onCancel={() => setScreen('login')} />
      )}

      {screen === 'register-patient' && (
        <RegisterPatient
          userId={user.user_id}
          onRegistered={handleRegistered}
        />
      )}

      {screen === 'user-queue' && <UserQueue userId={user.user_id} />}

      {screen === 'admin' && <AdminDashboard userId={user.user_id} />}
    </div>
  );
}
