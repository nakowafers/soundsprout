import React, { useMemo } from 'react';
import { GardenVineShell } from './components/GardenVineShell';
import { createGardenStateMachine } from './state/gardenStateMachine';
import { WebAudioPort } from './audio/webAudioPort';
import './styles.css';

export const App: React.FC = () => {
  const audioPort = useMemo(() => new WebAudioPort(), []);
  const stateMachine = useMemo(() => createGardenStateMachine(), []);

  return <GardenVineShell stateMachine={stateMachine} audioPort={audioPort} />;
};

export default App;
