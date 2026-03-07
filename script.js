const form = document.getElementById('contact-form');
const status = document.getElementById('status');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  status.textContent = `Thanks ${name}, your message has been sent.`;
  form.reset();
});