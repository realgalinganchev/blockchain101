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
 * /blocks:
 *   get:
 *     summary: Get all blocks
 *     description: Retrieve a list of all blocks.
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

