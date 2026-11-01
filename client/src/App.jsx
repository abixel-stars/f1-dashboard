import { useEffect, useState } from 'react';
import Header from './components/Header';
import TabBar from './components/TabBar';
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
    <div className="min-h-screen bg-ground text-ink">
      <div className="max-w-3xl mx-auto sm:border-x border-rule min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
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

        <footer className="border-t border-rule px-4 py-3">
          <p className="font-condensed text-[11px] tracking-[0.2em] text-muted uppercase text-center">
            Data: OpenF1 API - Unofficial fan project, not affiliated with Formula 1
          </p>
        </footer>

        <TabBar tab={tab} setTab={setTab} />

        <DriverDetail
          row={selected}
          isFav={selected && fav === selected.driver_number}
          onToggleFav={toggle}
          onClose={() => setSelected(null)}
        />
      </div>
    </div>
  );
}
