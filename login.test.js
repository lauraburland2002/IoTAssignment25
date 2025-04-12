/**
 * @jest-environment jsdom
 */

// Import the HTML file as a string
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, 'login.html'), 'utf8');

describe('login.html', () => {
  let document;
  let fetchMock;
  let alertMock;
  let redirectMock;

  beforeEach(() => {
    // Load the HTML into the jsdom environment
    document = new DOMParser().parseFromString(html, 'text/html');

    // Mock fetch API
    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    // Mock window.alert
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock window.location.href
    redirectMock = jest.spyOn(window.location, 'href', 'set');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('AirVote - Sign In');
  });

  test('should display the company logo', () => {
    const logo = document.getElementById('logo');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('alt')).toBe('Company Logo');
  });

  test('should display the header with the correct text', () => {
    const header = document.querySelector('h1');
    expect(header).not.toBeNull();
    expect(header.textContent).toBe('AirVote');
  });

  test('should have form fields for email and password', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    expect(emailInput).not.toBeNull();
    expect(emailInput.getAttribute('type')).toBe('email');
    expect(emailInput.getAttribute('placeholder')).toBe('Email');

    expect(passwordInput).not.toBeNull();
    expect(passwordInput.getAttribute('type')).toBe('password');
    expect(passwordInput.getAttribute('placeholder')).toBe('Password');
  });

  test('should have a sign-in button', () => {
    const signInButton = document.querySelector('.login-box button');
    expect(signInButton).not.toBeNull();
    expect(signInButton.textContent).toBe('Sign In');
  });

  test('should alert if email or password is missing', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailInput.value = '';
    passwordInput.value = '';
    const signInButton = document.querySelector('.login-box button');
    signInButton.click();

    expect(alertMock).toHaveBeenCalledWith('Please enter both email and password.');
  });

  test('should send a POST request when sign-in is attempted', async () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    const signInButton = document.querySelector('.login-box button');
    signInButton.click();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
  });

  test('should alert and not redirect if login fails', async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: 'Invalid credentials' }),
      })
    );

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailInput.value = 'test@example.com';
    passwordInput.value = 'wrongpassword';
    const signInButton = document.querySelector('.login-box button');
    await signInButton.click();

    expect(alertMock).toHaveBeenCalledWith('Invalid credentials');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  test('should redirect if login succeeds', async () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailInput.value = 'test@example.com';
    passwordInput.value = 'password123';
    const signInButton = document.querySelector('.login-box button');
    await signInButton.click();

    expect(redirectMock).toHaveBeenCalledWith('http://127.0.0.1:5500/index.html');
  });

  test('should handle login session expiry correctly', () => {
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
          store[key] = value;
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    localStorageMock.setItem('airvote_logged_in', 'true');
    localStorageMock.setItem('airvote_login_time', (Date.now() - 31 * 24 * 60 * 60 * 1000).toString()); // 31 days ago

    const onload = window.onload;
    if (onload) {
      onload();
    }

    expect(redirectMock).not.toHaveBeenCalled();
  });
});
