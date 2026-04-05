import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        res = await conn.fetch("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'pomodoro_configs'")
        print('Default values in pomodoro_configs:')
        for r in res:
            print(f'- {r["column_name"]}: {r["column_default"]}')
        await conn.close()
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    asyncio.run(check())
