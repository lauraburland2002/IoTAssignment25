/**
 * @jest-environment jsdom
 */

// Import the HTML file as a string
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

describe('index.html', () => {
  let document;

  beforeEach(() => {
    // Load the HTML into the jsdom environment
    document = new DOMParser().parseFromString(html, 'text/html');
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('AirVote');
  });

  test('should have a header with the correct text', () => {
    const header = document.querySelector('header h1');
    expect(header.textContent).toBe('AirVote');
  });

  test('should have a link to the admin page', () => {
    const adminLink = document.querySelector('a.admin-link');
    expect(adminLink).not.toBeNull();
    expect(adminLink.getAttribute('href')).toBe('/admin.html');
  });

  test('should have a temperature slider with the correct default value', () => {
    const slider = document.getElementById('temperatureSlider');
    expect(slider).not.toBeNull();
    expect(slider.value).toBe('22');
  });

  test('should display the correct default temperature value', () => {
    const temperatureValue = document.getElementById('temperatureValue');
    expect(temperatureValue.textContent).toBe('22°C');
  });

  test('should have a submit vote button', () => {
    const submitButton = document.getElementById('submitVote');
    expect(submitButton).not.toBeNull();
    expect(submitButton.textContent).toBe('Submit Vote');
  });

  test('should have navigation links for FAQs, Voting, and Temp Tips', () => {
    const navLinks = Array.from(document.querySelectorAll('nav ul li a')).map(link => link.textContent);
    expect(navLinks).toContain('FAQs');
    expect(navLinks).toContain('Voting');
    expect(navLinks).toContain('Temp Tips');
  });
});
