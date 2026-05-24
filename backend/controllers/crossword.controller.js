const crosswordTemplates = {
    5: {
        gridSize: 5,
        solution: [
            ['P', 'A', 'T', 'A', 'S'],
            ['O', '#', '#', 'R', '#'],
            ['M', 'E', 'S', 'A', '#'],
            ['O', '#', '#', 'Ñ', '#'],
            ['#', '#', '#', 'A', '#']
        ],
        
        clues: {
            across: [
                { number: 1, row: 0, col: 0, length: 5, text: "Extremidades inferiores de los animales." },
                { number: 3, row: 2, col: 0, length: 4, text: "Mueble sobre el que se colocan objetos." }
            ],
            down: [
                { number: 1, row: 0, col: 0, length: 4, text: "Elemento de donde se abre una puerta." },
                { number: 2, row: 0, col: 3, length: 5, text: "Arácnido que puede producir seda." }
            ]
        }
    },
    10: {
        gridSize: 10,
        solution: [
            ['C', 'A', 'L', 'A', 'M', 'A', 'R', '#', '#', '#'],
            ['#', '#', '#', '#', '#', '#', 'E', '#', '#', '#'],
            ['#', '#', '#', 'G', '#', '#', 'M', '#', '#', '#'],
            ['#', 'T', 'R', 'A', 'M', 'P', 'O', 'L', 'I', 'N'],
            ['#', '#', '#', 'T', '#', '#', 'L', '#', '#', '#'],
            ['#', 'T', 'R', 'O', 'C', 'H', 'A', '#', '#', '#'],
            ['#', '#', '#', '#', '#', '#', 'C', '#', '#', '#'],
            ['#', '#', '#', '#', '#', '#', 'H', '#', '#', '#'],
            ['#', '#', '#', '#', '#', '#', 'A', '#', '#', '#'],
            ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
        ],
        clues: {
            across: [
                { number: 1, row: 0, col: 0, length: 7, text: "Molusco cefalópodo marino de cuerpo alargado" },
                { number: 4, row: 3, col: 1, length: 9, text: "Permite saltar sobre él y rebotar más alto." }
            ],
            down: [
                { number: 2, row: 2, col: 3, length: 4, text: "Animal doméstico bigotudo." },
                { number: 3, row: 0, col: 8, length: 5, text: "Sendero angosto sin pavimentar, usualmente se va en caballo." },
                { number: 5, row: 0, col: 6, length: 9, text: "Hortaliza roja de raíz gruesa y carnosa." }
            ]
        }
    }
};

let currentSessionGame = null;

//POST Generador
exports.generateCrossword = (req, res) => {
    const { size } = req.body;
    
    const template = crosswordTemplates[size] || crosswordTemplates[5]; 
    
    currentSessionGame = JSON.parse(JSON.stringify(template));

    res.status(200).json({
        message: `Crucigrama de ${template.gridSize}x${template.gridSize} generado con éxito.`,
        gridSize: template.gridSize
    });
};

//GET Estructura
exports.getCrosswordLayout = (req, res) => {
    if (!currentSessionGame) {
        return res.status(400).json({ error: "Primero debes generar un crucigrama." })
    }

    const layoutMatrix = currentSessionGame.solution.map(row => 
        row.map(cell => (cell === '#' ? '#' : '_'))
    )

    res.status(200).json({
        gridSize: currentSessionGame.gridSize,
        matrix: layoutMatrix,
        clues: currentSessionGame.clues
    })
};

//POST Validación
exports.validateWord = (req, res) => {
    if (!currentSessionGame) {
        return res.status(400).json({ error: "No hay ninguna partida activa." });
    }

    const { word, direction, row, col } = req.body;
    
    if (!word || !direction || row === undefined || col === undefined) {
        return res.status(400).json({ error: "Datos incompletos para la validación." });
    }

    const r = parseInt(row);
    const c = parseInt(col);
    const upperWord = word.toUpperCase().trim();
    const solutionMatrix = currentSessionGame.solution;

    let expectedWord = '';

    try {
        if (direction === 'across') {
            for (let i = 0; i < upperWord.length; i++) {
                if (solutionMatrix[r] && solutionMatrix[r][c + i]) {
                    expectedWord += solutionMatrix[r][c + i];
                }
            }
        } else if (direction === 'down') {
            for (let i = 0; i < upperWord.length; i++) {
                if (solutionMatrix[r + i] && solutionMatrix[r + i][c]) {
                    expectedWord += solutionMatrix[r + i][c];
                }
            }
        }
    } catch (err) {
        console.error("Error al leer la matriz de solución:", err);
    }

    const isCorrect = (expectedWord === upperWord);

    console.log(`[Validación] Usuario envió: "${upperWord}" | Esperado en matriz: "${expectedWord}" -> Resultado: ${isCorrect}`);

    res.status(200).json({
        word: upperWord,
        correct: isCorrect
    });
};