import { Pool, type QueryResult } from 'pg';

type SqlResult<T> = QueryResult<T>;

export type SqlTag = {
  <T = any>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<SqlResult<T>>;
  query<T = any>(text: string, values?: unknown[]): Promise<SqlResult<T>>;
};

function getConnectionString(): string {
  // Prefer NON_POOLING for direct connections (better for server-side)
  // Pooler connections can have issues with certain operations
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      'Missing Postgres connection string. Set POSTGRES_URL_NON_POOLING (preferred) or POSTGRES_URL.'
    );
  }

  return connectionString;
}

const connectionString = getConnectionString();

// Parse connection string for Supabase compatibility
let poolConfig: any = {
  connectionString,
  max: process.env.NODE_ENV === 'production' ? 5 : 1,
  connectionTimeoutMillis: 15000, // 15 second timeout
  idleTimeoutMillis: 30000,
};

// Handle SSL for Supabase connections
if (connectionString.includes('sslmode=require') || connectionString.includes('supabase')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

// For Supabase, try parsing the URL to extract components if connection string format is problematic
if (connectionString.includes('supabase') || connectionString.includes('pooler')) {
  try {
    const url = new URL(connectionString);
    // Use individual components for better compatibility
    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1).split('?')[0] || 'postgres',
      user: url.username,
      password: url.password,
      ssl: {
        rejectUnauthorized: false,
      },
      max: process.env.NODE_ENV === 'production' ? 5 : 1,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    };
  } catch (error) {
    // If URL parsing fails, fall back to connection string
    console.warn('[db] Could not parse connection string, using as-is');
  }
}

const pool = new Pool(poolConfig);

pool.on('error', (error) => {
  console.error('[db] Unexpected pool error:', error);
});

export const sql: SqlTag = (async (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => {
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }

  return pool.query(text, values);
}) as SqlTag;

sql.query = (text: string, values: unknown[] = []) => pool.query(text, values);

// Initialize database schema
export async function initDatabase() {
  try {
    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        date TIMESTAMP NOT NULL,
        organizer_id VARCHAR(255) NOT NULL,
        court_cost_type VARCHAR(20) NOT NULL,
        court_cost_value DECIMAL(10,2) NOT NULL DEFAULT 0,
        bird_cost_total DECIMAL(10,2) NOT NULL DEFAULT 0,
        bet_per_player DECIMAL(10,2) NOT NULL DEFAULT 0,
        game_mode VARCHAR(10) NOT NULL DEFAULT 'doubles',
        round_robin_count INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create games table
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        game_number INTEGER NOT NULL,
        team_a JSONB NOT NULL,
        team_b JSONB NOT NULL,
        winning_team VARCHAR(1),
        team_a_score INTEGER,
        team_b_score INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_games_session_id ON games(session_id)
    `;

    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

