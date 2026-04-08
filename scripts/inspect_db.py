import asyncio
import asyncpg
import os
import json
from dotenv import load_dotenv

load_dotenv()

async def inspect():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        rows = await conn.fetch("SELECT * FROM guild_configs WHERE guild_id = '1318933846779101215'")
        print("SCRIBE CORE DIAGNOSTIC:")
        for r in rows:
            # Convert Record to dict and then json for full visibility
            d = dict(r)
            print(json.dumps(d, indent=4))
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
