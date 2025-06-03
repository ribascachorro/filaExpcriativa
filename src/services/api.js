import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' }
});

// Intercepta respostas 401 para forçar logout e redirecionamento
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Limpa dados de sessão do localStorage
      localStorage.removeItem('user_id');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
      // Redireciona para a tela de login ("/")
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;