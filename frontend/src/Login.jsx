import { useState } from 'react'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dni, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar en sessionStorage (persiste solo en la sesión del tab)
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Llamar al callback
      onLoginSuccess(data.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <img src="/partnerlogo.svg" alt="Partner Logo" />
        </div>
        
        <h1>Sistema de Monitoreo</h1>
        <p className="login-subtitle">Ingresa con tu DNI</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dni">DNI</label>
            <input
              type="text"
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingresa tu DNI"
              required
              maxLength="12"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu DNI como contraseña"
              required
              maxLength="12"
            />
          </div>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>Partner - Sistema de Auditoría de Llamadas</p>
        </div>
      </div>
    </div>
  )
}

export default Login

