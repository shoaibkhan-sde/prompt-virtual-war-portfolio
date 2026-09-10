export async function getAuthToken() {
    let token = localStorage.getItem('venueflow_token');
    if (token) return token;
  
    try {
      // register
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'frontend_user', password: 'password' })
      });
      // login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'frontend_user', password: 'password' })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('venueflow_token', data.token);
        return data.token;
      }
    } catch (err) {
      console.error('Auth failed', err);
    }
    return '';
  }
  
