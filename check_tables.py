import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        res = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        print('Tables in public schema:')
        for r in res:
            print(f'- {r[0]}')
        await conn.close()
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    asyncio.run(check())
