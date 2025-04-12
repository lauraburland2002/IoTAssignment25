/**
 * @jest-environment jsdom
 */

// Import the HTML file as a string
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, 'admin.html'), 'utf8');

describe('admin.html', () => {
  let document;

  beforeEach(() => {
    // Load the HTML into the jsdom environment
    document = new DOMParser().parseFromString(html, 'text/html');
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('Admin Page - AirVote');
  });

  test('should have a header with the correct text', () => {
    const header = document.querySelector('header h1');
    expect(header.textContent).toBe('AirVote');
  });

  test('should have a navigation bar with correct links', () => {
    const links = Array.from(document.querySelectorAll('nav ul li a')).map(link => ({
      text: link.textContent,
      href: link.getAttribute('href'),
    }));

    expect(links).toEqual([
      { text: 'FAQs', href: 'faq.html' },
      { text: 'Voting', href: 'index.html' },
      { text: 'Temp Tips', href: 'temp-tips.html' },
    ]);
  });

  test('should have a form to change voting windows', () => {
    const formLabels = Array.from(document.querySelectorAll('.voting-window-form label')).map(label => label.textContent);
    expect(formLabels).toEqual(['First Window:', 'Second Window:']);
  });

  test('should have a button to submit voting windows', () => {
    const button = document.querySelector('.voting-window-form button');
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Change Voting Windows');
  });

  test('should have a table to display recent votes', () => {
    const table = document.getElementById('votesTable');
    expect(table).not.toBeNull();

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    expect(headers).toEqual(['User Name', 'Time of Vote', 'Temperature Voted']);
  });
});
