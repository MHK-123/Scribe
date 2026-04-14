import discord
from discord import app_commands
from discord.ext import commands
from bot.utils.logger import bot_logger
from bot.utils.embeds import create_success_embed, create_error_embed, create_dungeon_embed

class Admin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="config", description="Recalibrate your sanctum nodes via the web dashboard")
    @app_commands.checks.has_permissions(administrator=True)
    async def config_dashboard(self, interaction: discord.Interaction):
        """Gateway to the Scribe Calibration Dashboard."""
        embed = create_dungeon_embed(
            "CORE CALIBRATION",
            "Manifest your sanctuary's parameters through the central interface node."
        )
        embed.add_field(name="Dashboard Link", value=f"[IGNITE DASHBOARD](https://scribe-azure.vercel.app/setup)")
        embed.set_footer(text="Administrator Authority Verified")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="setup", description="Ignite the sanctuary calibration wizard")
    @app_commands.checks.has_permissions(administrator=True)
    async def setup_wizard(self, interaction: discord.Interaction):
        """Gateway to the Scribe Setup Wizard."""
        embed = create_dungeon_embed(
            "WIZARD CALIBRATION",
            "Ignite the calibration ritual to manifest your sanctuary for the first time."
        )
        embed.add_field(name="Wizard Link", value=f"[IGNITE WIZARD](https://scribe-azure.vercel.app/setup)")
        embed.set_footer(text="Administrator Authority Verified")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @commands.command(name='clear-global')
    @commands.is_owner()
    async def clear_global_commands(self, ctx):
        """[Owner Only] Purge the global command registry to fix duplicates."""
        try:
            bot_logger.info(f"Owner {ctx.author} is purging the global command tree.")
            self.bot.tree.clear_commands(guild=None)
            await self.bot.tree.sync()
            embed = create_success_embed(
                "GLOBAL PURGE COMPLETE",
                "Successfully wiped the global command registry. Doubles will vanish within 60 minutes."
            )
            await ctx.send(embed=embed)
        except Exception as e:
            bot_logger.error(f"Global purge failed: {e}")
            await ctx.send(embed=create_error_embed("PURGE FAILED", str(e)))

    @commands.command(name='sync')
    @commands.is_owner()
    async def legacy_sync_handler(self, ctx):
        """[Owner Only] Sync slash commands globally."""
        await self.sync_global_ritual(ctx)

    @commands.command(name='sync-global')
    @commands.is_owner()
    async def sync_global_command(self, ctx):
        """[Owner Only] Ritual to propagate Global Command Nodes."""
        await self.sync_global_ritual(ctx)

    async def sync_global_ritual(self, ctx):
        try:
            bot_logger.info(f"🛡️ [ADMIN]: {ctx.author} initiated Global Command Ritual.")
            synced = await self.bot.tree.sync()
            embed = create_success_embed(
                "GLOBAL SYNC COMPLETE",
                f"Successfully manifested `{len(synced)}` global command nodes across all realms.\n*Note: Deployment may take up to 24h to stabilize.*"
            )
            await ctx.send(embed=embed)
        except Exception as e:
            bot_logger.error(f"Global sync failed: {e}")
            await ctx.send(embed=create_error_embed("SYNC FAILED", str(e)))

    @commands.command(name='purge-guild-commands', aliases=['clear-guild', 'sync-guild'])
    @commands.has_permissions(administrator=True)
    async def purge_guild_commands(self, ctx):
        """[Admin Only] Clear duplicate guild-specific commands."""
        try:
            bot_logger.info(f"🛡️ [ADMIN]: {ctx.author} purging local nodes in guild {ctx.guild.id}.")
            
            # THE CURE: Clear guild-specific overrides so only Global ones remain
            self.bot.tree.clear_commands(guild=ctx.guild)
            await self.bot.tree.sync(guild=ctx.guild)
            
            embed = create_success_embed(
                "GUILD PURGE COMPLETE",
                "Localized command overrides have been extinguished. Only the Global Registry remains active in this realm.\n\n**Duplicates should vanish from your slash menu instantly.**"
            )
            await ctx.send(embed=embed)
        except Exception as e:
            bot_logger.error(f"Guild purge failed: {e}")
            await ctx.send(embed=create_error_embed("PURGE FAILED", str(e)))

    async def cog_command_error(self, ctx, error):
        if isinstance(error, (commands.NotOwner, commands.MissingPermissions)):
            embed = create_error_embed(
                "ACCESS DENIED",
                "Insufficient Mana / Permissions. You lack the authority to recalibrate the Sanctum's nodes."
            )
            await ctx.send(embed=embed)
        else:
            bot_logger.error(f"Admin command error: {error}")

async def setup(bot):
    await bot.add_cog(Admin(bot))
