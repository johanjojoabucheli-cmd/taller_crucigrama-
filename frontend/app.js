let currentGridSize = 5;
let currentClues = {};
let selectedClue = null;

const btnGenerate = document.getElementById('btn-generate');
const sizeSelect = document.getElementById('size-select');
const gridContainer = document.getElementById('crossword-grid');
const cluesAcrossUl = document.getElementById('clues-across');
const cluesDownUl = document.getElementById('clues-down');

btnGenerate.addEventListener('click', async () => {
    const size = parseInt(sizeSelect.value);
    await generateNewCrossword(size);
});

window.addEventListener('DOMContentLoaded', () => {
    btnGenerate.click();
});

async function generateNewCrossword(size) {
    try {
        const response = await fetch('/api/crossword/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size: size })
        });
        const data = await response.json();
        console.log(data.message);

        await fetchCrosswordLayout();
    } catch (error) {
        console.error("Error al generar el crucigrama:", error);
    }
}

async function fetchCrosswordLayout() {
    try {
        const response = await fetch('/api/crossword/layout');
        const data = await response.json();

        currentGridSize = data.gridSize;
        currentClues = data.clues;

        document.documentElement.style.setProperty('--grid-size', currentGridSize);

        renderGrid(data.matrix);
        renderClues(data.clues);
    } catch (error) {
        console.error("Error al obtener el layout:", error);
    }
}

async function validateWordWithAPI(wordData) {
    try {
        const response = await fetch('/api/crossword/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wordData)
        });
        const data = await response.json();
        return data.correct;
    } catch (error) {
        console.error("Error al validar la palabra:", error);
        return false;
    }
}

function renderGrid(matrix) {
    gridContainer.innerHTML = ''; 
    selectedClue = null;

    matrix.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('cell');
            
            cellDiv.dataset.row = rowIndex;
            cellDiv.dataset.col = colIndex;

            if (cell === '#') {
                cellDiv.classList.add('blocked'); 
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                
                input.addEventListener('input', () => handleInputChange(rowIndex, colIndex));
                input.addEventListener('focus', () => clearHighlights());

                cellDiv.appendChild(input);
            }

            gridContainer.appendChild(cellDiv);
        });
    });
}

function addClueNumbersToGrid(clues) {

    document.querySelectorAll('.cell-number').forEach(el => el.remove());

    const positions = new Set();

    ['across', 'down'].forEach(direction => {
        clues[direction].forEach(clue => {
            const key = `${clue.row}-${clue.col}`;
            if (!positions.has(key)) {
                positions.add(key);
                const cell = document.querySelector(`.cell[data-row="${clue.row}"][data-col="${clue.col}"]`);
                if (cell) {
                    const numSpan = document.createElement('span');
                    numSpan.classList.add('cell-number');
                    numSpan.textContent = clue.number;
                    cell.appendChild(numSpan);
                }
            }
        });
    });
}

function renderClues(clues) {
    cluesAcrossUl.innerHTML = '';
    cluesDownUl.innerHTML = '';

    // Renderizar horizontales
    clues.across.forEach(clue => {
        const li = createClueLi(clue, 'across');
        cluesAcrossUl.appendChild(li);
    });

    clues.down.forEach(clue => {
        const li = createClueLi(clue, 'down');
        cluesDownUl.appendChild(li);
    });

    addClueNumbersToGrid(clues);
}
 
function createClueLi(clue, direction) {
    const li = document.createElement('li');
    li.textContent = `${clue.number}. ${clue.text}`;
    
    li.addEventListener('click', () => {
        // Remover clase activa de cualquier otra pista seleccionada
        document.querySelectorAll('.clues-section li').forEach(el => el.classList.remove('active-clue'));
        li.classList.add('active-clue');
        
        selectedClue = { ...clue, direction };
        highlightClueCells(clue, direction); 
    });

    return li;
}

function highlightClueCells(clue, direction) {
    clearHighlights();

    for (let i = 0; i < clue.length; i++) {
        const r = direction === 'across' ? clue.row : clue.row + i;
        const c = direction === 'across' ? clue.col + i : clue.col;
        
        const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            cell.classList.add('highlighted');
            if (i === 0) {
                cell.querySelector('input').focus();
            }
        }
    }
}


function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlighted'));
}

async function handleInputChange(row, col) {
    if (!selectedClue) return;

    const { row: startRow, col: startCol, length, direction } = selectedClue;
    let wordBuilt = '';
    let isComplete = true;
    const cellElements = [];

    for (let i = 0; i < length; i++) {
        const r = direction === 'across' ? startRow : startRow + i;
        const c = direction === 'across' ? startCol + i : startCol;
        
        const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        const input = cell ? cell.querySelector('input') : null;

        if (input) {
            cellElements.push(cell);
            const letter = input.value.trim();
            
            if (letter === '') {
                isComplete = false; 
            }
            wordBuilt += letter;
        }
    }

    if (isComplete && wordBuilt.length === length) {
        const wordPayload = {
            word: wordBuilt.toUpperCase(),
            direction: direction,
            row: startRow,
            col: startCol
        };

        console.log("Enviando a validación:", wordPayload);
        const isValid = await validateWordWithAPI(wordPayload);
        console.log("¿Es válida según el servidor?:", isValid);

        cellElements.forEach(cell => {
            if (isValid) {
                cell.classList.remove('incorrect');
                cell.classList.add('correct');
                const inputInside = cell.querySelector('input');
                if (inputInside) inputInside.style.backgroundColor = 'var(--color-cell-correct)';
            } else {
                cell.classList.remove('correct');
                cell.classList.add('incorrect');
                const inputInside = cell.querySelector('input');
                if (inputInside) inputInside.style.backgroundColor = 'var(--color-cell-incorrect)';
            }
        });
    }
}