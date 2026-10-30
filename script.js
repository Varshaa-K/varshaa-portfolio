
/* Mark JavaScript as available */
document.documentElement.classList.add('js');

const $ = (selector, context = document) =>
  context.querySelector(selector);

const $$ = (selector, context = document) =>
  [...context.querySelectorAll(selector)];

/* ---- Footer year ---- */
const yearElement = $('#year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* ---- Mobile menu ---- */
const burger = $('#burger');
const menu = $('#menu');

function setMenu(open) {
  if (!burger || !menu) return;

  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute(
    'aria-label',
    open ? 'Close menu' : 'Open menu'
  );

  burger.innerHTML = open
    ? '<i class="fa-solid fa-xmark"></i>'
    : '<i class="fa-solid fa-bars"></i>';
}

if (burger && menu) {
  burger.addEventListener('click', () => {
    setMenu(!menu.classList.contains('open'));
  });

  $$('a', menu).forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
  });
}

/* ---- Navbar background + back-to-top button ---- */
const nav = $('#nav');
const topBtn = $('#top');

function onScroll() {
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }

  if (topBtn) {
    topBtn.classList.toggle('show', window.scrollY > 500);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (topBtn) {
  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---- Scroll reveal ---- */
const reveals = $$('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(element => revealObserver.observe(element));
} else {
  reveals.forEach(element => element.classList.add('in'));
}

/* ---- Active navigation link highlighting ---- */
const sections = $$('main section[id]');
const navLinks = $$('nav a');

if ('IntersectionObserver' in window && sections.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${entry.target.id}`
          );
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(section => sectionObserver.observe(section));
}

/* ---- Contact form validation + Netlify Forms ---- */
const form = $('#form');
const status = $('#status');

const rules = {
  name: value =>
    value.trim().length >= 2 ||
    'Enter your name (at least 2 characters).',

  email: value =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
    'Enter a valid email address.',

  subject: value =>
    value.trim().length >= 3 ||
    'Enter a subject (at least 3 characters).',

  message: value =>
    value.trim().length >= 10 ||
    'Write a message of at least 10 characters.'
};

function check(field) {
  const result = rules[field.name](field.value);
  const valid = result === true;

  field.classList.toggle('bad', !valid);
  field.setAttribute('aria-invalid', String(!valid));

  const errorElement = $(`.err[data-for="${field.name}"]`);

  if (errorElement) {
    errorElement.textContent = valid ? '' : result;
  }

  return valid;
}

if (form && status) {
  /* Validate fields when the visitor leaves them */
  Object.keys(rules).forEach(name => {
    const field = form.elements.namedItem(name);

    if (field) {
      field.addEventListener('blur', () => check(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('bad')) {
          check(field);
        }
      });
    }
  });

  /* Submit the form */
  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';

    const valid = Object.keys(rules)
      .map(name => check(form.elements.namedItem(name)))
      .every(Boolean);

    if (!valid) {
      const firstInvalidField = form.querySelector('.bad');

      if (firstInvalidField) firstInvalidField.focus();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      const formData = new FormData(form);

      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(formData).toString()
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      status.textContent =
        'Thank you! Your message has been submitted successfully.';

      form.reset();

      Object.keys(rules).forEach(name => {
        const field = form.elements.namedItem(name);
        if (!field) return;

        field.classList.remove('bad');
        field.removeAttribute('aria-invalid');

        const errorElement = $(`.err[data-for="${name}"]`);

        if (errorElement) {
          errorElement.textContent = '';
        }
      });

    } catch (error) {
      console.error('Contact form error:', error);

      status.textContent =
        'Sorry, your message could not be sent. Please try again or email me directly.';

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
      }
    }
  });
}
