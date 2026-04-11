import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import axios from 'axios';
import { Activity, Users, Mic, Clock, BarChart3, ShieldCheck, Zap, Lock, Unlock, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { io } from 'socket.io-client';

export default function DashboardOverview() {
  const { id } = useParams();
  const authContext = useContext(AuthContext);
  const token = authContext?.token || '';
  const apiUrl = authContext?.apiUrl || '';
  
  const [stats, setStats] = useState({
     activeVoiceChannels: 0,
     usersStudying: 0,
     activePomodoros: 0,
     xpToday: 0
  });
  
  const [chartData, setChartData] = useState([
     { name: "Mon", users: 0 }, { name: "Tue", users: 0 },
     { name: "Wed", users: 0 }, { name: "Thu", users: 0 },
     { name: "Fri", users: 0 }, { name: "Sat", users: 0 }, { name: "Sun", users: 0 }
  ]);
  
  const [insights] = useState({
      peakTime: "8:00 PM - 10:00 PM",
      topChannel: "Deep Work Zone",
      avgDuration: "1h 45m"
  });

  const [liveActivity, setLiveActivity] = useState([
      { id: 1, type: 'join', text: 'Core systems active', time: 'Just now' },
      { id: 2, type: 'create', text: 'Dashboard initialized', time: '1m ago' }
  ]);

  const [activeChannels] = useState([
      { id: 1, name: "Deep Work", users: 2, status: "Secure", isLocked: true, isPomodoro: false },
      { id: 2, name: "Study Room", users: 5, status: "Active", isLocked: false, isPomodoro: false }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !apiUrl) {
       setIsLoading(false);
       return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // Fetch stats safely
    axios.get(`${apiUrl}/guilds/${id}/stats`, { headers })
      .then(res => {
         const data = res?.data || {};
         setStats(prev => ({
             ...prev,
             activeVoiceChannels: Number(data?.activeVoiceChannels) || 0,
             usersStudying: Number(data?.usersStudying) || 0,
             activePomodoros: Number(data?.activePomodoros) || 0,
             xpToday: Number(data?.xpToday) || 0
         }));
      })
      .catch(err => console.error('Failed to load stats:', err));

    // Fetch chart safely
    axios.get(`${apiUrl}/guilds/${id}/weekly-hours`, { headers })
      .then(res => {
         const data = (Array.isArray(res?.data) && res.data.length > 0) ? res.data : [
             { name: "12am", users: 0 }, { name: "4am", users: 0 },
             { name: "8am", users: 4 }, { name: "12pm", users: 8 },
             { name: "4pm", users: 15 }, { name: "8pm", users: 6 }
         ];
         
         const formattedData = data.map((d, i) => ({
             name: d?.name || `T${i}`,
             users: Number(d?.users || d?.hours || 0)
         }));
         setChartData(formattedData);
      })
      .catch(err => {
         console.error('Failed to load chart data:', err);
      })
      .finally(() => {
          setIsLoading(false);
      });

    // Socket real-time updates safely
    let socket;
    try {
        socket = io(apiUrl);
        socket.emit('join_guild_room', id);
        
        socket.on('vc_created', () => {
           setStats(s => ({ ...s, activeVoiceChannels: (s?.activeVoiceChannels || 0) + 1 }));
           addLiveActivity('create', 'New VC created');
        });
        socket.on('vc_deleted', () => {
           setStats(s => ({ ...s, activeVoiceChannels: Math.max(0, (s?.activeVoiceChannels || 0) - 1) }));
        });
    } catch (e) {
        console.warn("Socket initialization skipped", e);
    }
    
    return () => {
        if (socket) socket.disconnect();
    };
  }, [id, apiUrl, token]);

  const addLiveActivity = (type, text) => {
      setLiveActivity(prev => {
          const feed = prev || [];
          const newFeed = [{ id: Date.now() + Math.random(), type, text, time: 'Just now' }, ...feed];
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

  const safeNum = (val) => Number(val) || 0;
  const xpStr = safeNum(stats?.xpToday).toLocaleString();

  if (isLoading) {
      return (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: '#64748b' }}>
              <Server size={40} color="#3b82f6" style={{ animation: 'pulse 2s infinite' }} />
              <h2 style={{ fontSize: '1rem', letterSpacing: '0.1em' }}>INITIALIZING DASHBOARD...</h2>
          </div>
      );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: '"Inter", sans-serif', color: '#f8fafc', background: 'transparent' }}>
        
        {/* Top Section */}
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
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{safeNum(stats?.activeVoiceChannels)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Users</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{safeNum(stats?.usersStudying)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pomodoros</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{safeNum(stats?.activePomodoros)}</span>
                </div>
            </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Card 1 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Voice Channels</span>
                    <Mic size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{safeNum(stats?.activeVoiceChannels)}</div>
            </div>

            {/* Card 2 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users in VC</span>
                    <Users size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{safeNum(stats?.usersStudying)}</div>
            </div>

            {/* Card 3 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Pomodoros</span>
                    <Clock size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{safeNum(stats?.activePomodoros)}</div>
            </div>

            {/* Card 4 */}
            <div className="system-card" style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', transition: 'all 0.3s', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>XP Generated (Today)</span>
                    <BarChart3 size={18} color="#60a5fa" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{xpStr}</div>
            </div>
        </div>

        {/* Dashboard Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Main Graph (Left) */}
            <div style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <Activity size={20} color="#60a5fa" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>VOICE ACTIVITY <span style={{ color: '#475569', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Live)</span></h2>
                </div>
                
                <div style={{ flex: 1, minHeight: '280px', width: '100%' }}>
                    {(chartData && chartData.length > 0) ? (
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
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                            No Activity Data Available
                        </div>
                    )}
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
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{insights?.peakTime || '--'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Most Active VC</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>{insights?.topChannel || '--'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Avg Session Duration</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{insights?.avgDuration || '--'}</span>
                        </div>
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div style={{ background: 'rgba(10, 15, 26, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '1rem', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <Zap size={18} color="#60a5fa" />
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>LIVE ACTIVITY</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '200px', paddingRight: '0.5rem' }}>
                        {(liveActivity || []).map((act) => (
                            <div key={act?.id || Math.random()} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', animation: 'fadeIn 0.5s ease-out' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: '1rem', paddingTop: '2px' }}>
                                    {getStatusIcon(act?.type)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>{act?.text || 'Activity occurred'}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{act?.time || 'Just now'}</span>
                                </div>
                            </div>
                        ))}
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
                {(activeChannels && activeChannels.length > 0) ? activeChannels.map(vc => (
                    <div key={vc?.id || Math.random()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.5rem', transition: 'background 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {vc?.name || 'Unknown Channel'}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    <Users size={12} /> {safeNum(vc?.users)} users
                                </span>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                background: vc?.isLocked ? 'rgba(239, 68, 68, 0.1)' : (vc?.isPomodoro ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                                color: vc?.isLocked ? '#ef4444' : (vc?.isPomodoro ? '#f59e0b' : '#22c55e')
                            }}>
                                {vc?.status || 'Active'}
                            </span>
                            
                            <div style={{ color: '#64748b' }}>
                                {vc?.isLocked ? <Lock size={16} /> : (vc?.isPomodoro ? <Clock size={16} /> : <Unlock size={16} />)}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '1rem' }}>No active channels found.</div>
                )}
            </div>
        </div>
    </div>
  );
}

