require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Standalone initializer: reads schema.sql and runs it against the
// configured database (TiDB Cloud Serverless).
//
//   npm run db:init
//   node scripts/init-db.js
//
async function init() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 4000,
    // schema.sql contains multiple statements, so multipleStatements is on.
    multipleStatements: true,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  });

  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Executes all CREATE TABLE IF NOT EXISTS statements in schema.sql.
  await connection.query(schema);

  console.log('✅ Database schema successfully created on TiDB Cloud!');
  await connection.end();
  process.exit(0);
}

init().catch((err) => {
  console.error('❌ Failed to initialise the database on TiDB Cloud:');
  console.error('   ', err.message);
  console.error('');
  console.error('   Check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
  console.error('   and MYSQL_PORT (default 4000) in the .env file.');
  process.exit(1);
});