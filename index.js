const express = require('express');
const jwt = require('jsonwebtoken');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// In-memory storage
const developers = [];
const users = [
  {
    username: 'admin',
    password: 'admin123'
  }
];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Developers API',
      version: '1.0.0',
      description: 'A simple API to manage dev-ddd'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./index.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  if (!bearerHeader) {
    return res.status(403).json({ message: 'No token provided' });
  }

  const token = bearerHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login to get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Developer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /developers:
 *   get:
 *     summary: Get all developers
 *     tags: [Developers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of developers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Developer'
 */
app.get('/developers', verifyToken, (req, res) => {
  res.json(developers);
});

/**
 * @swagger
 * /developers:
 *   post:
 *     summary: Create a new developer
 *     tags: [Developers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Developer'
 *     responses:
 *       201:
 *         description: Developer created successfully
 */
app.post('/developers', verifyToken, (req, res) => {
  const developer = {
    id: Date.now().toString(),
    ...req.body
  };
  developers.push(developer);
  res.status(201).json(developer);
});

/**
 * @swagger
 * /developers/{id}:
 *   get:
 *     summary: Get a developer by ID
 *     tags: [Developers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Developer found
 *       404:
 *         description: Developer not found
 */
app.get('/developers/:id', verifyToken, (req, res) => {
  const developer = developers.find(d => d.id === req.params.id);
  if (!developer) {
    return res.status(404).json({ message: 'Developer not found' });
  }
  res.json(developer);
});

/**
 * @swagger
 * /developers/{id}:
 *   put:
 *     summary: Update a developer
 *     tags: [Developers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Developer'
 *     responses:
 *       200:
 *         description: Developer updated successfully
 *       404:
 *         description: Developer not found
 */
app.put('/developers/:id', verifyToken, (req, res) => {
  const index = developers.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Developer not found' });
  }
  developers[index] = { ...developers[index], ...req.body };
  res.json(developers[index]);
});

/**
 * @swagger
 * /developers/{id}:
 *   delete:
 *     summary: Delete a developer
 *     tags: [Developers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Developer deleted successfully
 *       404:
 *         description: Developer not found
 */
app.delete('/developers/:id', verifyToken, (req, res) => {
  const index = developers.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Developer not found' });
  }
  developers.splice(index, 1);
  res.json({ message: 'Developer deleted successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
