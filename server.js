const express = require('express');
const app = express();

const path = require('path');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/api/ping', (req, res) => {
    res.json({ message: "Servidor creado con éxito." });
});

const crosswordRoutes = require('./backend/routes/crossword.routes');
app.use('/api/crossword', crosswordRoutes);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});