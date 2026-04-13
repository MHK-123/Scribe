import discord
from discord.ext import commands
from bot.utils.embeds import create_dungeon_embed

class Help(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name='help')
    async def help_command(self, ctx):
        """Displays the high-fidelity system manual."""
        embed = create_dungeon_embed(
            title="⚔️ SCRIBE CORE INTERFACE",
            description=(
                "*Welcome to the residency sentinel. Manage your voice sanctuaries "
                "and track your progression with the following protocols.*\n\n"
                "🔗 **[Scribe Web Portal](https://scribe-azure.vercel.app/)**"
            ),
            color=0x4b8bf5
        )
        
        embed.add_field(
            name="🔊 VOICE SANCTUARY",
            value=(
                "`/vc-name` :: Rename your current realm\n"
                "`/vc-status` :: Set custom voice status\n"
                "`/vc-kick` :: Banish a hunter from party\n"
                "`/vc-ban` :: Bar a hunter from sanctuary\n"
                "`/vc-invite` :: Summon a hunter (bypass locks)\n"
                "`/vc-lock` | `/vc-unlock` :: Seal or unseal realm\n"
                "`/vc-transfer` :: Handover sanctuary leadership"
            ),
            inline=False
        )
        
        embed.add_field(
            name="📊 HUNTSMAN PERFORMANCE",
            value=(
                "`$m` :: Manifest your Hunter Profile\n"
                "`$l` :: View the Global Leaderboard\n"
                "`$help` :: Recalibrate system manual\n"
                "`/level` :: Quick level check icon\n"
                "`/rank` :: Global rankings overview"
            ),
            inline=False
        )

        embed.add_field(
            name="⚙️ SYSTEM CONFIGURATION",
            value=(
                "`/setup` :: Launch calibration wizard\n"
                "`/config` :: Access Web Dashboard rules\n"
                "`/pomodoro start` :: Ignite focus engine in VC"
            ),
            inline=False
        )
        
        embed.set_footer(text="Scribe Core v3.0 · Built for Focus")
        
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Help(bot))
