import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, PanelLeft, Zap, Settings, BookOpen, LifeBuoy, 
  LayoutDashboard, UserPlus, Mic, Clock, TrendingUp, BarChart3,
  Home as HomeIcon, Lock
} from 'lucide-react';
import '../styles/theme-landing.css';

export default function Home() {
    const [sidebarActive, setSidebarActive] = useState(window.innerWidth > 1024);
    const [activeCommand, setActiveCommand] = useState('-help');

    const inviteLink = "https://discord.com/api/oauth2/authorize?client_id=1488552752333455481&permissions=8&scope=bot%20applications.commands";

    // --- Command Interface Logic & Mockups ---
    const commandsData = [
        { id: '-help', name: '-help', desc: 'Display global system status and loaded protocols', type: 'Slash Command', cooldown: '5s', perms: 'User' },
        { id: '-m', name: '-m (Profile)', desc: 'Fetch hunter profile card and XP progression', type: 'Legacy Prefix', cooldown: '10s', perms: 'User' },
        { id: '-l', name: '-l (Leaderboard)', desc: 'Global rankings based on focus hours', type: 'Legacy Prefix', cooldown: '15s', perms: 'User' },
        { id: '/pomodoro-create', name: '/pomodoro-create', desc: 'Manifest focus engine in current voice sanctuary', type: 'Slash Command', cooldown: '10s', perms: 'User' },
        { id: '/vc-lock', name: '/vc-lock', desc: 'Seal the portal to protect from intruders', type: 'Slash Command', cooldown: '5s', perms: 'Admin' }
    ];

    const renderMockup = () => {
        switch(activeCommand) {
            case '-help': return (
                <div className="mockup-container">
                    <div className="mockup-header">
                        <LayoutDashboard size={20} />
                        <span>SYSTEM STATUS</span>
                    </div>
                    <div className="mockup-stat-grid">
                        <div className="stat-box">
                            <div className="stat-val">124</div>
                            <div className="stat-label">Active Users</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-val">32</div>
                            <div className="stat-label">Active Sessions</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-val">18</div>
                            <div className="stat-label">Commands Loaded</div>
                        </div>
                    </div>
                </div>
            );
            case '-m': return (
                <div className="mockup-container">
                    <div className="mockup-header">
                        <Shield size={20} />
                        <span>HUNTER PROFILE</span>
                    </div>
                    <div className="profile-mockup">
                        <div className="profile-avatar"></div>
                        <div className="profile-info">
                            <div className="profile-name">ShadowMonarch</div>
                            <div className="profile-rank">Rank: S-Class Hunter</div>
                            <div className="xp-bar-bg">
                                <div className="xp-bar-fill"></div>
                            </div>
                            <div className="xp-text">
                                <span>Level 42</span>
                                <span>8,450 / 10,000 XP</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
            case '-l': return (
                <div className="mockup-container">
                    <div className="mockup-header">
                        <BarChart3 size={20} />
                        <span>GLOBAL LEADERBOARD</span>
                    </div>
                    <div>
                        <div className="lb-row">
                            <span className="lb-rank">1</span>
                            <span className="lb-name">UserA</span>
                            <span className="lb-xp">1240 XP</span>
                        </div>
                        <div className="lb-row">
                            <span className="lb-rank">2</span>
                            <span className="lb-name">UserB</span>
                            <span className="lb-xp">980 XP</span>
                        </div>
                        <div className="lb-row">
                            <span className="lb-rank">3</span>
                            <span className="lb-name">UserC</span>
                            <span className="lb-xp">870 XP</span>
                        </div>
                    </div>
                </div>
            );
            case '/pomodoro-create': return (
                <div className="mockup-container timer-mockup" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <div className="timer-circle">
                        <div className="timer-time">25:00</div>
                    </div>
                    <div className="timer-status typing-anim">STATUS: FOCUS MODE</div>
                </div>
            );
            case '/vc-lock': return (
                <div className="mockup-container lock-mockup" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <div className="lock-icon-wrapper">
                        <Lock size={48} />
                    </div>
                    <div className="lock-text">Channel Secured</div>
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
                                <div className="card-icon"><Mic size={28} /></div>
                                <h3>Voice Channel System</h3>
                                <p>Create temporary voice channels automatically. Rename, lock, limit, and control access in real time.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon"><Clock size={28} /></div>
                                <h3>Automation Engine</h3>
                                <p>Start Pomodoro sessions that sync across users in voice channels.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon"><TrendingUp size={28} /></div>
                                <h3>XP & Role Rewards</h3>
                                <p>Earn XP through activity and unlock roles automatically.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon"><BarChart3 size={28} /></div>
                                <h3>Leaderboard System</h3>
                                <p>Track daily, weekly, and monthly rankings with automatic resets.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Command Interface */}
                <section className="commands" id="docs">
                    <div className="container" style={{ maxWidth: '1000px' }}>
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
                                
                                {activeCmdData && (
                                    <div className="preview-info">
                                        <div className="preview-info-row">Type: <span>{activeCmdData.type}</span></div>
                                        <div className="preview-info-row">Cooldown: <span>{activeCmdData.cooldown}</span></div>
                                        <div className="preview-info-row">Permissions: <span>{activeCmdData.perms}</span></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="footer">
                    <div className="footer-content">
                        <div className="logo" style={{ fontSize: '1.25rem' }}>
                            <Shield className="logo-icon" size={20} />
                            <span>SCRIBE</span>
                        </div>
                        <div className="footer-copy">© 2026 MHK-123. ALL RIGHTS RESERVED</div>
                    </div>
                </footer>
                
            </main>
        </div>
    );
}

// Simple wrapper for animation logic without relying entirely on framer component imports directly replacing Home components
const AnimateMockup = ({ children }) => {
    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {children}
        </div>
    );
};
