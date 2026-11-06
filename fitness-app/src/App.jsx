import React, { useState } from 'react';
import './App.css';

// Reusable SVG Icons
const Icons = {
  Activity: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Home: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Dumbbell: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4L9.6 9.6M2.5 14L8 19.5l2-2-5.5-5.5-2 2zM16 2.5l-2 2 5.5 5.5 2-2-5.5-5.5z"/></svg>,
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Flame: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Timer: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
};

const navItems = [
  { name: 'Dashboard', icon: Icons.Home },
  { name: 'Workouts', icon: Icons.Dumbbell },
  { name: 'Diet Plan', icon: Icons.Activity },
  { name: 'Schedule', icon: Icons.Calendar },
  { name: 'Profile', icon: Icons.User },
];

{/* --- View Components --- */}

const DashboardView = () => (
  <>
    <header className="header">
      <div className="greeting">
        <h1>Good Morning, User! 👋</h1>
        <p>Ready to crush your goals today?</p>
      </div>
      <div className="user-profile">
        <img 
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
          alt="Profile" 
          className="profile-img"
        />
      </div>
    </header>

    <div className="dashboard-grid">
      <div className="glass-card">
        <div className="stat-icon icon-blue">
          <Icons.Activity />
        </div>
        <div className="stat-value">6,245</div>
        <div className="stat-label">Steps Taken</div>
      </div>
      <div className="glass-card">
        <div className="stat-icon icon-orange">
          <Icons.Flame />
        </div>
        <div className="stat-value">840</div>
        <div className="stat-label">Calories Burned (kcal)</div>
      </div>
      <div className="glass-card">
        <div className="stat-icon icon-green">
          <Icons.Timer />
        </div>
        <div className="stat-value">45m</div>
        <div className="stat-label">Active Duration</div>
      </div>
    </div>

    <div className="middle-grid">
      <div className="glass-card">
        <h3>Activity This Week</h3>
        <div className="chart-container">
          {[60, 40, 80, 50, 95, 30, 70].map((height, i) => (
            <div key={i} className="bar-wrapper">
              <div className="bar" style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }}></div>
               <span className="day-label">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card">
        <h3>Recent Workouts</h3>
        <div className="workout-list">
          {[
            { title: 'Morning Run', time: '30 Min', cal: '300 Kcal' },
            { title: 'HIIT Session', time: '45 Min', cal: '450 Kcal' },
            { title: 'Yoga & Stretch', time: '20 Min', cal: '100 Kcal' },
            { title: 'Weight Training', time: '60 Min', cal: '500 Kcal' }
          ].map((w, i) => (
            <div key={i} className="workout-item">
              <div className="workout-icon">
                 <Icons.Dumbbell />
              </div>
              <div className="workout-details flex-1" style={{ flex: 1, marginLeft: '10px' }}>
                <div className="workout-title">{w.title}</div>
                <div className="workout-meta">{w.time} | {w.cal}</div>
              </div>
              <button className="workout-action" aria-label="Play">
                <Icons.Play />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const WorkoutsView = () => (
  <>
    <header className="header" style={{ marginBottom: '2rem' }}>
      <div className="greeting">
        <h1>All Workouts 💪</h1>
        <p>Pick a program to start your journey.</p>
      </div>
    </header>
    
    <div className="dashboard-grid">
      {[
        { name: 'Core Crusher', desc: 'Focus on abs & core', level: 'Beginner', duration: '20 Min' },
        { name: 'Upper Body Blast', desc: 'Chest, arms, shoulders', level: 'Intermediate', duration: '45 Min' },
        { name: 'Full Body HIIT', desc: 'Burn maximum fat', level: 'Advanced', duration: '30 Min' },
        { name: 'Leg Day', desc: 'Squats, lunges, presses', level: 'Intermediate', duration: '60 Min' },
        { name: 'Yoga Flex', desc: 'Morning stretch & relax', level: 'Beginner', duration: '15 Min' },
        { name: 'Cardio Burn', desc: 'Intense running exercises', level: 'Advanced', duration: '40 Min' }
      ].map((workout, index) => (
        <div className="glass-card" key={index} style={{ cursor: 'pointer', textAlign: 'center' }}>
          <div className="stat-icon icon-blue" style={{ margin: '0 auto 1rem auto' }}>
            <Icons.Play />
          </div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>{workout.name}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{workout.desc}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>
            <span>{workout.level}</span>
            <span>{workout.duration}</span>
          </div>
        </div>
      ))}
    </div>
  </>
);

const DietPlanView = () => (
  <>
    <header className="header" style={{ marginBottom: '2rem' }}>
      <div className="greeting">
        <h1>Diet Plan 🥗</h1>
        <p>Healthy meals for a healthier you.</p>
      </div>
    </header>

    <div className="middle-grid">
      <div className="glass-card">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>Today's Menu</h2>
        <div className="workout-list">
           {[
             { meal: 'Breakfast', name: 'Oatmeal & Berries', cal: '340 kcal' },
             { meal: 'Lunch', name: 'Grilled Chicken Salad', cal: '520 kcal' },
             { meal: 'Snack', name: 'Greek Yogurt', cal: '150 kcal' },
             { meal: 'Dinner', name: 'Salmon & Asparagus', cal: '450 kcal' }
           ].map((diet, i) => (
             <div key={i} className="workout-item">
               <div className="stat-icon icon-green" style={{ width: '40px', height: '40px', marginBottom: 0 }}>
                  <Icons.Flame />
               </div>
               <div style={{ flex: 1, marginLeft: '1rem' }}>
                 <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{diet.meal}</div>
                 <div className="workout-title">{diet.name}</div>
               </div>
               <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{diet.cal}</div>
             </div>
           ))}
        </div>
      </div>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
         <div className="stat-icon icon-orange" style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
            <Icons.Flame />
         </div>
         <h1 style={{ fontSize: '3rem', margin: '1rem 0 0.5rem 0' }}>1,460</h1>
         <p style={{ color: 'var(--text-secondary)' }}>Total Calories Consumed</p>
         <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '2rem' }}>
            <div style={{ width: '70%', height: '100%', background: 'var(--warning)', borderRadius: '4px', transition: 'width 1s' }}></div>
         </div>
         <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Goal: 2,000 kcal</span>
      </div>
    </div>
  </>
);

const ScheduleView = () => (
  <>
    <header className="header" style={{ marginBottom: '2rem' }}>
      <div className="greeting">
        <h1>Your Schedule 📅</h1>
        <p>Stay consistent with your activities.</p>
      </div>
    </header>
    
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[
        { date: 'Today, 8:00 AM', event: 'Morning Yoga', status: 'Done', color: 'var(--accent-secondary)' },
        { date: 'Today, 6:00 PM', event: 'Weight Training', status: 'Upcoming', color: 'var(--accent-primary)' },
        { date: 'Tomorrow, 7:00 AM', event: 'Cardio Run', status: 'Scheduled', color: 'var(--warning)' },
        { date: 'Friday, 5:30 PM', event: 'HIIT Class', status: 'Scheduled', color: 'var(--warning)' },
      ].map((sched, i) => (
        <div key={i} className="workout-item" style={{ borderLeft: `4px solid ${sched.color}`, borderRadius: '0 12px 12px 0' }}>
          <div style={{ width: '120px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{sched.date}</div>
          <div style={{ flex: 1, fontSize: '1.2rem', fontWeight: 600 }}>{sched.event}</div>
          <div style={{ 
            padding: '5px 15px', 
            borderRadius: '20px', 
            fontSize: '0.85rem', 
            background: 'rgba(255,255,255,0.05)',
            color: sched.color
          }}>
            {sched.status} {sched.status === 'Done' && '✅'}
          </div>
        </div>
      ))}
    </div>
  </>
);

const ProfileView = () => (
  <>
    <header className="header" style={{ marginBottom: '2rem' }}>
      <div className="greeting">
        <h1>Profile Settings 👤</h1>
        <p>Manage your account & goals.</p>
      </div>
    </header>
    
    <div className="middle-grid">
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <img 
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400" 
          alt="Profile" 
          style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--accent-primary)', objectFit: 'cover', margin: '0 auto 1.5rem auto' }}
        />
        <h2>Jane Doe</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Premium Member</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
          <div>
            <h3 style={{ color: 'var(--accent-primary)' }}>65 kg</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Weight</span>
          </div>
          <div>
            <h3 style={{ color: 'var(--accent-secondary)' }}>170 cm</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Height</span>
          </div>
          <div>
            <h3 style={{ color: 'var(--warning)' }}>24</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Age</span>
          </div>
        </div>
      </div>
      
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3>Personal Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
          <input type="text" value="Jane Doe" readOnly style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 15px', color: 'white', borderRadius: '8px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
          <input type="email" value="jane.doe@example.com" readOnly style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 15px', color: 'white', borderRadius: '8px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fitness Goal</label>
          <input type="text" value="Muscle Gain & Toning" readOnly style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 15px', color: 'white', borderRadius: '8px', outline: 'none' }} />
        </div>
        <button style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, marginTop: '2rem', transition: '0.3s' }}>Save Changes</button>
      </div>
    </div>
  </>
);

{/* --- Main App Container --- */}

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard');

  const renderContent = () => {
    switch (activeNav) {
      case 'Dashboard':
        return <DashboardView />;
      case 'Workouts':
        return <WorkoutsView />;
      case 'Diet Plan':
        return <DietPlanView />;
      case 'Schedule':
        return <ScheduleView />;
      case 'Profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">
            <Icons.Activity />
          </div>
          FitPro
        </div>
        <ul className="nav-links">
          {navItems.map((item) => (
            <li 
              key={item.name} 
              className={`nav-item ${activeNav === item.name ? 'active' : ''}`}
              onClick={() => setActiveNav(item.name)}
            >
              <item.icon />
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Dynamic Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
