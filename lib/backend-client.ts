// Minimal frontend API client for the backend
export async function register(email: string, password: string) {
  const resp = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return resp.json();
}

export async function login(email: string, password: string) {
  const data = new URLSearchParams();
  data.append('username', email);
  data.append('password', password);
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    body: data,
  });
  return resp.json();
}

export async function me(token: string) {
  const resp = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json();
}

export async function getSports() {
  const resp = await fetch('/api/catalog/sports');
  return resp.json();
}

export async function deposit(token: string, amount: number, description = '') {
  const resp = await fetch('/api/wallet/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, description }),
  });
  return resp.json();
}

export async function withdraw(token: string, amount: number, description = '') {
  const resp = await fetch('/api/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, description }),
  });
  return resp.json();
}

export async function placeBet(token: string, stake: number, odds: number) {
  const resp = await fetch('/api/bets/place', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ stake, odds }),
  });
  return resp.json();
}
