import os
import asyncio
import asyncpg
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_URL = os.getenv('DATABASE_URL')

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')

async def migrate():
    print('Connecting to database...')
    conn = await asyncpg.connect(DB_URL)
    try:
        with open(SCHEMA_PATH, 'r') as f:
            sql = f.read()
        print('Running schema.sql...')
        await conn.execute(sql)
        print('✅ Migration complete.')
    finally:
        await conn.close()

if __name__ == '__main__':
    asyncio.run(migrate())
