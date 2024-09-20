import React from 'react';
import DiceRoller from './components/dice_roller'
import './App.css';

function App() {
  return (
    <div className="App">
        <header>
            <h1>Dice Roller Game</h1>
        </header>
        <DiceRoller/>
    </div>
  );
}

export default App;
