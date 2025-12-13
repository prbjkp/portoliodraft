function loadPage(page) {
  fetch(page)
    .then(res => res.text())
    .then(html => {
      const content = document.getElementById('content');
      content.classList.remove('show'); // reset any previous state

      // Temporarily hide while replacing content
      setTimeout(() => {
        content.innerHTML = html;
        content.classList.add('show'); // fade it in
      }, 150); // match your CSS transition time if needed
    });
}
