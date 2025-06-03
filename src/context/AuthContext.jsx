import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Estado inicial: tenta ler user_id e role do localStorage
  const [user, setUser] = useState(() => {
    const storedId = localStorage.getItem('user_id');
    const storedRole = localStorage.getItem('role');
    if (storedId && storedRole) {
      return { user_id: storedId, role: storedRole };
    }
    return null;
  });

  // Função de login: salva user_id e role no context e no localStorage
  function login({ user_id, role, token }) {
    localStorage.setItem('user_id', user_id);
    localStorage.setItem('role', role);
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser({ user_id, role });
  }

  // Função de logout: limpa dados de sessão
  function logout() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}