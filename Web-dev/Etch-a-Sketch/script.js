// 1. Grab the grid container from the HTML
const container = document.querySelector('.gridContainer');

// 2. Reusable function to create a grid of (size × size) squares
function makeGrid(size) {
  // Clear out any existing squares
  container.innerHTML = '';

  // How big each square should be (percentage of container)
  const squareSize = 100 / size; // e.g. 100 / 16 = 6.25%

  // Create size × size new squares
  for (let i = 0; i < size * size; i++) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.style.height = `${squareSize}%`;
    square.style.flex = `0 0 ${squareSize}%`;
    square.dataset.darkness = '0';      // 0% dark to start
    square.dataset.baseColor = '';      // no color yet
    container.appendChild(square);
  }
} 

// 3. ONE delegated mouseover listener on the container
container.addEventListener('mouseover', (event) => { 
  if (!event.target.classList.contains('square')) return;
//   console.log('hovered');
  const square = event.target;


  // First time: assign a random base RGB color
  if (!square.dataset.baseColor) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    square.dataset.baseColor = `${r},${g},${b}`;
    square.dataset.darkness = '0';
  }

  // Current darkness (0–1)
  let darkness = Number(square.dataset.darkness);

  // Increase by 0.1 (10%) up to 1 (100%)
  if (darkness < 1) {
    darkness += 0.1;
    if (darkness > 1) darkness = 1;
    square.dataset.darkness = darkness.toString();
  }

  // Parse saved base color
  const [r, g, b] = square.dataset.baseColor.split(',').map(Number);

  // How much of the original color remains
  const factor = 1 - darkness; // 1 = full color, 0 = black

  // Mix with black
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);

  // Apply new color
  square.style.backgroundColor = `rgb(${dr}, ${dg}, ${db})`;

});

// 4. Initial grid
makeGrid(16);

// 5. Button + prompt to resize
const resizeBtn = document.querySelector('#resizeBtn');

resizeBtn.addEventListener('click', () => {
  let input = prompt('Squares per side? (1–100)');
  if (input === null) return;

  const size = parseInt(input, 10);

  if (Number.isNaN(size) || size <= 0 || size > 100) {
    alert('Please enter a number between 1 and 100.');
    return;
  }

  makeGrid(size);  // rebuild grid in same container
});

console.log('Hello, Etch-a-Sketch!');
