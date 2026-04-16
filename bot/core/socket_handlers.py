import asyncio
import discord
from bot.utils.logger import bot_logger
from bot.utils.embeds import create_dungeon_embed

def register_socket_events(bot, sio):
    """Manifest the ears of the Sentinel to listen for backend signals."""

    @sio.on('process_monthly_roles')
    async def on_process_monthly_roles(data):
        guild_id = data.get('guildId')
        month = data.get('month')
        year = data.get('year')
        
        if not guild_id: return
        
        bot_logger.info(f"🧹 [SOCKET]: Initiating Monthly Role Purification for Realm {guild_id}...")
        
        guild = bot.get_guild(int(guild_id))
        if not guild:
            bot_logger.error(f"❌ [SOCKET]: Could not manifest Realm {guild_id} for role stripping.")
            return

        # 1. Resolve Target Roles (Top Ranks + Study Rewards/Level Up roles)
        target_role_ids = set()
        pool = getattr(bot, 'pool', None)
        if not pool: return

        async with pool.acquire() as conn:
            # Fetch Top Leaderboard Roles
            config = await conn.fetchrow('SELECT top1_role_id, top2_role_id, top3_role_id, top10_role_id FROM guild_configs WHERE guild_id = $1', str(guild_id))
            if config:
                for key in ['top1_role_id', 'top2_role_id', 'top3_role_id', 'top10_role_id']:
                    if config[key]: target_role_ids.add(int(config[key]))
            
            # Fetch All Study Level Reward Roles
            rewards = await conn.fetch('SELECT role_id FROM study_role_rewards WHERE guild_id = $1', str(guild_id))
            for r in rewards:
                target_role_ids.add(int(r['role_id']))

        if not target_role_ids:
            bot_logger.info(f"✅ [SOCKET]: No Level Roles found to strip in Realm {guild_id}.")
            return

        # 2. Batched Role Removal
        bot_logger.info(f"🛡️ [SOCKET]: Stripping {len(target_role_ids)} unique level roles from all hunters in {guild.name}.")
        
        count = 0
        for member in guild.members:
            roles_to_remove = [r for r in member.roles if r.id in target_role_ids]
            if roles_to_remove:
                try:
                    await member.remove_roles(*roles_to_remove, reason="Monthly Reset Ritual")
                    count += 1
                    # Prevent gateway flood
                    if count % 10 == 0: await asyncio.sleep(1)
                except Exception as e:
                    bot_logger.error(f"⚠️ [SOCKET]: Failed to strip roles from {member.name}: {e}")

        bot_logger.info(f"✅ [SOCKET]: Purified {count} hunters in Realm {guild_id}.")

    @sio.on('guild_monthly_reset')
    async def on_guild_monthly_reset(data):
        guild_id = data.get('guildId')
        if not guild_id: return
        
        guild = bot.get_guild(int(guild_id))
        if not guild: return

        # Optional: Send announcement embed
        bot_logger.info(f"📢 [SOCKET]: Reset Announcement Ritual for {guild.name}")
        
        async with bot.pool.acquire() as conn:
            config = await conn.fetchrow('SELECT announcement_channel_id FROM guild_configs WHERE guild_id = $1', str(guild_id))
            if config and config['announcement_channel_id']:
                channel = guild.get_channel(int(config['announcement_channel_id']))
                if channel:
                    embed = create_dungeon_embed(
                        "🌘 REALM PURIFICATION COMPLETE",
                        "The monthly cycle has ended. All hunter XP, levels, and roles have been returned to the void.\n\n"
                        "**A new season of focus begins now.**"
                    )
                    embed.set_thumbnail(url="https://i.imgur.com/8Q9S8Xj.png") # Moon/Reset Icon
                    try:
                        await channel.send(embed=embed)
                    except: pass
