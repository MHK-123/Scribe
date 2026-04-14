import discord
from discord import app_commands
from discord.ext import commands
from bot.core.database import get_pool
from bot.utils.embeds import create_dungeon_embed
from bot.utils.logger import bot_logger
from bot.config import Settings
import math

class StatsHunter(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name='l')
    async def leaderboard_cmd(self, ctx):
        """View the Hunter leaderboard."""
        await self.show_leaderboard(ctx.message)

    @commands.command(name='m')
    async def profile_cmd(self, ctx):
        """View your Hunter stats."""
        await self.show_profile(ctx.message)

    @app_commands.command(name="rank", description="Displays the global top hunters leaderboard")
    async def rank_slash(self, interaction: discord.Interaction):
        """Slash version of leaderboard."""
        await self.show_leaderboard(interaction)

    @app_commands.command(name="level", description="Displays your personal huntsman player card")
    async def level_slash(self, interaction: discord.Interaction):
        """Slash version of profile."""
        await self.show_profile(interaction)

    async def _check_channel_restrictions(self, source):
        """Returns True if command is allowed, False otherwise. Handles Message or Interaction."""
        is_interaction = isinstance(source, discord.Interaction)
        guild = source.guild
        channel = source.channel
        user = source.user if is_interaction else source.author

        pool = get_pool()
        if not pool:
            return False

        try:
            async with pool.acquire() as conn:
                config = await conn.fetchrow('SELECT bot_command_channel_id FROM guild_configs WHERE guild_id = $1', str(guild.id))
        except Exception as e:
            bot_logger.error(f"[StatsHunter] Error fetching: {e}")
            return False

        if config and config['bot_command_channel_id']:
            allowed_channel = str(config['bot_command_channel_id'])
            current_channel = str(channel.id)
            
            if current_channel != allowed_channel:
                msg = f"❌ **Blocked:** Commands must only be used in <#{allowed_channel}> to preserve focus."
                try:
                    if is_interaction:
                        await source.response.send_message(msg, ephemeral=True)
                    else:
                        await source.delete()
                        await user.send(msg)
                except:
                    pass
                return False
        return True

    async def _send_response(self, source, embed=None, content=None):
        """Unified response ritual for both contexts."""
        if isinstance(source, discord.Interaction):
            await source.response.send_message(content=content, embed=embed)
        else:
            await source.channel.send(content=content, embed=embed)

    async def show_leaderboard(self, source):
        if not await self._check_channel_restrictions(source):
            return

        pool = get_pool()
        if not pool:
            return await self._send_response(source, content="System is currently experiencing database latency.")
            
        guild_id = str(source.guild.id)
        try:
            async with pool.acquire() as conn:
                # 1. Manifest Data Ritual (Filtering Ghost Hunters)
                hunters = await conn.fetch(
                    '''
                    SELECT user_id, total_study_hours, level, total_xp
                    FROM user_levels
                    WHERE guild_id = $1 
                      AND level > 0 
                      AND total_xp > 0 
                      AND total_study_hours > 0
                    ORDER BY total_study_hours DESC
                    ''',
                    guild_id
                )

            if not hunters:
                embed = create_dungeon_embed("⚔️ RANKING: TOP HUNTERS", "No qualified hunters have manifested in this realm yet.")
                return await self._send_response(source, embed=embed)

            # 2. Ignite Pagination View
            invoker = source.user if isinstance(source, discord.Interaction) else source.author
            view = LeaderboardView(hunters, invoker)
            embed = view.create_embed()
            
            if isinstance(source, discord.Interaction):
                await source.response.send_message(embed=embed, view=view)
            else:
                await source.channel.send(embed=embed, view=view)

        except Exception as e:
            bot_logger.error(f"Leaderboard Manifestation Error: {e}")

    async def show_profile(self, source, ephemeral=False):
        """Generates the premium Solo Leveling inspired Hunter Registry card."""
        if not await self._check_channel_restrictions(source):
            return

        pool = get_pool()
        if not pool:
            return await self._send_response(source, content="System is currently experiencing database latency.")
            
        guild_id = str(source.guild.id)
        # Handle interaction vs message
        invoker = source.user if isinstance(source, discord.Interaction) else source.author
        user_id = str(invoker.id)
        
        try:
            async with pool.acquire() as conn:
                # 1. Fetch Core Stats
                row = await conn.fetchrow(
                    'SELECT total_xp, level, total_study_hours FROM user_levels WHERE guild_id = $1 AND user_id = $2',
                    guild_id, user_id
                )
                
                # 2. Fetch Session History (Total Raids)
                session_count = await conn.fetchval(
                    'SELECT COUNT(*) FROM study_sessions WHERE guild_id = $1 AND user_id = $2',
                    guild_id, user_id
                )
            
            if not row:
                return await self._send_response(source, content="No hunter stats found. Manifest in a VC to ignite your registry.")

            # ── Data Calculations ──
            lvl   = row['level']
            hours = float(row['total_study_hours'])
            xp    = row['total_xp']
            
            # XP Progression Logic
            base_xp = (lvl ** 2) * 100
            next_xp = ((lvl + 1) ** 2) * 100
            xp_in_lvl = xp - base_xp
            xp_needed = next_xp - base_xp
            progress_ratio = max(0, min(xp_in_lvl / xp_needed, 1.0)) if xp_needed > 0 else 1.0
            
            # Progress Bar (10 segments)
            filled = int(progress_ratio * 10)
            bar = "▰" * filled + "▱" * (10 - filled)
            
            # Rank System
            rank, emoji, color = self._get_rank_info(lvl)
            
            # Dynamic Status Determination
            status = "IDLE"
            location = "None"
            member = source.guild.get_member(invoker.id)
            
            if member and member.voice:
                location = member.voice.channel.name
                status = "ACTIVE HUNTER"
                # Check for active Pomodoro (Raid)
                pomo_manager = self.bot.get_cog('PomodoroManager')
                if pomo_manager:
                    for session in pomo_manager.sessions.values():
                        if invoker.id in session.participants:
                            status = "RAID IN PROGRESS"
                            break

            # ── Embed Construction ──
            embed = discord.Embed(
                title=f"🛡️ {invoker.display_name} // HUNTER CARD", 
                color=color
            )
            if invoker.display_avatar:
                embed.set_thumbnail(url=invoker.display_avatar.url)
            
            # Status & Identity Block
            status_emoji = "🔴" if "RAID" in status else "🟢" if "ACTIVE" in status else "⚪"
            embed.description = (
                f"{status_emoji} **STATUS:** {status}\n"
                f"🧬 <@{user_id}> (Verified)"
            )
            
            # XP Progression Block
            xp_block = (
                f"**XP PROGRESS** `{bar}` **{int(progress_ratio*100)}%**\n"
                f"`{xp_in_lvl:,} / {xp_needed:,} XP` (Total study XP: {xp:,})"
            )
            embed.add_field(name="🧬 PROGRESSION", value=xp_block, inline=False)
            
            # Stats Grid (Clean Single Line)
            grid = (
                f"```autohotkey\n"
                f"RANK    | LEVEL | RAIDS | HOURS\n"
                f"{rank:<7} | {lvl:<5} | {session_count:<5} | {hours:<5.1f}h\n"
                f"```"
            )
            embed.add_field(name="⚔️ SYSTEM STATS", value=grid, inline=False)
            
            # Identity Data
            join_date = member.joined_at.strftime("%Y-%m-%d") if member and member.joined_at else "Unknown"
            embed.add_field(
                name="📅 IDENTITY DATA", 
                value=f"**Dungeon:** `{location}`\n**Joined:** `{join_date}` | **Registry ID:** `U-{user_id[-4:]}`", 
                inline=False
            )
            
            # Remove image to avoid dominating the card
            # embed.set_image(url=Settings.BACKGROUND_URL)
            
            # ── Interaction View ──
            view = PlayerCardView(self, source)
            
            if isinstance(source, discord.Interaction):
                if source.response.is_done():
                    await source.followup.send(embed=embed, view=view, ephemeral=ephemeral)
                else:
                    await source.response.send_message(embed=embed, view=view, ephemeral=ephemeral)
            else:
                await source.channel.send(embed=embed, view=view)

        except Exception as e:
            bot_logger.error(f"Error manifesting player card: {e}")

    def _get_rank_info(self, level):
        """Returns (Rank_Name, Emoji, Color)."""
        if level >= 80: return ("S-RANK", "👑", 0xffd700) # Gold
        if level >= 60: return ("A-RANK", "💎", 0x00ffff) # Cyan
        if level >= 40: return ("B-RANK", "🔥", 0xff4500) # OrangeRed
        if level >= 20: return ("C-RANK", "⚔️", 0x9370db) # Purple
        if level >= 10: return ("D-RANK", "🏹", 0x32cd32) # Green
        return ("E-RANK", "🛡️", 0x808080) # Grey

