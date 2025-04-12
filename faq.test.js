/**
 * @jest-environment jsdom
 */

// Import the HTML file as a string
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, 'faq.html'), 'utf8');

describe('faq.html', () => {
  let document;

  beforeEach(() => {
    // Load the HTML into the jsdom environment
    document = new DOMParser().parseFromString(html, 'text/html');
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('FAQs - AirVote');
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

  test('should display the FAQ section title', () => {
    const faqTitle = document.querySelector('.container h2');
    expect(faqTitle.textContent).toBe('Frequently Asked Questions');
  });

  test('should have the correct number of FAQ items', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    expect(faqItems.length).toBe(6); // Ensure there are 6 FAQ items
  });

  test('should have the expected text for each FAQ question', () => {
    const questions = Array.from(document.querySelectorAll('.faq-question')).map(q => q.textContent);

    expect(questions).toEqual([
      'How often can I vote?',
      'How is the final temperature decided?',
      'Can I change my vote?',
      'How secure is this web application?',
      'How do you store my data?',
      'The AirVote app and/or IoT devices do not seem to be working correctly. What do I do?',
    ]);
  });

  test('should have answers associated with each FAQ question', () => {
    const answers = Array.from(document.querySelectorAll('.faq-answer')).map(a => a.textContent.trim());

    expect(answers).toEqual([
      'You can vote at 9 AM and 1 PM each day.',
      'The system collects votes and calculates the most popular temperature setting.',
      'No, once you submit your vote, it is final for that session.',
      'AirVote is designed with security as a top priority. AirVote is integrated with Microsoft Entra SSO, meaning that nobody outside of your organisation can interfere with the ...',
      'We retain your data for 12 months to find an average of employee\'s preferred temperatures during different seasons, and use this information to adjust the temperature accord...',
      'For any software or hardware concerns, contact us on +44 0000000000. Our office hours are 9am - 5:30pm Monday - Friday. You can also email us: queries@airvote.com',
    ]);
  });
});
