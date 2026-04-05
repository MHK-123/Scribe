import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def diagnose():
    token = os.getenv('DISCORD_TOKEN')
    guild_id = '1318933846779101215'
    headers = {'Authorization': f'Bot {token}'}
    
    async with aiohttp.ClientSession() as session:
        url = f'https://discord.com/api/guilds/{guild_id}/channels'
        print(f"📡 [DIAGNOSTIC]: Scrying Discord API: {url}")
        async with session.get(url, headers=headers) as resp:
            data = await resp.json()
            if resp.status == 200:
                print(f"✅ [SUCCESS]: Found {len(data)} channels.")
                categories = [c['name'] for c in data if c['type'] == 4]
                voice = [c['name'] for c in data if c['type'] == 2]
                print(f"📂 Categories: {categories[:5]}")
                print(f"🎙️ Voice: {voice[:5]}")
            else:
                print(f"❌ [FAILURE]: Discord returned status {resp.status}")
                print(data)

if __name__ == "__main__":
    asyncio.run(diagnose())
