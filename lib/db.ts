import mysql from 'mysql2/promise'

// Database connection configuration
let dbConfig: mysql.PoolOptions = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'privatechat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// If DATABASE_URL is provided, use it to override individual configs
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL)
    dbConfig = {
      ...dbConfig,
      host: url.hostname || dbConfig.host,
      port: parseInt(url.port) || dbConfig.port,
      user: decodeURIComponent(url.username) || dbConfig.user,
      password: decodeURIComponent(url.password) || dbConfig.password,
      database: url.pathname.startsWith('/') ? url.pathname.slice(1) : dbConfig.database,
    }
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error)
  }
}

// Create a connection pool
let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

// Helper function to execute queries
export async function query<T>(
  sql: string,
  params?: (string | number | boolean | null | Date)[]
): Promise<T> {
  const connection = getPool()
  const [results] = await connection.query(sql, params)
  return results as T
}

// Helper function for transactions
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getPool().getConnection()
  
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// Close the pool (useful for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection()
    await connection.ping()
    connection.release()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}
