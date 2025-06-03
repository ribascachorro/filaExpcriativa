import React, { useState, useContext, useEffect } from 'react';
import Login from './components/Login';
import CreateUser from './components/CreateUser';
import RegisterPatient from './components/RegisterPatient';
import UserQueue from './components/UserQueue';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import api from './services/api';
import { AuthContext } from './context/AuthContext';
import './App.css';

// Componente de Header com botão de logout
function Header({ onLogout, role }) {
  return (
    <header className="app-header">
      <span className="header-role">Você está logado como: {role}</span>
      <button className="logout-btn" onClick={onLogout}>
        Sair
      </button>
    </header>
  );
}

export default function App() {
  const { user, login, logout } = useContext(AuthContext);
  const [screen, setScreen] = useState('login');
  // 'login' | 'create-user' | 'register-patient' | 'user-queue' | 'admin' | 'doctor'

  // Sempre que `user` mudar, decidimos a tela
  useEffect(() => {
    if (!user) {
      setScreen('login');
      return;
    }

    // Se for admin
    if (user.role === 'admin') {
      setScreen('admin');
      return;
    }

    // Se for médico
    if (user.role === 'doctor') {
      setScreen('doctor');
      return;
    }

    // Usuário comum: verificar paciente vinculado
    api
      .get('/patients/byuser', { params: { user_id: user.user_id } })
      .then(res => {
        setScreen(res.data.exists ? 'user-queue' : 'register-patient');
      })
      .catch(() => setScreen('register-patient'));
  }, [user]);

  // Callback após cadastro de paciente
  const handleRegistered = () => {
    setScreen('user-queue');
  };

  // Callback após login (passado para Login.jsx)
  const handleLoginSuccess = () => {
    // O próprio useEffect acima cuidará do redirecionamento, pois `user` já foi atualizado pelo contexto
  };

  // Função de logout
  const handleLogout = () => {
    logout();
    setScreen('login');
  };

  return (
    <div className="container">
      {/* Header apenas se houver USER autenticado */}
      {user && <Header onLogout={handleLogout} role={user.role} />}

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
        <RegisterPatient userId={user.user_id} onRegistered={handleRegistered} />
      )}

      {screen === 'user-queue' && <UserQueue userId={user.user_id} />}

      {screen === 'admin' && <AdminDashboard userId={user.user_id} />}

      {screen === 'doctor' && <DoctorDashboard userId={user.user_id} />}
    </div>
  );
}
