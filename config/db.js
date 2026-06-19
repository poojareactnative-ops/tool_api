const mysql = require('mysql2/promise');
const { AsyncLocalStorage } = require('async_hooks');

const transactionStorage = new AsyncLocalStorage();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tools_api',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  namedPlaceholders: false,
  timezone: 'Z'
});

const query = async (sql, params = []) => {
  const connection = transactionStorage.getStore();
  const executor = connection || pool;
  const [rows] = await executor.execute(sql, params);
  return rows;
};

const withTransaction = async (callback) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await transactionStorage.run(connection, callback);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const connectDB = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log(`MySQL connected: ${process.env.DB_HOST || 'localhost'}`);
  } finally {
    connection.release();
  }
};

const isValidId = (id) => {
  if (id && typeof id === 'object' && id._id !== undefined) return isValidId(id._id);
  if (id && typeof id === 'object' && typeof id.valueOf === 'function') return isValidId(id.valueOf());
  return Number.isInteger(Number(id)) && Number(id) > 0;
};

module.exports = {
  pool,
  query,
  withTransaction,
  connectDB,
  isValidId
};
