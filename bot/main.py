import sys
import os
import asyncio
import threading
import signal
import time
import aiohttp
import inspect

from http.server import HTTPServer, BaseHTTPRequestHandler

# ─── Path Guard: Anchoring Scribe Core ────────────────────────────────────────
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

import discord
from discord.ext import commands

from bot.config import TOKEN, Settings
from bot.utils.logger import bot_logger
from bot.utils.embeds import create_error_embed
from bot.core.database import init_db
from bot.core.socket_client import connect_socketIO



# ─── Bot Core ──────────────────────────────────────────────────────────────────
class ScribeBot(commands.Bot):
    def __init__(self):
        super().__init__(
            command_prefix=commands.when_mentioned_or('$'),
            intents=discord.Intents.all(),
            help_command=None
        )
        self.pomodoro_manager = None

    async def setup_hook(self):
        bot_logger.info("📡 [PHASE]: Setup Hook Initializing...")
        
        # 1. Database Registry
        try:
            pool = await init_db()
            self.pool = pool
            bot_logger.info("🗄️ [PHASE]: Database tether established.")
        except Exception as e:
            bot_logger.critical(f"❌ [CRITICAL]: Database manifest failed: {e}")
            raise
        
        # 2. Subsystems
        from bot.services.pomodoro_manager import PomodoroManager
        self.pomodoro_manager = PomodoroManager(self, pool)
        bot_logger.info("⚔️ [PHASE]: Pomodoro services initialized (Awaiting Readiness).")

        # 3. SocketIO Gateway (Non-blocking resilience)
        asyncio.create_task(self.ignite_socketIO())

        # 4. Command Tree Sync
        asyncio.create_task(self.sync_tree())

        # 5. Cogs Manifestation
        initial_extensions = [
            'bot.cogs.admin',
            'bot.cogs.voice',
            'bot.cogs.stats_hunter',
            'bot.cogs.pomodoro',
            'bot.cogs.help'
        ]
        for ext in initial_extensions:
            try:
                await self.load_extension(ext)
                bot_logger.info(f"Loaded Cog: {ext}")
            except Exception as e:
                bot_logger.error(f"Failed Cog: {ext} -> {e}")

    async def ignite_socketIO(self):
        try:
            await asyncio.wait_for(connect_socketIO(), timeout=15.0)
            bot_logger.info("🌐 [PHASE]: SocketIO gateway manifest.")
        except Exception as e:
            bot_logger.warning(f"⚠️ [PHASE]: SocketIO handshake delayed/failed: {e}")

    async def sync_tree(self):
        await self.wait_until_ready()
        try:
            bot_logger.info("🌀 [PHASE]: Manifesting Slash Rituals...")
            # We skip global sync to prevent duplication and the 1-hour delay.
            # Use $sync-guild for instant local manifestation.
            # await self.tree.sync() 
            bot_logger.info("✅ [PHASE]: Instant Local Protocol active.")
        except Exception as e:
            bot_logger.error(f"❌ [PHASE]: Tree sync failed: {e}")

    async def on_ready(self):
        activity = discord.Activity(
            type=discord.ActivityType.watching,
            name="$help | Scribe Core"
        )
        await self.change_presence(activity=activity)
        bot_logger.info(f"✅ [MANIFEST]: Sentinel '{self.user}' is online.")

        # ─── Failsafe Ignition Wrapper ───
        try:
            # Buffer: Ensure gateway cache is fully Manifested
            await self.wait_until_ready()
            await asyncio.sleep(5) 
            
            # 1. Restore Active Rituals (Pomodoro)
            if self.pomodoro_manager:
                await self.pomodoro_manager.load_active_sessions()

            # 2. Owner Sync Ritual (Backfill)
            async with self.pool.acquire() as conn:
                for guild in self.guilds:
                    gid = getattr(guild, 'id', None)
                    oid = getattr(guild, 'owner_id', None)
                    if gid and oid:
                        await conn.execute('''
                            INSERT INTO guild_configs (guild_id, owner_id) 
                            VALUES ($1, $2) 
                            ON CONFLICT (guild_id) DO UPDATE SET owner_id = EXCLUDED.owner_id
                            WHERE guild_configs.owner_id IS NULL
                        ''', str(gid), str(oid))
            bot_logger.info("⚔️ [PHASE]: Realm ownership reconciliation complete.")
        except Exception as e:
            bot_logger.error(f"💀 [IGNITION FAULT]: Rituals aborted but Sentinel remains stable: {e}")

    async def on_guild_join(self, guild: discord.Guild):
        bot_logger.info(f"🛡️ [PROTOCOL]: Sentinel entering new realm: {guild.name} ({guild.id})")
        try:
            async with self.pool.acquire() as conn:
                gid = getattr(guild, 'id', None)
                oid = getattr(guild, 'owner_id', None)
                if gid and oid:
                    await conn.execute('''
                        INSERT INTO guild_configs (guild_id, owner_id) 
                        VALUES ($1, $2) 
                        ON CONFLICT (guild_id) DO UPDATE SET owner_id = EXCLUDED.owner_id
                        WHERE guild_configs.owner_id IS NULL
                    ''', str(gid), str(oid))
        except Exception as e:
            bot_logger.error(f"Failed to reconcile new realm: {e}")
            
        # 1. Initialize Database Core Configs
        async with self.pool.acquire() as conn:
            # Default Pomodoro Config
            await conn.execute('''
                INSERT INTO pomodoro_configs (guild_id, focus_duration, break_duration, auto_start, auto_stop)
                VALUES ($1, 25, 5, TRUE, TRUE)
                ON CONFLICT (guild_id) DO NOTHING
            ''', str(guild.id))

        # 2. Notify Backend to Sync Cache (Dashboard Awareness)
        try:
            async with aiohttp.ClientSession() as session:
                from bot.config import API_URL, TOKEN
                await session.post(f"{API_URL.replace('/api', '')}/api/guilds/refresh-cache", 
                                 headers={'x-bot-token': TOKEN}, timeout=5)
        except: pass

        # 3. Instant Command Manifestation (Slash Ritual)
        try:
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
            bot_logger.info(f"✅ [PHASE]: Local command tree synced for guild {guild.id}.")
        except Exception as e:
            bot_logger.error(f"❌ [PHASE]: Local tree sync failed: {e}")

        # 4. Cinematic Welcome Ritual
        embed = discord.Embed(
            title="🛡️ SCRIBE CORE MANIFESTED",
            description=(
                f"Greetings, Citizens of **{guild.name}**.\n\n"
                "I am **SCRIBE**, your sentinel for deep focus, voice sanctuary, and study tracking.\n\n"
                "### 📜 NEXT STEPS\n"
                "To activate my voice systems and pomodoro engines, use **`/setup`** or **`/config`** to access your dashboard.\n\n"
                "*If slash commands are not visible yet, an Administrator can use **`$sync-guild`** to force manifestation.*\n\n"
                "**[Open Dashboard]**(https://scribe-bot.vercel.app/setup)"
            ),
            color=0x4b8bf5
        )
        embed.set_footer(text="Scribe Core v3.0 · Built for Focus")
        
        if guild.system_channel:
            try:
                await guild.system_channel.send(embed=embed)
            except: pass

    async def on_command_error(self, ctx, error):
        if isinstance(error, commands.CommandNotFound): return
        bot_logger.error(f"⚠️ [FAULT]: {ctx.author}: {error}")
        try:
            await ctx.send(embed=create_error_embed("SENTINEL FAULT", f"An anomaly disrupted the ritual: `{error}`"))
        except: pass

# ─── Application Ignition ─────────────────────────────────────────────────────
def main_entry():
    if not TOKEN:
        bot_logger.critical("❌ [CRITICAL]: DISCORD_TOKEN is absent.")
        return

    # 1. Sentinel Manifestation
    bot = ScribeBot()

    def handle_exit(sig, frame):
        bot_logger.info(f"🛡️ [SIGNAL]: {sig} detected. Commencing final extraction...")
        os._exit(0)
        
    signal.signal(signal.SIGTERM, handle_exit)
    signal.signal(signal.SIGINT, handle_exit)

    # 2. Execution (Single Pass Logic)
    try:
        bot_logger.info("🌐 [IGNITION]: Synchronizing with Discord Gateway...")
        bot.run(TOKEN, log_handler=None)
    except Exception as e:
        bot_logger.error(f"💀 [IGNITION]: Sentinel Fatal Flatline: {e}")
        raise 

    bot_logger.info("👋 [IGNITION]: Scribe process extinguished.")

if __name__ == '__main__':
    main_entry()