class PlayerCardView(discord.ui.View):
    def __init__(self, cog, source):
        super().__init__(timeout=60)
        self.cog = cog
        self.source = source
        self.user = source.user if isinstance(source, discord.Interaction) else source.author

    @discord.ui.button(label="🔄 Refresh", style=discord.ButtonStyle.secondary)
    async def refresh_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id != self.user.id:
            return await interaction.response.send_message("This is not your registry.", ephemeral=True)
        # Update the profile view
        await self.cog.show_profile(interaction, ephemeral=True)

    @discord.ui.button(label="⚔️ Rankings", style=discord.ButtonStyle.secondary)
    async def rankings_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.cog.show_leaderboard(interaction)

    @discord.ui.button(label="🏹 Start Raid", style=discord.ButtonStyle.success)
    async def start_raid_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        msg = (
            "🛡️ **How to start a Raid:**\n"
            "1. Enter a configured **Focus VC**.\n"
            "2. The Scribe System will auto-ignite a Pomodoro session.\n"
            "3. Or use `/pomodoro start` to manually ignite the ritual."
        )
        await interaction.response.send_message(msg, ephemeral=True)

class LeaderboardView(discord.ui.View):
    def __init__(self, hunters, invoker):
        # ── Initialization Ritual ──
        super().__init__(timeout=60)
        self.hunters = hunters
        self.invoker = invoker
        self.current_page = 0
        self.per_page = 10
        self.total_pages = math.ceil(len(hunters) / self.per_page)

    def create_embed(self):
        embed = discord.Embed(
            title="⚔️ RANKING: TOP HUNTERS",
            color=0x4b8bf5
        )
        
        start = self.current_page * self.per_page
        end = start + self.per_page
        page_hunters = self.hunters[start:end]
        
        # ── Table Construction ──
        # Header: Rank   Hunter           Level | Time
        table_header = "Rank   Hunter           Level | Time\n"
        table_divider = "────── ──────────────── ─────── ──────\n"
        
        rows = []
        for i, hunter in enumerate(page_hunters, start + 1):
            try:
                user_id = int(hunter['user_id'])
                lvl = hunter['level']
                hours = float(hunter['total_study_hours'])
            except (KeyError, TypeError, ValueError):
                continue
                
            # Icon Selection
            if i == 1: icon = "🏆"
            elif i == 2: icon = "🥈"
            elif i == 3: icon = "🥉"
            else: icon = "  "
            
            rank_col = f"{icon} #{i:<2}"
            
            # Name Resolution
            user = self.invoker.guild.get_member(user_id) if self.invoker.guild else None
            name = f"@{user.display_name}" if user else f"Hunter_{str(user_id)[-4:]}"
            name_col = f"{name[:16]:<16}"
            
            lvl_col = f"Lvl {lvl:<2}"
            time_col = f"{hours:>5.1f}h"
            
            rows.append(f"{rank_col} {name_col} {lvl_col:<7} | {time_col}")

        if not rows:
            embed.description = "*No hunters Manifested in this page.*"
        else:
            table_content = "\n".join(rows)
            # Use autohotkey formatting for soft blue highlighting on the structure
            embed.description = f"```autohotkey\n{table_header}{table_divider}{table_content}\n```"

        embed.set_footer(text=f"Page {self.current_page + 1}/{self.total_pages} • Total Hunters: {len(self.hunters)}")
        self.update_buttons()
        return embed

    def update_buttons(self):
        self.prev_button.disabled = self.current_page == 0
        self.next_button.disabled = self.current_page >= self.total_pages - 1

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # Safety Guard: Ensure context is resolved
        if not interaction.user:
            return False
            
        if interaction.user.id != self.invoker.id:
            try:
                await interaction.response.send_message("❌ This ritual can only be controlled by the invoker.", ephemeral=True)
            except:
                pass
            return False
        return True

    @discord.ui.button(label="◀️ Previous", style=discord.ButtonStyle.secondary)
    async def prev_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page -= 1
        await interaction.response.edit_message(embed=self.create_embed(), view=self)

    @discord.ui.button(label="Next ▶️", style=discord.ButtonStyle.secondary)
    async def next_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page += 1
        await interaction.response.edit_message(embed=self.create_embed(), view=self)


async def setup(bot):
    await bot.add_cog(StatsHunter(bot))
