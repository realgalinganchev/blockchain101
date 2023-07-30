/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         timestamp:
 *           type: number
 *         input:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             amount:
 *               type: number
 *             signature:
 *               type: string
 *         output:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             amount:
 *               type: number
 *     Block:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         nonce:
 *           type: number
 *         hash:
 *           type: string
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /blockchain:
 *   get:
 *     summary: Get all blocks in the blockchain
 *     description: Retrieve a list of all blocks in the blockchain.
 *     responses:
 *       '200':
 *         description: A list of blocks.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Block'
 */

/**
 * @swagger
 * /transaction:
 *   post:
 *     summary: Add a new transaction
 *     description: Create a new transaction and add it to the mempool.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transaction'
 *     responses:
 *       '200':
 *         description: Transaction added successfully.
 *       '400':
 *         description: Bad request. Transaction could not be added.
 */

/**
 * @swagger
 * /mempool:
 *   get:
 *     summary: Get all transactions in the mempool
 *     description: Retrieve a list of all unconfirmed transactions currently in the mempool.
 *     responses:
 *       '200':
 *         description: A list of transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /mine:
 *   get:
 *     summary: Mine a new block
 *     description: Processes transactions from the mempool and mines a new block.
 *     responses:
 *       '200':
 *         description: Successfully mined a new block.
 */
