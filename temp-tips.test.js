/**
 * @jest-environment jsdom
 */

// Import the HTML file as a string
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, 'temp-tips.html'), 'utf8');

describe('temp-tips.html', () => {
  let document;

  beforeEach(() => {
    // Load the HTML into the jsdom environment
    document = new DOMParser().parseFromString(html, 'text/html');
  });

  test('should have the correct title', () => {
    expect(document.title).toBe('Temperature Tips - AirVote');
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

  test('should display the Temperature Comfort Tips section', () => {
    const sectionTitle = document.querySelector('.container h2');
    expect(sectionTitle.textContent).toBe('Temperature Comfort Tips');
  });

  test('should have the correct number of temperature tips', () => {
    const tips = document.querySelectorAll('.temp-tip');
    expect(tips.length).toBe(7); // Ensure there are 7 tips
  });

  test('should have the expected text for each temperature tip front', () => {
    const tipsFront = Array.from(document.querySelectorAll('.temp-tip-front')).map(front => front.textContent.trim());

    expect(tipsFront).toEqual([
      'Not Feeling Well and Need to Regulate Your Temp?',
      'Struggling to Afford the Cost of Heating?',
      'Want To Take a Break?',
      'Menopause & Temperature',
      'Neurodiversity & Temperature',
      'Long Covid & Temperature',
      'Drink Up!',
    ]);
  });

  test('should have links in the back of select tips', () => {
    const links = Array.from(document.querySelectorAll('.temp-tip-back a')).map(link => ({
      href: link.getAttribute('href'),
      text: link.title,
    }));

    expect(links).toEqual([
      { href: 'https://appsource.microsoft.com/en-in/product/office/WA200007114?tab=Overview', text: 'Microsoft Places App' },
      { href: 'https://www.moneysavingexpert.com/utilities/how-to-get-help-if-you-re-struggling-with-your-energy-bills-/', text: "Martin Lewis' tips on energy bills" },
      { href: 'https://www.themenopausecharity.org/wp-content/uploads/2021/05/Symptoms-list.pdf', text: 'Find more information about Menopause symptoms' },
      { href: 'https://neurodivergentinsights.com/blog/autism-adhd-homeostasis/', text: 'A useful website to understand how neurodiversity affects the senses' },
      { href: 'https://covidaidcharity.org/advice-and-information/long-covid-heatwave', text: 'Charity Covid Aid provide useful tips for managing temperature' },
    ]);
  });
});
