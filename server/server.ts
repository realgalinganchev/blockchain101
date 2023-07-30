import express, { Express, Request, Response } from 'express';
import { addTransaction, mine, blocks } from './Miner';
import Blockchain from './Blockchain';
import Block from './Block';

const app: Express = express();
app.use(express.json());
app.use(express.static('public'));

const blockchain = new Blockchain();

app.post('/transaction', (req: Request, res: Response) => {
  addTransaction(req.body);
  res.sendStatus(200);
});

app.get('/mine', (_req: Request, res: Response) => {
  mine();
  const blockchainBlocks = blocks;
  const newBlock = new Block(blockchainBlocks[blockchainBlocks.length - 1].transactions, blockchainBlocks[blockchainBlocks.length - 2]?.hash || '');
  blockchain.addBlock(newBlock);
  res.sendStatus(200);
});

app.get('/blocks', (_req: Request, res: Response) => {
  res.json(blockchain.chain);
});

app.listen(3001, () => console.log('Listening on port 3001'));
