import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        res = await conn.fetch("SELECT guild_id, bot_command_channel_id FROM guild_configs")
        print('Guild Configs (Channel Restrictions):')
        for r in res:
            print(f'- Guild: {r["guild_id"]}, Allowed Channel: {r["bot_command_channel_id"]}')
        await conn.close()
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    asyncio.run(check())
