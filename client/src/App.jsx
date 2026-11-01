import { useEffect, useState } from 'react';
import Header from './components/Header';
import WidgetHome from './components/WidgetHome';
import TimingTower from './components/TimingTower';
import Standings from './components/Standings';
import Schedule from './components/Schedule';
import DriverDetail from './components/DriverDetail';
import { useFavorite } from './hooks/useFavorite';
import { api } from './lib/api';

export default function App() {
  const [tab, setTab] = useState('widget');
  const { fav, toggle } = useFavorite();
  const [drivers, setDrivers] = useState([]);
  const [selected, setSelected] = useState(null);

  // Driver list for the widget home (latest completed race session).
  useEffect(() => {
    api.latestSession('Race')
      .then((s) => api.drivers(s.session_key))
      .then(setDrivers)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-panel text-white max-w-2xl mx-auto border-x border-white/10">
      <Header tab={tab} setTab={setTab} />

      <main className="pb-10">
        {tab === 'widget' && (
          <WidgetHome
            fav={fav}
            drivers={drivers}
            onToggleFav={toggle}
            onSelectDriver={setSelected}
            goTiming={() => setTab('timing')}
          />
        )}
        {tab === 'timing' && (
          <TimingTower fav={fav} onToggleFav={toggle} onSelectDriver={setSelected} />
        )}
        {tab === 'standings' && (
          <Standings fav={fav} onToggleFav={toggle} onSelectDriver={setSelected} />
        )}
        {tab === 'schedule' && <Schedule />}
      </main>

      <footer className="border-t border-white/10 px-4 py-3">
        <p className="font-condensed text-[11px] tracking-[0.2em] text-muted uppercase text-center">
          Data: OpenF1 API - Unofficial fan project, not affiliated with Formula 1
        </p>
      </footer>

      <DriverDetail
        row={selected}
        isFav={selected && fav === selected.driver_number}
        onToggleFav={toggle}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
