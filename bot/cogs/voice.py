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

    async def check_authority(self, interaction: discord.Interaction, require_owner: bool = False):
        """Standard authority ritual for VC commands."""
        if not interaction.user.voice or not interaction.user.voice.channel:
            await interaction.response.send_message("❌ You must be in a voice channel to use this ritual!", ephemeral=True)
            return None
        
        channel = interaction.user.voice.channel
        owner_id = await self.get_owner(channel.id)
        
        # If no owner record, it's not a temp VC
        if not owner_id:
            await interaction.response.send_message("❌ This ritual can only be performed in temporary voice dungeons.", ephemeral=True)
            return None

        is_owner = owner_id == str(interaction.user.id)
        is_admin = interaction.user.guild_permissions.administrator

        if require_owner:
            if not is_owner and not is_admin:
                await interaction.response.send_message("❌ Only the dungeon host or a high admin can evoke this power!", ephemeral=True)
                return None
        else:
            # For general management, just being in the VC is enough (as requested)
            pass 

        return channel

    # ─── Commands ───

    @app_commands.command(name="vc-name", description="Rename your voice dungeon")
    @app_commands.describe(name="New name for the channel")
    async def vc_name(self, interaction: discord.Interaction, name: str):
        channel = await self.check_authority(interaction, require_owner=False)
        if not channel: return

        try:
            await channel.edit(name=name)
            await interaction.response.send_message(f"✅ Dungeon renamed to **{name}**", ephemeral=True)
            bot_logger.info(f"User {interaction.user.name} renamed VC {channel.id} to {name}.")
        except discord.HTTPException as e:
            await interaction.response.send_message(f"❌ Ritual failed: {e}", ephemeral=True)

    @app_commands.command(name="vc-status", description="Set a custom status for your voice dungeon")
    @app_commands.describe(status="Text to display as the VC status")
    async def vc_status(self, interaction: discord.Interaction, status: str):
        channel = await self.check_authority(interaction, require_owner=False)
        if not channel: return

        # Raw HTTP Ritual for undocumented Voice Status
        url = f"https://discord.com/api/v10/channels/{channel.id}/voice-status"
        headers = {
            "Authorization": f"Bot {self.bot.http.token}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.bot.http._HTTPClient__session.put(url, headers=headers, json={"status": status}) as resp:
                if resp.status == 204:
                    await interaction.response.send_message(f"✅ Status manifested: **{status}**", ephemeral=True)
                else:
                    await interaction.response.send_message("❌ The Discord gateway rejected the status change.", ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"❌ Failed to reach the status gateway: {e}", ephemeral=True)

    @app_commands.command(name="vc-lock", description="Lock your dungeon to prevent new entries")
    async def vc_lock(self, interaction: discord.Interaction):
        channel = await self.check_authority(interaction, require_owner=True)
        if not channel: return

        overwrite = channel.overwrites_for(interaction.guild.default_role)
        overwrite.connect = False
        try:
            await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
            await interaction.response.send_message("🔒 Dungeon locked. No new hunters can join.", ephemeral=True)
        except discord.HTTPException:
            await interaction.response.send_message("❌ Failed to lock channel.", ephemeral=True)

    @app_commands.command(name="vc-unlock", description="Unlock your dungeon for free entry")
    async def vc_unlock(self, interaction: discord.Interaction):
        channel = await self.check_authority(interaction, require_owner=True)
        if not channel: return

        overwrite = channel.overwrites_for(interaction.guild.default_role)
        overwrite.connect = True
        try:
            await channel.set_permissions(interaction.guild.default_role, overwrite=overwrite)
            await interaction.response.send_message("🔓 Dungeon unlocked. Hunters may enter freely.", ephemeral=True)
        except discord.HTTPException:
            await interaction.response.send_message("❌ Failed to unlock channel.", ephemeral=True)

    @app_commands.command(name="vc-kick", description="Eject a member from your dungeon")
    @app_commands.describe(member="Member to eject")
    async def vc_kick(self, interaction: discord.Interaction, member: discord.Member):
        channel = await self.check_authority(interaction, require_owner=True)
        if not channel: return

        if member.voice is None or member.voice.channel.id != channel.id:
            return await interaction.response.send_message("❌ That hunter is not within your dungeon walls.", ephemeral=True)

        try:
            await member.move_to(None, reason=f"Ejected by host {interaction.user}")
            await interaction.response.send_message(f"👢 **{member.display_name}** has been ejected from the dungeon.", ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message("❌ I lack the authority to eject that hunter.", ephemeral=True)

    @app_commands.command(name="vc-transfer", description="Transfer host power to another hunter in the dungeon")
    @app_commands.describe(member="New host")
    async def vc_transfer(self, interaction: discord.Interaction, member: discord.Member):
        channel = await self.check_authority(interaction, require_owner=False)
        if not channel: return

        if member.voice is None or member.voice.channel.id != channel.id:
            return await interaction.response.send_message("❌ The target must be inside the dungeon to receive host power.", ephemeral=True)

        pool = get_pool()
        if not pool: return
        async with pool.acquire() as conn:
            await conn.execute('UPDATE temp_voice_channels SET owner_id = $1 WHERE channel_id = $2', str(member.id), str(channel.id))
        
        await interaction.response.send_message(f"👑 Host power transferred to **{member.display_name}**.", ephemeral=True)

    @app_commands.command(name="vc-ban", description="Ban a hunter from entering your dungeon")
    @app_commands.describe(member="Member to ban")
    async def vc_ban(self, interaction: discord.Interaction, member: discord.Member):
        channel = await self.check_authority(interaction, require_owner=True)
        if not channel: return

        try:
            # Deny connect permission
            await channel.set_permissions(member, connect=False, reason=f"Banned by {interaction.user}")
            
            # Kick if currently inside
            if member.voice and member.voice.channel.id == channel.id:
                await member.move_to(None)
                
            await interaction.response.send_message(f"🚫 **{member.display_name}** has been banned from this dungeon.", ephemeral=True)
        except discord.HTTPException:
            await interaction.response.send_message("❌ Failed to manifest the ban.", ephemeral=True)

    @app_commands.command(name="vc-unban", description="Revoke a dungeon ban for a hunter")
    @app_commands.describe(member="Member to unban")
    async def vc_unban(self, interaction: discord.Interaction, member: discord.Member):
        channel = await self.check_authority(interaction, require_owner=False)
        if not channel: return

        try:
            await channel.set_permissions(member, overwrite=None, reason=f"Unbanned by {interaction.user}")
            await interaction.response.send_message(f"✅ Ban revoked for **{member.display_name}**.", ephemeral=True)
        except discord.HTTPException:
            await interaction.response.send_message("❌ Failed to revoke the ban.", ephemeral=True)

    @app_commands.command(name="vc-limit", description="Set hunter capacity for your dungeon")
    @app_commands.describe(limit="Capacity (0 to 99)")
    async def vc_limit(self, interaction: discord.Interaction, limit: int):
        channel = await self.check_authority(interaction, require_owner=True)
        if not channel: return
        
        if limit < 0 or limit > 99:
            return await interaction.response.send_message("Capacity must be between 0 and 99.", ephemeral=True)

        try:
            await channel.edit(user_limit=limit)
            await interaction.response.send_message(f"✅ Dungeon capacity set to **{limit}**.", ephemeral=True)
        except discord.HTTPException:
            await interaction.response.send_message("❌ Failed to change capacity.", ephemeral=True)

    @app_commands.command(name="vc-invite", description="Summon a hunter to your dungeon (even if locked)")
    @app_commands.describe(member="Hunter to summon")
    async def vc_invite(self, interaction: discord.Interaction, member: discord.Member):
        channel = await self.check_authority(interaction, require_owner=False)
        if not channel: return

        try:
            # 1. Grant explicit connect permission in case room is locked
            await channel.set_permissions(member, connect=True, reason=f"Invited by {interaction.user}")

            # 2. Manifest Invite
            invite = await channel.create_invite(max_age=3600, max_uses=1)
            embed = create_dungeon_embed("⚔️ DUNGEON INVITATION", f"You have been summoned to join **{interaction.user.display_name}**'s party!")
            embed.add_field(name="Dungeon", value=f"`{channel.name}`", inline=True)
            embed.add_field(name="Portal", value=f"[ENTER NOW]({invite.url})", inline=True)
            embed.set_thumbnail(url=interaction.guild.icon.url if interaction.guild.icon else None)
            
            await member.send(embed=embed)
            await interaction.response.send_message(f"✅ Summon sent to **{member.display_name}**. (Access granted)", ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message(f"❌ Could not reach **{member.display_name}**. (Their DMs are barred)", ephemeral=True)
        except Exception as e:
            bot_logger.error(f"Invite Error: {e}")
            await interaction.response.send_message("❌ Encountered an anomaly while creating the portal.", ephemeral=True)

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

                # ── Session Management (XP & Residency) ──
                
                # 1. Departure Ritual (Leave / Solo Stop)
                if before.channel and (not after.channel or before.channel.id != after.channel.id):
                    # Close session for the person leaving
                    await self._terminate_session(conn, member, guild_id, before.channel.id, config)

                    # anti-abuse: If only one person left, close their session too
                    remaining_hunters = [m for m in before.channel.members if not m.bot]
                    if len(remaining_hunters) == 1:
                        solo_hunter = remaining_hunters[0]
                        await self._terminate_session(conn, solo_hunter, guild_id, before.channel.id, config)

                    # Auto Delete (Legacy Temp VC Logic)
                    if config['auto_delete_empty'] and len(before.channel.members) == 0:
                        is_temp = await conn.fetchrow('SELECT 1 FROM temp_voice_channels WHERE channel_id = $1', str(before.channel.id))
                        if is_temp:
                            try:
                                await before.channel.delete()
                                await conn.execute('DELETE FROM temp_voice_channels WHERE channel_id = $1', str(before.channel.id))
                                await safe_emit('vc_deleted', {'guildId': guild_id, 'channelId': str(before.channel.id)})
                            except (discord.NotFound, discord.HTTPException): pass

                # 2. Arrival Ritual (Join / Group Start)
                if after.channel and (not before.channel or before.channel.id != after.channel.id):
                    active_hunters = [m for m in after.channel.members if not m.bot]
                    
                    # XP triggers if there is a party (2+ hunters)
                    if len(active_hunters) >= 2:
                        for hunter in active_hunters:
                            await conn.execute(
                                '''
                                INSERT INTO study_sessions (user_id, guild_id, channel_id, join_time) 
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT (user_id, guild_id, channel_id) WHERE leave_time IS NULL DO NOTHING
                                ''',
                                str(hunter.id), guild_id, str(after.channel.id), datetime.now(timezone.utc)
                            )
        except Exception as e:
            bot_logger.error(f"Error in on_voice_state_update: {e}")

async def setup(bot):
    await bot.add_cog(VoiceSetup(bot))
