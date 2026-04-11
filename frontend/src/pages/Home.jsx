import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, PanelLeft, Zap, Settings, BookOpen, LifeBuoy, 
  LayoutDashboard, UserPlus, Link as LinkIcon, Volume2, Home as HomeIcon
} from 'lucide-react';
import '../styles/theme-landing.css';

export default function Home() {
    const [sidebarActive, setSidebarActive] = useState(window.innerWidth > 1024);
    const [activeCommand, setActiveCommand] = useState('-help');

    const inviteLink = "https://discord.com/api/oauth2/authorize?client_id=1488552752333455481&permissions=8&scope=bot%20applications.commands";

    // --- Command Interface Logic & Mockups ---
    const commandsData = [
        { id: '-help', name: '-help', desc: 'Display global system status and loaded protocols', type: 'Legacy Prefix', cooldown: '5s', perms: 'User' },
        { id: '-m', name: '-m (Profile)', desc: 'Fetch hunter profile card and XP progression', type: 'Legacy Prefix', cooldown: '10s', perms: 'User' },
        { id: '-l', name: '-l (Leaderboard)', desc: 'Global rankings based on focus hours', type: 'Legacy Prefix', cooldown: '15s', perms: 'User' },
        { id: 'slash-menu', name: 'Slash Commands', desc: 'Control your sanctuary with built-in voice commands', type: 'Slash Command', cooldown: '3s', perms: 'User/Admin' },
    ];

    const BotMessageContainer = ({ children, commandText }) => (
        <div className="discord-message">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                {commandText && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <img className="discord-avatar" src="https://ui-avatars.com/api/?name=Horse&background=1e293b&color=fff" alt="User" />
                        <div>
                            <div className="discord-msg-header">
                                <span className="discord-author">Horse</span>
                            </div>
                            <div className="discord-msg-text">{commandText}</div>
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'radial-gradient(circle at center, #1e40af 0%, #000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #3b82f6', flexShrink: 0 }}>
                        <Volume2 size={24} color="#60a5fa" />
                    </div>
                    <div className="discord-msg-content">
                        <div className="discord-msg-header">
                            <span className="discord-author" style={{ color: '#60a5fa' }}>Scribe</span>
                            <span className="discord-bot-tag">✓ APP</span>
                            <span className="discord-timestamp">Today at 9:25 PM</span>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMockup = () => {
        switch(activeCommand) {
            case '-help': return (
                <BotMessageContainer>
                    <div className="discord-embed">
                        <div className="discord-embed-title">SYSTEM COMMANDS</div>
                        
                        <div className="discord-category">[ COMMAND DIRECTORY ]</div>
                        <pre className="discord-mono-block">
{`-help    :: Displays this system manual
-l       :: Displays the top hunters leaderboard
-m       :: Displays your personal statistics`}
                        </pre>

                        <div className="discord-category">[ VOICE / POMODORO DIRECTORY ]</div>
                        <pre className="discord-mono-block">
{`/vc-rename :: Renames your current voice channel
/vc-limit  :: Sets the member limit for your dungeon
/vc-lock   :: Locks your channel (private ritual)
/vc-unlock :: Unlocks your channel for hunters
/vc-invite :: Summons a hunter to your sanctuary
/pomodoro-create :: Manifest focus engine in current VC`}
                        </pre>

                        <div className="discord-category">[ CONFIGURATION HUB ]</div>
                        <pre className="discord-mono-block">
{`/config    :: Access core calibration (Web Dashboard)`}
                        </pre>

                        <div style={{ marginTop: '1rem' }}>
                            <a href="#" className="discord-link"><LinkIcon size={16}/> Scribe Dashboard</a>
                        </div>
                    </div>
                </BotMessageContainer>
            );
            case '-m': return (
                <BotMessageContainer commandText="-m">
                    <div className="discord-embed discord-embed-relative">
                        <div className="discord-embed-author">
                            <img src="https://ui-avatars.com/api/?name=H&background=333&color=fff" alt="Avatar"/>
                            hussain.mhk (Hunter Identity)
                        </div>
                        <img className="discord-embed-thumbnail" src="https://ui-avatars.com/api/?name=Horse&background=1e293b&color=fff" alt="Thumb"/>
                        
                        <div className="discord-embed-title" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>PLAYER CARD</div>
                        
                        <div className="discord-embed-field">
                            <div><strong style={{ color: '#fff' }}>Status:</strong> Verified</div>
                            <div><strong style={{ color: '#fff' }}>Identity:</strong> <span className="discord-mention">@Horse</span></div>
                        </div>

                        <div className="discord-embed-fields">
                            <div className="discord-embed-field">
                                <div className="discord-embed-field-title">LEVEL</div>
                                <div className="discord-embed-field-inline">5</div>
                            </div>
                            <div className="discord-embed-field">
                                <div className="discord-embed-field-title">TOTAL TIME</div>
                                <div className="discord-embed-field-inline">5.6h</div>
                            </div>
                            <div className="discord-embed-field">
                                <div className="discord-embed-field-title">TOTAL XP</div>
                                <div className="discord-embed-field-inline">3280</div>
                            </div>
                        </div>

                        <img className="discord-embed-image" src="https://images.unsplash.com/photo-1547394765-185e1e68f34e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Setup" style={{ filter: 'brightness(0.8) contrast(1.2) saturate(1.2)' }} />
                    </div>
                </BotMessageContainer>
            );
            case '-l': return (
                <BotMessageContainer commandText="-l">
                    <div className="discord-embed">
                        <div className="discord-embed-title">RANKING: TOP HUNTERS</div>
                        <div className="discord-embed-desc" style={{ marginBottom: '1rem', color: '#dbdee1' }}>Top hunters by focus time.</div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Rank</div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Hunter</div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>Level | Time</div>

                            <div style={{ color: '#facc15', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#1</div>
                            <div><span className="discord-mention" style={{ background: '#3b82f6', color: '#fff' }}>@Horse</span></div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 5 | 5.6h</div>

                            <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#2</div>
                            <div><span className="discord-mention" style={{ background: '#3b82f6', color: '#fff' }}>@i get no huzz</span></div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 3 | 2.6h</div>

                            <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#3</div>
                            <div><span className="discord-mention" style={{ background: '#3b82f6', color: '#fff' }}>@Lisipisi Chan UwU</span></div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 2 | 0.8h</div>

                            <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#4</div>
                            <div><span className="discord-mention" style={{ background: '#3b82f6', color: '#fff' }}>@Shaun The Sheep</span></div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 1 | 0.2h</div>

                            <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#5</div>
                            <div><span className="discord-mention" style={{ background: '#3b82f6', color: '#fff' }}>@Avi</span></div>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 1 | 0.2h</div>
                        </div>
                    </div>
                </BotMessageContainer>
            );
            case 'slash-menu': return (
                <div className="slash-menu-mockup">
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Volume2 size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-invite</span>
                            <span className="slash-desc">Send a styled invite to a hunter in DMs</span>
                        </div>
                    </div>
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Volume2 size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-limit</span>
                            <span className="slash-desc">Set member limit for your temp voice channel</span>
                        </div>
                    </div>
                    <div className="slash-item active">
                        <div className="slash-icon-wrap" style={{ background: '#3b82f6', color: '#fff', boxShadow: '0 0 15px #3b82f6' }}><Volume2 size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-lock</span>
                            <span className="slash-desc" style={{ color: '#cbd5e1' }}>Lock your temp voice channel</span>
                        </div>
                    </div>
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Volume2 size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-rename</span>
                            <span className="slash-desc">Rename your temp voice channel</span>
                        </div>
                    </div>
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Volume2 size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-unlock</span>
                            <span className="slash-desc">Unlock your temp voice channel</span>
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    const activeCmdData = commandsData.find(c => c.id === activeCommand);

    return (
        <div className={`landing-root ${sidebarActive ? 'sidebar-active' : ''}`}>
            
            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            className="menu-toggle" 
                            onClick={() => setSidebarActive(!sidebarActive)}
                        >
                            <PanelLeft size={24} />
                        </button>
                        <Link to="/" className="logo">
                            <Shield className="logo-icon" size={24} />
                            <span>SCRIBE</span>
                        </Link>
                    </div>
                    <ul className="nav-links">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#docs">Docs</a></li>
                        <li><a href="https://discord.gg/qdP5WemFfd" target="_blank" rel="noreferrer">Support</a></li>
                    </ul>
                </div>
            </nav>

            {/* Sidebar (Left) */}
            <aside className={`side-nav ${sidebarActive ? 'active' : ''}`}>
                <div className="side-label">INTERNAL NODES</div>
                <ul className="side-links" style={{ marginBottom: '2rem' }}>
                    <li className="active"><a href="#home"><HomeIcon size={18} /> Overview</a></li>
                    <li><a href="#features"><Zap size={18} /> Features</a></li>
                    <li><Link to="/servers"><Settings size={18} /> Server Setup</Link></li>
                    <li><a href="#docs"><BookOpen size={18} /> Documentation</a></li>
                    <li><a href="https://discord.gg/qdP5WemFfd" target="_blank" rel="noreferrer"><LifeBuoy size={18} /> Support</a></li>
                </ul>

                <div className="side-label">QUICK ACCESS</div>
                <ul className="side-links">
                    <li><Link to="/servers"><LayoutDashboard size={18} /> Dashboard</Link></li>
                    <li><a href={inviteLink} target="_blank" rel="noreferrer"><UserPlus size={18} /> Add to Discord</a></li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className="main-wrapper">
                
                {/* Hero Section */}
                <section className="hero" id="home">
                    <div className="hero-glow"></div>
                    <div className="hero-content">
                        <div className="hero-badge">IDENTITY VERIFIED • CORE SYSTEM</div>
                        <h1 className="hero-title">Build Your <span className="accent-text">Study System</span> in Discord</h1>
                        <p className="hero-subtitle">Create and manage voice channels, run Pomodoro sessions, earn XP, and automate your server with a powerful productivity system.</p>
                        <div className="hero-btns">
                            <Link to="/servers" className="btn btn-primary">
                                <LayoutDashboard size={18} /> Open Dashboard
                            </Link>
                            <a href={inviteLink} target="_blank" rel="noreferrer" className="btn btn-secondary">
                                <UserPlus size={18} /> Add to Discord
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features" id="features">
                    <div className="container">
                        <div className="section-header">
                            <h2 className="section-title">Core <span className="accent-text">Features</span></h2>
                            <div className="section-line"></div>
                        </div>
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="card-icon"><Volume2 size={28} /></div>
                                <h3>Voice Channel System</h3>
                                <p>Create temporary voice channels automatically. Rename, lock, limit, and control access in real time.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon"><Clock size={28} /></div>
                                <h3>Automation Engine</h3>
                                <p>Start Pomodoro sessions that sync across users in voice channels.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon"><Zap size={28} /></div>
                                <h3>XP & Role Rewards</h3>
                                <p>Earn XP through activity and unlock roles automatically.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon"><LayoutDashboard size={28} /></div>
                                <h3>Leaderboard System</h3>
                                <p>Track daily, weekly, and monthly rankings with automatic resets.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Command Interface */}
                <section className="commands" id="docs">
                    <div className="container" style={{ maxWidth: '1100px' }}>
                        <div className="command-interface">
                            <div className="command-sidebar">
                                <div className="cmd-sidebar-header">COMMAND LIST</div>
                                <div className="cmd-list">
                                    {commandsData.map(cmd => (
                                        <div 
                                            key={cmd.id} 
                                            className={`cmd-item ${activeCommand === cmd.id ? 'active' : ''}`}
                                            onClick={() => setActiveCommand(cmd.id)}
                                        >
                                            <span className="cmd-item-name">{cmd.name}</span>
                                            <span className="cmd-item-desc">{cmd.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="command-preview">
                                <AnimateMockup key={activeCommand}>
                                    {renderMockup()}
                                </AnimateMockup>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="footer">
                    <div className="footer-content">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="logo" style={{ fontSize: '1.25rem' }}>
                                <Shield className="logo-icon" size={20} />
                                <span>SCRIBE</span>
                            </div>
                            <div className="footer-copy">© 2026 MHK-123. ALL RIGHTS RESERVED</div>
                        </div>
                        
                        <div className="footer-links">
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                            <a href="https://discord.gg/qdP5WemFfd" target="_blank" rel="noreferrer">Support Signal</a>
                        </div>
                    </div>
                </footer>
                
            </main>
        </div>
    );
}

const AnimateMockup = ({ children }) => {
    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {children}
        </div>
    );
};
