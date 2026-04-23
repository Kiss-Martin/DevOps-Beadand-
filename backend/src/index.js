import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data.db';

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(DB_PATH);

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS directors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER,
      director_id INTEGER,
      FOREIGN KEY(director_id) REFERENCES directors(id)
    )
  `);

  const directorCount = await get('SELECT COUNT(*) AS count FROM directors');
  if (!directorCount?.count) {
    await run('INSERT INTO directors (name) VALUES (?)', ['Christopher Nolan']);
    await run('INSERT INTO directors (name) VALUES (?)', ['Greta Gerwig']);
  }

  const movieCount = await get('SELECT COUNT(*) AS count FROM movies');
  if (!movieCount?.count) {
    await run('INSERT INTO movies (title, year, director_id) VALUES (?, ?, ?)', ['Inception', 2010, 1]);
    await run('INSERT INTO movies (title, year, director_id) VALUES (?, ?, ?)', ['Interstellar', 2014, 1]);
    await run('INSERT INTO movies (title, year, director_id) VALUES (?, ?, ?)', ['Barbie', 2023, 2]);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/directors', async (req, res) => {
  try {
    const rows = await all('SELECT id, name FROM directors ORDER BY name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch directors' });
  }
});

app.post('/api/directors', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = await run('INSERT INTO directors (name) VALUES (?)', [name]);
    const director = await get('SELECT id, name FROM directors WHERE id = ?', [result.id]);
    res.status(201).json(director);
  } catch (error) {
    res.status(400).json({ error: 'Director already exists or invalid request' });
  }
});

app.get('/api/movies', async (req, res) => {
  try {
    const rows = await all(`
      SELECT m.id, m.title, m.year, d.id AS director_id, d.name AS director_name
      FROM movies m
      LEFT JOIN directors d ON d.id = m.director_id
      ORDER BY m.title
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/movies/:id/director', async (req, res) => {
  try {
    const row = await get(`
      SELECT m.id AS movie_id, m.title, d.id AS director_id, d.name AS director_name
      FROM movies m
      LEFT JOIN directors d ON d.id = m.director_id
      WHERE m.id = ?
    `, [req.params.id]);

    if (!row) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie director' });
  }
});

app.post('/api/movies', async (req, res) => {
  const { title, year, director_id: directorId } = req.body;
  if (!title || !directorId) {
    return res.status(400).json({ error: 'title and director_id are required' });
  }

  try {
    const director = await get('SELECT id FROM directors WHERE id = ?', [directorId]);
    if (!director) {
      return res.status(404).json({ error: 'Director not found' });
    }

    const result = await run(
      'INSERT INTO movies (title, year, director_id) VALUES (?, ?, ?)',
      [title, year ?? null, directorId]
    );

    const movie = await get('SELECT id, title, year, director_id FROM movies WHERE id = ?', [result.id]);
    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create movie' });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize DB', error);
    process.exit(1);
  });
