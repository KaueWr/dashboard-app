import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ authenticated: false })
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders login screen when there is no active session', async () => {
  render(<App />);

  expect(await screen.findByText(/Acesso ao Dashboard/i)).toBeInTheDocument();
});
