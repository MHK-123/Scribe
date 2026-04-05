import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Menu, PanelLeft, Zap, Plus, Server, Timer, ShieldCheck, 
  BarChart3, Home as HomeIcon, BookOpen, LifeBuoy, Settings as SettingsIcon, 
  PlusCircle, MessageSquare, Github, Terminal, Mic, Hash, Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/theme-landing.css';

export default function Home() {
    const [sidebarActive, setSidebarActive] = useState(window.innerWidth > 1024);
    const [activeStep, setActiveStep] = useState(0);
    const [activeCommand, setActiveCommand] = useState('-help');
    
    // ─── Path Enforcement Guard ──────────────────────────────────────────────────
    useEffect(() => {
        console.log(`--- [GUARD]: Home Sanctum Active at: ${window.location.pathname} ---`);
        if (window.location.pathname === '/' && !window.location.search.includes('token=')) {
            console.log('--- [GUARD]: Root Path Manifested. Clearing legacy redirect states. ---');
        }
    }, []);

    // ─── Sanctum Ignition Control (Blue Fire Click Effect) ───────────────────────
    useEffect(() => {
        const createIgnitionFlare = (e) => {
            if (e.target.closest('.ignition-target')) {
                const flare = document.createElement('div');
                flare.className = 'ignition-flare';
                flare.style.left = `${e.clientX}px`;
                flare.style.top = `${e.clientY}px`;
                
                document.getElementById('ignition-layer').appendChild(flare);
                flare.addEventListener('animationend', () => {
                    flare.remove();
                });
            }
        };
        document.addEventListener('click', createIgnitionFlare);
        return () => document.removeEventListener('click', createIgnitionFlare);
    }, []);

    const terminalLines = {
        '-help': { cmd: '-help', resp: 'Sanctum System Interface. Overview of all command nodes and active dungeon protocols. (Private Manifest)' },
        '/config': { cmd: '/config', resp: 'Access core calibration nodes via the Web Dashboard. Requires Administrator authority levels.' },
        '-l (Leaderboard)': { cmd: '-l', resp: 'Fetch global hunter rankings. Displays study intensity levels and accumulated hours.' },
        '-m (Profile)': { cmd: '-m', resp: 'Retrieve personal hunter profile card with XP progression and leveling milestones.' },
        '/vc-rename': { cmd: '/vc-rename', resp: 'Recalibrate the identity of your temporary voice sanctuary.' },
        '/vc-lock': { cmd: '/vc-lock', resp: 'Seal the dungeon portal. Prevents any uninvited hunters from entering.' },
        '/vc-unlock': { cmd: '/vc-unlock', resp: 'Unseal the portal. Allows the sanctuary to be discovered by all.' },
        '/vc-limit': { cmd: '/vc-limit', resp: 'Configure the maximum hunter capacity for the current dungeon.' },
        '/vc-invite': { cmd: '/vc-invite', resp: 'Send a targeted summon signal to a hunter via private DM.' },
        '/pomodoro-create': { cmd: '/pomodoro-create', resp: 'Manifest a custom focus engine in your current VC with specified intervals.' }
    };

    const steps = [
        { title: "Choose Your Realm", desc: "Select a server where the bot is added and you have authority to summon the Scribe.", img: "/images/servers_page_1775231893650.png" },
        { title: "VC Setup (Spawn Config)", desc: "Select an Anchor VC and Target Category to manifest temporary voice sanctuaries instantly.", img: "/images/vc_setup_page_1775231920150.png" },
        { title: "Pomodoro Setup", desc: "Configure voice and text channels with custom focus durations to automate your study rituals.", img: "/images/pomodoro_config_form_1775231976476.png" },
        { title: "Start First Session", desc: "Join a configured VC or click \"Start New Session\" to ignite the Focus Engine and begin tracking.", img: "/images/pomodoro_dashboard_page_1775231960603.png" },
        { title: "Verify System (Overview)", desc: "Trace active sessions, monitored rooms, and cumulative focus time via the Sanctum Overview.", img: "/images/dashboard_overview_1775231908678.png" },
        { title: "Leaderboard & Rewards", desc: "Earn experience from focus hours to ascend the global leaderboard and manifest earned rewards.", img: "/images/leaderboard_page_1775231988729.png" }
    ];

    const inviteLink = "https://discord.com/api/oauth2/authorize?client_id=1488552752333455481&permissions=8&scope=bot%20applications.commands";

    return (
        <div className={`landing-root ${sidebarActive ? 'sidebar-active' : ''}`}>
            {/* Ignition Layer */}
            <div id="ignition-layer" style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:9999 }}></div>

            {/* Navigation */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="flex items-center gap-4">
                        <button 
                            className="menu-toggle ignition-target" 
                            onClick={() => setSidebarActive(!sidebarActive)}
                            title="Toggle Sanctuary Nodes"
                            style={{ background:'none', border:'none', color:'#fff', cursor:'pointer' }}
                        >
                            <PanelLeft size={20} />
                        </button>
                        <Link to="/" className="logo">
                            <Shield className="logo-icon" />
                            <span>SCRIBE</span>
                        </Link>
                    </div>
                    <ul className="nav-links">
                        <li><a href="#features" className="ignition-target">Features</a></li>
                        <li><a href="#docs" className="ignition-target">Docs</a></li>
                        <li><a href="https://discord.gg/qdP5WemFfd" target="_blank" className="ignition-target">Support</a></li>
                    </ul>
                    <div className="nav-actions">
                        <Link to="/servers" className="btn btn-secondary ignition-target">Dashboard</Link>
                    </div>
                </div>
            </nav>

            {/* Global Sidebar */}
            <aside className={`side-nav ${sidebarActive ? 'active' : ''}`}>
                <div className="side-label">INTERNAL NODES</div>
                <ul className="side-links">
                    <li className="active"><a href="#home" className="ignition-target"><HomeIcon size={18} /> Home Sanctum</a></li>
                    <li><a href="#features" className="ignition-target"><Zap size={18} /> Core Features</a></li>
                    <li><a href="#setup" className="ignition-target"><Server size={18} /> Realm Setup</a></li>
                    <li><a href="#docs" className="ignition-target"><BookOpen size={18} /> Archive Docs</a></li>
                    <li><a href="https://discord.gg/qdP5WemFfd" target="_blank" className="ignition-target"><LifeBuoy size={18} /> Support Node</a></li>
                </ul>
                <hr className="neon-divider" style={{ margin: '2rem 0', opacity: 0.1 }} />
                <div className="side-label">QUICK ACCESS</div>
                <ul className="side-links">
                    <li><Link to="/servers" className="ignition-target"><SettingsIcon size={18} /> Dashboard</Link></li>
                    <li><a href={inviteLink} target="_blank" rel="noreferrer" className="ignition-target"><PlusCircle size={18} /> Invite Scribe</a></li>
                </ul>
            </aside>

            <main className="main-wrapper">
                {/* Hero Section */}
                <section className="hero" id="home">
                    <div className="hero-glow"></div>
                    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                        <div className="hero-content">
                            <div className="hero-badge animate-pulse">IDENTITY VERIFIED • CORE SANCTUM</div>
                            <h1 className="hero-title">CHOOSE YOUR <span className="accent-text">REALM</span></h1>
                            <p className="hero-subtitle">The ultimate hunter productivity engine. Automate your dungeon progress, track focus rituals, and manifest glory in your Discord sanctuary.</p>
                            <div className="hero-btns">
                                <Link to="/servers" className="btn btn-primary ignition-target">
                                    <Zap size={18} /> OPEN DASHBOARD
                                </Link>
                                <a href={inviteLink} target="_blank" rel="noreferrer" className="btn btn-outline ignition-target">
                                    <Plus size={18} /> INVITE BOT
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="features" id="features">
                    <div className="container">
                        <div className="section-header">
                            <h2 className="section-title">CORE <span className="accent-text">NODES</span></h2>
                            <div className="section-line"></div>
                        </div>
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="card-icon blue-fire"><Server size={32} /></div>
                                <h3>Server Management</h3>
                                <p>Manifest temporary dungeons and voice sanctuaries with a single join.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon blue-fire"><Timer size={32} /></div>
                                <h3>Automation Engine</h3>
                                <p>Pomodoro HUDs that react to hunter presence with surgical precision.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon blue-fire"><ShieldCheck size={32} /></div>
                                <h3>Hardened Security</h3>
                                <p>Fail-closed logic protocols that protect your focus from intruders.</p>
                            </div>
                            <div className="feature-card">
                                <div className="card-icon blue-fire"><BarChart3 size={32} /></div>
                                <h3>Hunter Analytics</h3>
                                <p>Deep-trace statistics and XP progression paths for every survivor.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Path of the Hunter */}
                <section className="how-it-works" id="setup">
                    <div className="container">
                        <div className="path-grid">
                            <div className="path-content">
                                <h2 className="section-title text-left">PATH OF THE <span className="accent-text">HUNTER</span></h2>
                                <p>Manifesting Scribe into your guild is a three-step ritual.</p>
                                
                                <div className="steps-list">
                                    {steps.map((step, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`step-item ${activeStep === idx ? 'active' : ''}`}
                                            onMouseEnter={() => setActiveStep(idx)}
                                            onClick={() => setActiveStep(idx)}
                                        >
                                            <div className="step-num">{String(idx + 1).padStart(2, '0')}</div>
                                            <div className="step-desc">
                                                <h4>{step.title}</h4>
                                                <p>{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="path-visual">
                                <div className="mockup-frame">
                                    <div className="mockup-header">
                                        <div className="mockup-dots"><span></span><span></span><span></span></div>
                                        <div className="mockup-url">SCRIBE_COMMAND_CENTER_LIVE</div>
                                    </div>
                                    <div className="mockup-image-container" style={{ position: 'relative', overflow: 'hidden', height: '300px' }}>
                                        <AnimatePresence mode="wait">
                                            <motion.img 
                                                key={activeStep}
                                                src={steps[activeStep].img} 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className="setup-mockup-img" 
                                                alt={`Step ${activeStep + 1}`} 
                                                style={{ position:'absolute', width:'100%', height:'100%', objectFit:'cover' }}
                                            />
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Command Compendium */}
                <section className="commands" id="docs">
                    <div className="container">
                        <div className="archive-node">
                            <div className="archive-sidebar">
                                <div className="sidebar-header">BOT COMMANDS</div>
                                <ul className="sidebar-menu">
                                    {Object.keys(terminalLines).map(key => (
                                        <li 
                                            key={key} 
                                            className={activeCommand === key ? 'active' : ''}
                                            onClick={() => setActiveCommand(key)}
                                        >
                                            {key}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="archive-main">
                                <div className="terminal-header" style={{ padding:'1rem 2rem', background:'#0a1024', borderBottom:'1px solid rgba(59,130,246,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <span className="terminal-label" style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.7rem', color: '#00d4ff' }}>MANIFEST_NODE_01</span>
                                    <Terminal size={14} style={{ color: '#00d4ff' }} />
                                </div>
                                <div className="terminal-content">
                                    <div className="terminal-line"><span className="cmd" style={{ color: '#3b82f6' }}>{terminalLines[activeCommand].cmd}</span></div>
                                    <div className="terminal-response" style={{ color: '#8892b0' }}>{terminalLines[activeCommand].resp}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="footer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="container">
                        <div className="footer-grid">
                            <div className="footer-brand">
                                <div className="logo" style={{ color:'#fff', marginBottom:'1.5rem', fontWeight: 900, fontSize: '1.5rem' }}>SCRIBE</div>
                                <p style={{ color:'#8892b0', maxWidth:'300px' }}>The ultimate hunters sanctuary engine. Unleash your focus 2026.</p>
                            </div>
                            <div className="footer-links">
                                <h4 style={{ color: '#fff', marginBottom: '1.5rem' }}>SYSTEM</h4>
                                <a href="#features">Features</a>
                                <a href="#docs">Docs</a>
                                <Link to="/servers">Dashboard</Link>
                            </div>
                            <div className="footer-links">
                                <h4 style={{ color: '#fff', marginBottom: '1.5rem' }}>EXTERN</h4>
                                <Link to="/privacy">Privacy Policy</Link>
                                <Link to="/terms">Terms of Service</Link>
                                <a href="https://discord.gg/qdP5WemFfd" target="_blank" rel="noreferrer">Support Signal</a>
                            </div>
                        </div>
                        <div className="footer-bottom" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
                            <p>© 2026 MHK-123. ALL RIGHTS RESERVED • CORE SANCTUM V2</p>
                            <div className="footer-social" style={{ display: 'flex', gap: '1.5rem' }}>
                                <a href="https://discord.gg/qdP5WemFfd" style={{ color: '#465070' }}><MessageSquare size={18} /></a>
                                <a href="https://github.com/MHK-123/Scribe" target="_blank" rel="noreferrer" style={{ color: '#465070' }}><Github size={18} /></a>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
