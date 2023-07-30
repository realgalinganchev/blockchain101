import express, { Express, Request, Response } from 'express';
import { addTransaction, mine, blocks } from './Miner';
import Blockchain from './Blockchain';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
// import Block from './react-setup/src/components/Block';
import path from 'path';
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Blockchain101 API',
      version: '1.0.0',
      description: 'API documentation for Blockchain101',
    },
    servers: [
      {
        url: 'http://localhost:3000', // Replace with your server URL
      },
    ],
  },
  apis: [path.join(__dirname, 'swagger.js')], // Check if this path is correct
};

const app: Express = express();
app.use(express.json());
app.use(express.static('public'));

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const blockchain = new Blockchain();

app.post('/transaction', (req: Request, res: Response) => {
  addTransaction(req.body);
  res.sendStatus(200);
});

// app.get('/mine', (_req: Request, res: Response) => {
//   mine();
//   const blockchainBlocks = blocks;
//   const newBlock = new Block(blockchainBlocks[blockchainBlocks.length - 1].transactions, blockchainBlocks[blockchainBlocks.length - 2]?.hash || '');
//   blockchain.addBlock(newBlock);
//   res.sendStatus(200);
// });

app.get('/blocks', (_req: Request, res: Response) => {
  res.json(blockchain.chain);
});

app.listen(3000, () => console.log('Listening on port 3000'));

app.use(express.static('client'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});
