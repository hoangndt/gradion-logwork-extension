document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date-input');
  const hoursInput = document.getElementById('hours-input');

  if (dateInput) {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateInput.value = today;
  }

  if (hoursInput) {
    hoursInput.value = '8';
  }
});
