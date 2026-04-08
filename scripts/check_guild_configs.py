import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        rows = await conn.fetch("SELECT * FROM guild_configs")
        print("Guild Configs Content:")
        for r in rows:
            print(dict(r))
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
