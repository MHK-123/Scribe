import discord
from discord import app_commands
from discord.ext import commands
from datetime import datetime, timezone
import math

from bot.core.database import get_pool
from bot.core.socket_client import safe_emit
from bot.utils.embeds import create_dungeon_embed, create_error_embed
from bot.utils.logger import bot_logger

class VoiceSetup(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    async def get_owner(self, channel_id: int):
        pool = get_pool()
        if not pool: return None
        async with pool.acquire() as conn:
            return await conn.fetchval('SELECT owner_id FROM temp_voice_channels WHERE channel_id = $1', str(channel_id))

    # ─── Slash Commands ───
    @app_commands.command(name="vc-rename", description="Rename your temp voice channel")
    @app_commands.describe(name="New name for the channel")
    async def vc_rename(self, interaction: discord.Interaction, name: str):
        if not interaction.user.voice:
            return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
        
        channel = interaction.user.voice.channel
        owner = await self.get_owner(channel.id)
        if not owner or owner != str(interaction.user.id):
            return await interaction.response.send_message("Only the room owner can rename this dungeon!", ephemeral=True)

        try:
            await channel.edit(name=name)
            await interaction.response.send_message(f"✅ Dungeon renamed to **{name}**", ephemeral=True)
            bot_logger.info(f"User {interaction.user.name} renamed VC {channel.id} to {name}.")
        except discord.HTTPException as e:
            bot_logger.error(f"Failed to edit channel name: {e}")
            await interaction.response.send_message("❌ Failed to rename channel.", ephemeral=True)

    @app_commands.command(name="vc-lock", description="Lock your temp voice channel")
    async def vc_lock(self, interaction: discord.Interaction):
        if not interaction.user.voice:
            return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
        
        channel = interaction.user.voice.channel
        owner = await self.get_owner(channel.id)
        if not owner or owner != str(interaction.user.id):
            return await interaction.response.send_message("Only the room owner can lock this dungeon!", ephemeral=True)

        overwrite = channel.overwrites_for(interaction.guild.default_role)
        overwrite.connect = False
        try:
            await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
            await interaction.response.send_message("🔓 Dungeon locked. No new hunters can join.", ephemeral=True)
        except discord.HTTPException as e:
            await interaction.response.send_message("❌ Failed to lock channel.", ephemeral=True)

    @app_commands.command(name="vc-unlock", description="Unlock your temp voice channel")
    async def vc_unlock(self, interaction: discord.Interaction):
        if not interaction.user.voice:
            return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
        
        channel = interaction.user.voice.channel
        owner = await self.get_owner(channel.id)
        if not owner or owner != str(interaction.user.id):
            return await interaction.response.send_message("Only the room owner can unlock this dungeon!", ephemeral=True)

        overwrite = channel.overwrites_for(interaction.guild.default_role)
        overwrite.connect = True
        try:
            await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
            await interaction.response.send_message("🔓 Dungeon unlocked. Hunters may enter freely.", ephemeral=True)
        except discord.HTTPException as e:
            await interaction.response.send_message("❌ Failed to unlock channel.", ephemeral=True)

    @app_commands.command(name="vc-limit", description="Set member limit for your temp voice channel")
    @app_commands.describe(limit="Member limit (0 to 99)")
    async def vc_limit(self, interaction: discord.Interaction, limit: int):
        if not interaction.user.voice:
            return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
        
        if limit < 0 or limit > 99:
            return await interaction.response.send_message("Limit must be between 0 and 99.", ephemeral=True)

        channel = interaction.user.voice.channel
        owner = await self.get_owner(channel.id)
        if not owner or owner != str(interaction.user.id):
            return await interaction.response.send_message("Only the room owner can modify this dungeon!", ephemeral=True)

        try:
            await channel.edit(user_limit=limit)
            await interaction.response.send_message(f"✅ Member limit set to **{limit}**.", ephemeral=True)
        except discord.HTTPException as e:
            await interaction.response.send_message("❌ Failed to change limit.", ephemeral=True)

    @app_commands.command(name="vc-invite", description="Send a styled invite to a hunter in DMs")
    @app_commands.describe(member="Member to invite")
    async def vc_invite(self, interaction: discord.Interaction, member: discord.Member):
        if not interaction.user.voice:
            return await interaction.response.send_message("You must be in a voice channel!", ephemeral=True)
        
        channel = interaction.user.voice.channel
        try:
            invite = await channel.create_invite(max_age=3600, max_uses=1)
            embed = create_dungeon_embed("⚔️ DUNGEON INVITATION", f"You have been summoned to join **{interaction.user.display_name}**'s party!")
            embed.add_field(name="Channel", value=f"`{channel.name}`", inline=True)
            embed.add_field(name="Link", value=f"[JOIN NOW]({invite.url})", inline=True)
            embed.set_thumbnail(url=interaction.guild.icon.url if interaction.guild.icon else None)
            
            await member.send(embed=embed)
            await interaction.response.send_message(f"✅ Summon sent to **{member.display_name}**.", ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message(f"❌ Could not reach **{member.display_name}**. (DMs closed)", ephemeral=True)
        except ValueError as e:
            bot_logger.error(f"Invite Error: {e}")

    # ─── XP Processing ───
    async def _process_xp(self, conn, member: discord.Member, guild_id: str, xp_gained: int, hours_gained: float, config):
        row = await conn.fetchrow(
            '''
            INSERT INTO user_levels (user_id, guild_id, total_xp, total_study_hours)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, guild_id) DO UPDATE
                SET total_xp          = user_levels.total_xp + EXCLUDED.total_xp,
                    total_study_hours = user_levels.total_study_hours + EXCLUDED.total_study_hours,
                    last_updated      = CURRENT_TIMESTAMP
            RETURNING total_xp, total_study_hours, level
            ''',
            str(member.id), guild_id, xp_gained, hours_gained
        )

        total_xp    = row['total_xp']
        total_hours = float(row['total_study_hours'])
        old_level   = row['level']
        new_level   = int(math.sqrt(total_xp / 100))

        if new_level > old_level:
            await conn.execute(
                'UPDATE user_levels SET level = $1 WHERE user_id = $2 AND guild_id = $3',
                new_level, str(member.id), guild_id
            )
            await safe_emit('user_level_up', {
                'guildId': guild_id,
                'userId': str(member.id),
                'level': new_level,
                'xp': total_xp,
            })

        rewards = await conn.fetch(
            '''
            SELECT required_hours, role_id FROM study_role_rewards
            WHERE guild_id = $1 AND required_hours <= $2
            ORDER BY required_hours DESC
            ''',
            guild_id, total_hours
        )

        for reward in rewards:
            role = member.guild.get_role(int(reward['role_id']))
            if role and role not in member.roles:
                try:
                    await member.add_roles(role)
                    await safe_emit('role_reward_earned', {
                        'guildId': guild_id,
                        'userId': str(member.id),
                        'roleId': str(role.id),
                        'hours': float(reward['required_hours']),
                    })
                    if config and config['announcement_channel_id']:
                        channel = member.guild.get_channel(int(config['announcement_channel_id']))
                        if channel:
                            await channel.send(
                                f'⚔️ **System Notification** | {member.mention}, you have reached '
                                f'`{float(reward["required_hours"])}h` and earned the **{role.name}** rank!'
                            )
                except discord.HTTPException as e:
                    bot_logger.error(f'Failed to assign role reward {role.name}: {e}')

    async def _terminate_session(self, conn, member: discord.Member, guild_id: str, channel_id: int, config):
        """Internal ritual to finalize a focus session and bestow XP."""
        leave_time = datetime.now(timezone.utc)
        session = await conn.fetchrow(
            '''
            SELECT id, join_time FROM study_sessions
            WHERE user_id = $1 AND guild_id = $2 AND channel_id = $3 AND leave_time IS NULL
            ''',
            str(member.id), guild_id, str(channel_id)
        )

        if session:
            duration    = int((leave_time - session['join_time']).total_seconds())
            minutes     = duration // 60
            xp_gained   = minutes * 10
            hours_gained = duration / 3600.0

            await conn.execute(
                'UPDATE study_sessions SET leave_time = $1, duration = $2 WHERE id = $3',
                leave_time, duration, session['id']
            )

            if xp_gained > 0:
                await self._process_xp(conn, member, guild_id, xp_gained, hours_gained, config)

    # ─── Event Handlers ───
    @commands.Cog.listener()
    async def on_voice_state_update(self, member: discord.Member, before: discord.VoiceState, after: discord.VoiceState):
        if member.bot:
            return
        pool = get_pool()
        if not pool:
            return

        guild_id = str(member.guild.id)
        
        # Fire events to pomodoro manager if it exists
        if hasattr(self.bot, 'pomodoro_manager') and self.bot.pomodoro_manager:
            try:
                if after.channel and (not before.channel or before.channel.id != after.channel.id):
                    await self.bot.pomodoro_manager.on_member_join_vc(member, after.channel)
                if before.channel and (not after.channel or before.channel.id != after.channel.id):
                    await self.bot.pomodoro_manager.on_member_leave_vc(member, before.channel)
            except Exception as e:
                bot_logger.error(f'Pomodoro hook failed gracefully (Voice event continuation): {e}')

        try:
            async with pool.acquire() as conn:
                config = await conn.fetchrow('SELECT * FROM guild_configs WHERE guild_id = $1', guild_id)
                if not config:
                    return

                # ── Join-to-Create ──
                join_channel = config['join_to_create_channel']
                if after.channel and str(after.channel.id) == join_channel:
                    category_id = config['temp_vc_category']
                    category    = member.guild.get_channel(int(category_id)) if category_id else None
                    template    = config['vc_name_template'] or "{username}'s Dungeon"
                    vc_name     = template.replace('{username}', member.display_name)

                    try:
                        new_vc = await member.guild.create_voice_channel(
                            name=vc_name,
                            category=category,
                            user_limit=config['default_user_limit'] or 0,
                        )
                        await member.move_to(new_vc)
                        await conn.execute(
                            'INSERT INTO temp_voice_channels (channel_id, guild_id, owner_id) VALUES ($1, $2, $3)',
                            str(new_vc.id), guild_id, str(member.id)
                        )
                        
                        await safe_emit('vc_created', {
                            'guildId': guild_id,
                            'channelId': str(new_vc.id),
                            'owner': member.display_name,
                        })
                    except discord.HTTPException as e:
                        bot_logger.error(f'Failed to create temp VC: {e}')

                # ── Session Open (Join) ──
                if after.channel:
                    is_temp = await conn.fetchrow('SELECT 1 FROM temp_voice_channels WHERE channel_id = $1', str(after.channel.id))
                    if is_temp:
                        # Only start session if there are at least 2 people (including joining member)
                        active_members = [m for m in after.channel.members if not m.bot]
                        if len(active_members) >= 2:
                            # Start session for the joining member
                            await conn.execute(
                                '''
                                INSERT INTO study_sessions (user_id, guild_id, channel_id, join_time) 
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT DO NOTHING
                                ''',
                                str(member.id), guild_id, str(after.channel.id), datetime.now(timezone.utc)
                            )
                            # Also ensure everyone else in the channel has an active session
                            for m in active_members:
                                if m.id == member.id: continue
                                await conn.execute(
                                    '''
                                    INSERT INTO study_sessions (user_id, guild_id, channel_id, join_time)
                                    VALUES ($1, $2, $3, $4)
                                    ON CONFLICT DO NOTHING
                                    ''',
                                    str(m.id), guild_id, str(after.channel.id), datetime.now(timezone.utc)
                                )

                # ── Session Close (Leave / Solo Stop) ──
                if before.channel:
                    # 1. Close session for the person leaving
                    await self._terminate_session(conn, member, guild_id, before.channel.id, config)

                    # 2. If only one person left, close their session too
                    remaining_members = [m for m in before.channel.members if not m.bot]
                    if len(remaining_members) == 1:
                        solo_member = remaining_members[0]
                        await self._terminate_session(conn, solo_member, guild_id, before.channel.id, config)

                    # ── Auto Delete ──
                    if config['auto_delete_empty'] and len(before.channel.members) == 0:
                        is_temp = await conn.fetchrow('SELECT 1 FROM temp_voice_channels WHERE channel_id = $1', str(before.channel.id))
                        if is_temp:
                            try:
                                await before.channel.delete()
                                await conn.execute('DELETE FROM temp_voice_channels WHERE channel_id = $1', str(before.channel.id))
                                await safe_emit('vc_deleted', {
                                    'guildId': guild_id,
                                    'channelId': str(before.channel.id),
                                })
                            except discord.NotFound:
                                bot_logger.warning("Channel already deleted before deletion could execute.")
                            except discord.HTTPException as e:
                                bot_logger.error(f'Failed to delete temp VC: {e}')

                # ── Session Open (Join) ──
                if after.channel:
                    is_temp = await conn.fetchrow('SELECT 1 FROM temp_voice_channels WHERE channel_id = $1', str(after.channel.id))
                    if is_temp:
                        await conn.execute(
                            'INSERT INTO study_sessions (user_id, guild_id, channel_id, join_time) VALUES ($1, $2, $3, $4)',
                            str(member.id), guild_id, str(after.channel.id), datetime.now(timezone.utc)
                        )
        except Exception as e:
            bot_logger.error(f"Error in on_voice_state_update: {e}")

async def setup(bot):
    await bot.add_cog(VoiceSetup(bot))
