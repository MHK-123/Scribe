import axios
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    token = os.getenv('DISCORD_TOKEN')
    guild_id = '1318933846779101215'
    headers = {'Authorization': f'Bot {token}'}
    
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(f'https://discord.com/api/guilds/{guild_id}/channels', headers=headers) as resp:
                data = await resp.json()
                print(f"BOT VISION ({len(data)} channels):")
                for c in data:
                    print(f"- [{c['type']}] {c['name']} ({c['id']})")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
