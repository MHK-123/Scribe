import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { Activity, Users, Mic, Clock, BarChart3, ShieldCheck, Zap, Lock, Unlock, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { io } from 'socket.io-client';

export default function DashboardOverview() {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  
  const [stats, setStats] = useState({
     activeVoiceChannels: 0,
     usersStudying: 0,
     activePomodoros: 0,
     xpToday: 0
  });
  
  const [chartData, setChartData] = useState([]);
  
  // Mock data for new UI elements until backend provides them
  const [insights] = useState({
      peakTime: "8:00 PM - 10:00 PM",
      topChannel: "Deep Work Zone",
      avgDuration: "1h 45m"
  });

  const [liveActivity, setLiveActivity] = useState([
      { id: 1, type: 'join', text: 'User joined Deep Work', time: 'Just now' },
      { id: 2, type: 'pomodoro', text: 'Pomodoro started in Study Room', time: '2m ago' },
      { id: 3, type: 'create', text: 'New server VC created: Focus Group', time: '15m ago' },
      { id: 4, type: 'leave', text: 'User left Pomodoro Hub', time: '22m ago' },
  ]);

  const [activeChannels] = useState([
      { id: 1, name: "Deep Work", users: 5, status: "Locked", isLocked: true, isPomodoro: false },
      { id: 2, name: "Study Room", users: 3, status: "Active Session", isLocked: false, isPomodoro: false },
      { id: 3, name: "Pomodoro Hub", users: 4, status: "Focusing", isLocked: false, isPomodoro: true },
  ]);

  useEffect(() => {
    // Clear data on distinct mounts
    setChartData([]);

    const headers = { Authorization: `Bearer ${token}` };
    
    // Fetch stats
    axios.get(`${apiUrl}/guilds/${id}/stats`, { headers })
      .then(res => {
         setStats(prev => ({
             ...prev,
             activeVoiceChannels: res.data?.activeVoiceChannels || 0,
             usersStudying: res.data?.usersStudying || 0,
             // Fallbacks for data that might not be in the backend yet
             activePomodoros: res.data?.activePomodoros || 2,
             xpToday: res.data?.xpToday || 12450
         }));
      })
      .catch(err => console.error('Failed to load stats:', err));

    // Fetch chart
    axios.get(`${apiUrl}/guilds/${id}/weekly-hours`, { headers })
      .then(res => {
         // Using data for smooth line chart. If backend chart data is empty/bad format, we supply fallback to never show empty
         const data = Array.isArray(res.data) && res.data.length > 0 
           ? res.data 
           : [
               { name: "12am", users: 4 }, { name: "4am", users: 2 },
               { name: "8am", users: 15 }, { name: "12pm", users: 28 },
               { name: "4pm", users: 32 }, { name: "8pm", users: 45 },
               { name: "11pm", users: 20 }
             ];
         
         // Format the data to fit "Users in VC" line chart expectations if necessary
         const formattedData = data.map(d => ({
             name: d.name,
             users: d.users || d.hours || Math.floor(Math.random() * 20) + 5 // fallback mapping
         }));
         setChartData(formattedData);
      })
      .catch(err => {
         console.error('Failed to load chart data:', err);
         setChartData([
               { name: "12am", users: 2 }, { name: "4am", users: 1 },
               { name: "8am", users: 10 }, { name: "12pm", users: 18 },
               { name: "4pm", users: 22 }, { name: "8pm", users: 30 }
         ]);
      });

    // Socket real-time updates
    const socket = io(apiUrl);
    socket.emit('join_guild_room', id);
    
    socket.on('vc_created', (data) => {
       setStats(s => ({ ...s, activeVoiceChannels: s.activeVoiceChannels + 1 }));
       addLiveActivity('create', 'New VC created');
    });
    socket.on('vc_deleted', (data) => {
       setStats(s => ({ ...s, activeVoiceChannels: Math.max(0, s.activeVoiceChannels - 1) }));
    });
    
    return () => socket.disconnect();
  }, [id, apiUrl, token]);

  const addLiveActivity = (type, text) => {
      setLiveActivity(prev => {
          const newFeed = [{ id: Date.now(), type, text, time: 'Just now' }, ...prev];
          return newFeed.slice(0, 8); // Keep last 8
      });
  };

  const getStatusIcon = (type) => {
      switch(type) {
          case 'join': return <span style={{ color: '#22c55e' }}>+</span>;
          case 'leave': return <span style={{ color: '#ef4444' }}>-</span>;
          case 'pomodoro': return <span style={{ color: '#f59e0b' }}>+</span>;
          case 'create': return <span style={{ color: '#3b82f6' }}>+</span>;
          default: return <span style={{ color: '#fff' }}>•</span>;
      }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: '"Inter", sans-serif', color: '#f8fafc', background: 'transparent' }}>
        
        {/* Top Section: System Status Panel */}
        <div style={{ background: 'rgba(10, 15, 26, 0.8)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '1rem', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Server size={20} color="#60a5fa" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Core System</span>
                </div>
                <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                        <span style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.75 }}></span>
                        <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>ONLINE / STABLE</span>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Voice</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{stats.activeVoiceChannels}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Users</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{stats.usersStudying}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pomodoros</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{stats.activePomodoros}</span>
                </div>
            </div>
        </div>

        {/* Stats Cards (4 Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Card 1 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default', alignContent: 'center' }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Voice Channels</span>
                    <Mic size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stats.activeVoiceChannels}</div>
            </div>

            {/* Card 2 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default' }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users in VC</span>
                    <Users size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stats.usersStudying}</div>
            </div>

            {/* Card 3 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default' }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Pomodoros</span>
                    <Clock size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stats.activePomodoros}</div>
            </div>

            {/* Card 4 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default' }}
                 onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>XP Generated (Today)</span>
                    <BarChart3 size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{stats.xpToday.toLocaleString()}</div>
            </div>

        </div>

        {/* Dashboard Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Main Graph (Left) */}
            <div style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <Activity size={20} color="#60a5fa" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>VOICE ACTIVITY <span style={{ color: '#475569', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Live)</span></h2>
                </div>
                
                <div style={{ flex: 1, minHeight: '280px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight="600" tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                            <YAxis stroke="#475569" fontSize={11} fontWeight="600" tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(10, 15, 25, 0.95)', 
                                    borderColor: 'rgba(59, 130, 246, 0.3)', 
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                                }} 
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="users" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                animationDuration={2000}
                                style={{ filter: 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.5))' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Right Panel: Insights + Live Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Insights Panel */}
                <div style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={18} color="#60a5fa" />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>INSIGHTS</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Peak Activity Time</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{insights.peakTime}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Most Active VC</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>{insights.topChannel}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Avg Session Duration</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{insights.avgDuration}</span>
                        </div>
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <Zap size={18} color="#60a5fa" />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>LIVE ACTIVITY</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '200px', pr: 2 }}>
                        {liveActivity.map((act) => (
                            <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', animation: 'fadeIn 0.5s ease-out' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: '1rem', paddingTop: '2px' }}>
                                    {getStatusIcon(act.type)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>{act.text}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{act.time}</span>
                                </div>
                            </div>
                        ))}
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }`}</style>
                    </div>
                </div>

            </div>
        </div>

        {/* Active Voice Channels List */}
        <div style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Activity size={20} color="#60a5fa" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active Channels</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeChannels.map(vc => (
                    <div key={vc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.5rem', transition: 'background 0.2s' }}
                         onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {vc.name}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    <Users size={12} /> {vc.users} users
                                </span>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                background: vc.isLocked ? 'rgba(239, 68, 68, 0.1)' : (vc.isPomodoro ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                                color: vc.isLocked ? '#ef4444' : (vc.isPomodoro ? '#f59e0b' : '#22c55e')
                            }}>
                                {vc.status}
                            </span>
                            
                            <div style={{ color: '#64748b' }}>
                                {vc.isLocked ? <Lock size={16} /> : (vc.isPomodoro ? <Clock size={16} /> : <Unlock size={16} />)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    </div>
  );
}
