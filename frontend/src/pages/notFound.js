export const notFoundPage = () => {
  document.getElementById('app').innerHTML = `
    <div class="container" style="text-align: center; padding-top: 4rem;">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/" data-navigo>Go to Home</a>
    </div>
  `;
};