import discord
from discord.ext import commands
from bot.core.database import get_pool
from bot.utils.embeds import create_dungeon_embed
from bot.utils.logger import bot_logger
from bot.config import Settings

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

    async def _check_channel_restrictions(self, message):
        """Returns True if the command is allowed in this channel, False otherwise."""
        # We no longer bypass for admins/managers because the user wants strict enforcement
        # If no config is found, we allow it.
        pool = get_pool()
        if not pool:
            bot_logger.error("[StatsHunter] Database pool unavailable for restriction check.")
            return False # FAIL-CLOSED

        try:
            async with pool.acquire() as conn:
                config = await conn.fetchrow('SELECT bot_command_channel_id FROM guild_configs WHERE guild_id = $1', str(message.guild.id))
        except Exception as e:
            bot_logger.error(f"[StatsHunter] Error fetching command restriction: {e}")
            return False # FAIL-CLOSED

        if config and config['bot_command_channel_id']:
            allowed_channel = str(config['bot_command_channel_id'])
            current_channel = str(message.channel.id)
            
            # Debug log to terminal for owner verification
            print(f"[RESTR] Hunter {message.author.name} (Admin={message.author.guild_permissions.administrator}) is in {current_channel}. Needs: {allowed_channel}")
            
            if current_channel != allowed_channel:
                try:
                    await message.delete()
                    await message.author.send(f"❌ **Blocked:** Commands must only be used in <#{allowed_channel}> to preserve focus.")
                except discord.HTTPException:
                    pass
                return False
        return True

    async def show_leaderboard(self, message):
        if not await self._check_channel_restrictions(message):
            return

        pool = get_pool()
        if not pool:
            return await message.channel.send("System is currently experiencing database latency.")
            
        guild_id = str(message.guild.id)
        try:
            async with pool.acquire() as conn:
                top_hunters = await conn.fetch(
                    '''
                    SELECT user_id, total_study_hours, level
                    FROM user_levels
                    WHERE guild_id = $1
                    ORDER BY total_study_hours DESC
                    LIMIT 10
                    ''',
                    guild_id
                )

            embed = create_dungeon_embed("RANKING: TOP HUNTERS", "Top hunters by focus time.")
            
            if not top_hunters:
                embed.description = "```\nNo hunters found in this realm yet.\n```"
            else:
                ranks = []
                users = []
                stats = []
                
                for i, row in enumerate(top_hunters, 1):
                    ranks.append(f"`#{i}`")
                    users.append(f"<@{row['user_id']}>")
                    stats.append(f"`Lvl {row['level']} | {float(row['total_study_hours']):.1f}h`")
                
                embed.add_field(name="Rank", value="\n".join(ranks), inline=True)
                embed.add_field(name="Hunter", value="\n".join(users), inline=True)
                embed.add_field(name="Level | Time", value="\n".join(stats), inline=True)

            await message.channel.send(embed=embed)
        except Exception as e:
            bot_logger.error(f"Error fetching leaderboard: {e}")

    async def show_profile(self, message):
        if not await self._check_channel_restrictions(message):
            return

        pool = get_pool()
        if not pool:
            return await message.channel.send("System is currently experiencing database latency.")
            
        guild_id = str(message.guild.id)
        user_id = str(message.author.id)
        
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    'SELECT * FROM user_levels WHERE guild_id = $1 AND user_id = $2',
                    guild_id, user_id
                )
            
            if not row:
                await message.channel.send("No hunter stats found for this identity.")
                return

            embed = create_dungeon_embed(f"PLAYER CARD")
            embed.set_author(name=f"{message.author.name} (Hunter Identity)", icon_url=message.author.display_avatar.url)
            embed.set_thumbnail(url=message.author.display_avatar.url)
            
            embed.description = f"**Status:** Verified\n**Identity:** <@{user_id}>"
            embed.add_field(name="LEVEL", value=f"`{row['level']}`", inline=True)
            embed.add_field(name="TOTAL TIME", value=f"`{float(row['total_study_hours']):.1f}h`", inline=True)
            embed.add_field(name="TOTAL XP", value=f"`{row['total_xp']}`", inline=True)
            
            embed.set_image(url=Settings.BACKGROUND_URL)
            
            await message.channel.send(embed=embed)
        except Exception as e:
            bot_logger.error(f"Error fetching profile: {e}")

async def setup(bot):
    await bot.add_cog(StatsHunter(bot))
