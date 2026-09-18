export function mountInteractions(root) {
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const quiz = button.closest('.sf-quiz');
    if (quiz && button.hasAttribute('data-correct')) {
      quiz.querySelectorAll('.sf-options button').forEach(b => b.classList.remove('selected'));
      button.classList.add('selected');
      const good = button.dataset.correct === 'true';
      const out = quiz.querySelector('.sf-feedback');
      out.textContent = good ? (out.dataset.message || '¡Correcto!') : 'Todavía no. Prueba otra opción.';
      out.dataset.state = good ? 'good' : 'bad';
    }
    const card = button.closest('.sf-flashcard');
    if (card) card.classList.toggle('flipped');
    const tabs = button.closest('.sf-tabs');
    if (tabs && button.hasAttribute('data-tab')) {
      const n = Number(button.dataset.tab);
      tabs.querySelectorAll('[role="tab"]').forEach((tab, i) => tab.setAttribute('aria-selected', String(i === n)));
      tabs.querySelectorAll('[role="tabpanel"]').forEach((panel, i) => { panel.hidden = i !== n; });
    }
    const answer = button.closest('.sf-answer');
    if (answer) { const panel = answer.querySelector('div'); panel.hidden = !panel.hidden; button.textContent = panel.hidden ? 'Mostrar respuesta' : 'Ocultar respuesta'; }
    const sort = button.closest('.sf-sort');
    if (sort) {
      if (button.dataset.move) {
        const item = button.closest('li');
        if (button.dataset.move === 'up' && item.previousElementSibling) item.parentNode.insertBefore(item, item.previousElementSibling);
        if (button.dataset.move === 'down' && item.nextElementSibling) item.parentNode.insertBefore(item.nextElementSibling, item);
      }
      if (button.hasAttribute('data-check')) {
        const actual = [...sort.querySelectorAll('li')].map(li => li.firstChild.textContent.trim()).join('|');
        sort.querySelector('.sf-feedback').textContent = actual === sort.dataset.order ? '¡Orden correcto!' : 'Revisa el orden e inténtalo de nuevo.';
      }
    }
    const match = button.closest('.sf-match');
    if (match && button.hasAttribute('data-check')) {
      const fields = [...match.querySelectorAll('select')];
      match.querySelector('.sf-feedback').textContent = fields.every(select => select.value === select.dataset.answer) ? '¡Todas las relaciones son correctas!' : 'Hay relaciones por revisar.';
    }
    const hotspot = button.closest('.sf-hotspot');
    if (hotspot) hotspot.querySelector('.sf-feedback').textContent = `${button.getAttribute('aria-label')}: ${button.dataset.info}`;
  });
  root.addEventListener('input', event => {
    const slider = event.target.closest('.sf-slider');
    if (slider) slider.querySelector('output').textContent = event.target.value;
    const calculator = event.target.closest('.sf-calculator');
    if (calculator) calculator.querySelector('output').textContent = String(Number(event.target.value) * Number(calculator.querySelector('small').textContent.split('×')[1]));
  });
  root.addEventListener('submit', event => {
    if (event.target.matches('.sf-form')) { event.preventDefault(); event.target.querySelector('.sf-feedback').textContent = 'Respuesta registrada en esta sesión.'; }
  });
}
