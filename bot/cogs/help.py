import discord
from discord.ext import commands
from bot.utils.embeds import create_dungeon_embed

class Help(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name='help')
    async def help_command(self, ctx):
        """Displays the terminal-style help menu."""
        embed = create_dungeon_embed("SYSTEM COMMANDS", "")
        
        # Format the commands like a structured list inside a code block
        help_text = """```ansi
[ COMMAND DIRECTORY ]

-help     :: Displays this system manual
-l        :: Displays the top hunters leaderboard
-m        :: Displays your personal statistics

[ VOICE / POMODORO DIRECTORY ]

/vc-rename  :: Renames your current voice channel
/vc-limit   :: Sets the member limit for your dungeon
/vc-lock    :: Locks your channel (private ritual)
/vc-unlock  :: Unlocks your channel for hunters
/vc-invite  :: Summons a hunter to your sanctuary
/pomodoro-create :: Manifest focus engine in current VC

[ CONFIGURATION HUB ]

/config     :: Access core calibration (Web Dashboard)
```
🔗 **[Scribe Dashboard](https://scribe-azure.vercel.app/setup)**"""
        embed.description = help_text
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Help(bot))
