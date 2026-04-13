import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import SetupWizard from './SetupWizard.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/theme-landing.css';

// Safety wrapper to prevent index errors if an icon is missing in this version
const Icon = ({ name, size = 18, color = 'currentColor', className = '' }) => {
    const LucideIcon = Lucide[name] || Lucide.HelpCircle;
    return <LucideIcon size={size} color={color} className={className} />;
};

export default function Home() {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    
    useEffect(() => {
        setSidebarActive(window.innerWidth > 1024);
    }, []);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        if (window.innerWidth <= 1024) {
            setSidebarActive(false);
        }
    };

    const [activeCommand, setActiveCommand] = useState('$help');
    const inviteLink = "https://discord.com/api/oauth2/authorize?client_id=1488552752333455481&permissions=8&scope=bot%20applications.commands";

    const commandsData = [
        { id: '$help', name: '$help', desc: 'Display global system status and loaded protocols', type: 'Legacy Prefix', cooldown: '5s', perms: 'User' },
        { id: '$m', name: '$m (Profile)', desc: 'Fetch hunter profile card and XP progression', type: 'Legacy Prefix', cooldown: '10s', perms: 'User' },
        { id: '$l', name: '$l (Leaderboard)', desc: 'Global rankings based on focus hours', type: 'Legacy Prefix', cooldown: '15s', perms: 'User' },
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
                        <Icon name="Volume2" size={24} color="#60a5fa" />
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
            case '$help': return (
                <BotMessageContainer>
                    <div className="discord-embed">
                        <div className="discord-embed-title">SYSTEM COMMANDS</div>
                        <div className="discord-category">[ COMMAND DIRECTORY ]</div>
                        <pre className="discord-mono-block">
{`$help    :: Displays this system manual
$l       :: Displays the top hunters leaderboard
$m       :: Displays your personal statistics`}
                        </pre>
                        <div className="discord-category">[ VOICE / POMODORO DIRECTORY ]</div>
                        <pre className="discord-mono-block">
{`/vc-name    :: Renames your current voice channel
/vc-status  :: Sets your custom voice status
/vc-kick    :: Kick a member from your VC
/vc-ban     :: Ban a user from your sanctuary
/vc-lock    :: Locks your channel (private ritual)
/vc-invite  :: Summons a hunter to your sanctuary
/pomodoro start :: Manifest focus engine in current VC`}
                        </pre>
                        <div className="discord-category">[ CONFIGURATION HUB ]</div>
                        <pre className="discord-mono-block">
{`/setup     :: Access core calibration wizard
/config    :: Modify existing sanctuary rules`}
                        </pre>
                        <div style={{ marginTop: '1rem' }}>
                            <a href="#" className="discord-link"><Icon name="Link2" size={16}/> Scribe Dashboard</a>
                        </div>
                    </div>
                </BotMessageContainer>
            );
            case '$m': return (
                <BotMessageContainer commandText="$m">
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
            case '$l': return (
                <BotMessageContainer commandText="$l">
                    <div className="discord-embed">
                        <div className="discord-embed-title">RANKING: TOP HUNTERS</div>
                        <div className="discord-embed-desc" style={{ marginBottom: '1rem', color: '#dbdee1' }}>Top hunters by focus time.</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Rank</div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Hunter</div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', textAlign: 'right' }}>Level | Time</div>
                             <div style={{ color: '#facc15', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#1</div>
                             <div>
                                <span style={{ color: '#facc15', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontStyle: 'italic', display: 'block' }}>S-Rank Hunter</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>@Horse</span>
                             </div>
                             <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 24 | 154h</div>
                             
                             <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#2</div>
                             <div>
                                <span style={{ color: '#c084fc', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontStyle: 'italic', display: 'block' }}>A-Rank Hunter</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>@i get no huzz</span>
                             </div>
                             <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 12 | 84h</div>
                             
                             <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#3</div>
                             <div>
                                <span style={{ color: '#60a5fa', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontStyle: 'italic', display: 'block' }}>B-Rank Hunter</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>@Lisipisi Chan UwU</span>
                             </div>
                             <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 8 | 42h</div>
                             
                             <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#4</div>
                             <div>
                                <span style={{ color: '#94a3b8', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontStyle: 'italic', display: 'block' }}>C-Rank Hunter</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>@Shaun The Sheep</span>
                             </div>
                             <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 4 | 12h</div>
                             
                             <div style={{ color: '#dbdee1', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>#5</div>
                             <div>
                                <span style={{ color: '#64748b', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontStyle: 'italic', display: 'block' }}>Hunter</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>@Avi</span>
                             </div>
                             <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>Lvl 1 | 0.2h</div>
                        </div>
                    </div>
                </BotMessageContainer>
            );
            case 'slash-menu': return (
                <div className="slash-menu-mockup">
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Icon name="Volume2" size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-name</span>
                            <span className="slash-desc">Rename your sanctuary (Owner Only)</span>
                        </div>
                    </div>
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Icon name="Volume2" size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-status</span>
                            <span className="slash-desc">Set a custom voice realm status</span>
                        </div>
                    </div>
                    <div className="slash-item active">
                        <div className="slash-icon-wrap" style={{ background: '#3b82f6', color: '#fff', boxShadow: '0 0 15px #3b82f6' }}><Icon name="Volume2" size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-lock</span>
                            <span className="slash-desc" style={{ color: '#cbd5e1' }}>Lock your dungeon (Private Ritual)</span>
                        </div>
                    </div>
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Icon name="Volume2" size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-kick</span>
                            <span className="slash-desc">Banish a hunter from your party</span>
                        </div>
                    </div>
                    <div className="slash-item">
                        <div className="slash-icon-wrap"><Icon name="Volume2" size={18} /></div>
                        <div className="slash-texts">
                            <span className="slash-cmd">/vc-invite</span>
                            <span className="slash-desc">Summon a hunter to your portal</span>
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className={`landing-root ${sidebarActive ? 'sidebar-active' : ''}`}>
            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="menu-toggle" onClick={() => setSidebarActive(!sidebarActive)}>
                            <Icon name="PanelLeft" size={24} />
                        </button>
                        <Link to="/" className="logo">
                            <Icon name="Shield" className="logo-icon" size={24} />
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
                    <li className={activeTab === 'overview' ? 'active' : ''}>
                        <a href="#overview" onClick={(e) => { e.preventDefault(); handleTabChange('overview'); }}>
                            <Icon name="Home" size={18} /> <span>Overview</span>
                        </a>
                    </li>
                    <li className={activeTab === 'features' ? 'active' : ''}>
                        <a href="#features" onClick={(e) => { e.preventDefault(); handleTabChange('features'); }}>
                            <Icon name="Zap" size={18} /> <span>Features</span>
                        </a>
                    </li>
                    <li className={activeTab === 'setup' ? 'active' : ''}>
                        <a href="#setup" onClick={(e) => { e.preventDefault(); handleTabChange('setup'); }}>
                            <Icon name="Settings" size={18} /> <span>Server Setup</span>
                        </a>
                    </li>
                    <li className={activeTab === 'commands' ? 'active' : ''}>
                        <a href="#commands" onClick={(e) => { e.preventDefault(); handleTabChange('commands'); }}>
                            <Icon name="Terminal" size={18} /> <span>Bot Commands</span>
                        </a>
                    </li>
                    <li><a href="https://discord.gg/qdP5WemFfd" target="_blank" rel="noreferrer"><Icon name="LifeBuoy" size={18} /> <span>Support</span></a></li>
                </ul>
                <div className="side-label">QUICK ACCESS</div>
                <ul className="side-links">
                    <li><Link to="/servers"><Icon name="LayoutDashboard" size={18} /> Dashboard</Link></li>
                    <li><a href={inviteLink} target="_blank" rel="noreferrer"><Icon name="UserPlus" size={18} /> Add to Discord</a></li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className="main-wrapper">
                <div className="dashboard-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'overview' && (
                                <section className="hero">
                                    <div className="hero-glow"></div>
                                    <div className="hero-content">
                                        <div className="hero-badge">IDENTITY VERIFIED • CORE SYSTEM</div>
                                        <h1 className="hero-title">Command Your <span className="accent-text">Voice Realm</span></h1>
                                        <p className="hero-subtitle">(Create, control, and automate voice channels with precision and real-time power.)</p>
                                        <div className="hero-btns">
                                            <Link to="/servers" className="btn btn-primary">
                                                <Icon name="LayoutDashboard" size={18} /> Open Dashboard
                                            </Link>
                                            <a href={inviteLink} target="_blank" rel="noreferrer" className="btn btn-secondary">
                                                <Icon name="UserPlus" size={18} /> Add to Discord
                                            </a>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'features' && (
                                <section className="features">
                                    <div className="container">
                                        <div className="section-header">
                                            <h2 className="section-title">Core <span className="accent-text">Features</span></h2>
                                            <div className="section-line"></div>
                                        </div>
                                        <div className="features-grid">
                                            <div className="feature-card">
                                                <div className="card-icon"><Icon name="Volume2" size={28} /></div>
                                                <h3>Voice Channel System</h3>
                                                <p>Create temporary voice channels automatically. Rename, lock, limit, and control access in real time.</p>
                                            </div>
                                            <div className="feature-card">
                                                <div className="card-icon"><Icon name="Clock" size={28} /></div>
                                                <h3>Automation Engine</h3>
                                                <p>Start Pomodoro sessions that sync across users in voice channels.</p>
                                            </div>
                                            <div className="feature-card">
                                                <div className="card-icon"><Icon name="Zap" size={28} /></div>
                                                <h3>XP & Role Rewards</h3>
                                                <p>Earn XP through activity and unlock roles automatically.</p>
                                            </div>
                                            <div className="feature-card">
                                                <div className="card-icon"><Icon name="LayoutDashboard" size={28} /></div>
                                                <h3>Leaderboard System</h3>
                                                <p>Track daily, weekly, and monthly rankings with automatic resets.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'setup' && (
                                <section className="setup-view" style={{ padding: '2rem 0' }}>
                                    <SetupWizard embedded={true} />
                                </section>
                            )}

                            {activeTab === 'commands' && (
                                <section className="commands">
                                    <div className="container" style={{ maxWidth: '1100px' }}>
                                        <div className="section-header">
                                            <h2 className="section-title">Terminal <span className="accent-text">Core</span></h2>
                                            <p className="text-muted" style={{ marginTop: '0.5rem' }}>Interact with the Scribe protocols using legacy prefix or modern slash commands.</p>
                                        </div>
                                        <div className="command-interface">
                                            <div className="command-sidebar">
                                                <div className="cmd-sidebar-header">COMMAND LIST</div>
                                                <div className="cmd-list">
                                                    {commandsData.map(cmd => (
                                                        <div key={cmd.id} className={`cmd-item ${activeCommand === cmd.id ? 'active' : ''}`} onClick={() => setActiveCommand(cmd.id)}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <Icon name="ChevronRight" size={14} className={activeCommand === cmd.id ? 'text-blue-400' : 'text-slate-600'} />
                                                                <span className="cmd-item-name">{cmd.name}</span>
                                                            </div>
                                                            <span className="cmd-item-desc">{cmd.desc}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="command-preview">
                                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                    {renderMockup()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>


                <footer className="footer">
                    <div className="footer-content">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="logo" style={{ fontSize: '1.25rem' }}>
                                <Icon name="Shield" className="logo-icon" size={20} />
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
