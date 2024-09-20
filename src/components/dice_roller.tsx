import React, {useEffect, useRef, useState} from "react";
import {DiceRollerConst as DRC} from '../Constants';

const DiceRoller: React.FC = () => {
    const [players, setPlayers] = useState([
        {name: DRC.namePlayOne, current: 0, wins: 0},
        {name: DRC.namePlayTwo, current: 0, wins: 0, isAI: false},
    ]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [dice, setDice] = useState([1, 1]);
    const [gameStarted, setGameStarted] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [showGif, setShowGif] = useState(false);
    const [winningScore, setWinningScore] = useState(100);
    const [aiRollCount, setAiRollCount] = useState(0);
    const [floatingWindow, setFloatingWindow] = useState<{ show: boolean; message: string }>({
        show: false,
        message: "",
    });
    const diceRollSoundRef = useRef<HTMLAudioElement>(null);
    const winSoundRef = useRef<HTMLAudioElement>(null);
    const buttonPressSoundRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (!aiEnabled || !gameStarted || !players[currentPlayerIndex].isAI) {
            return;
        }

        const interval = setInterval(() => {
            aiTurn();
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [aiEnabled, gameStarted, currentPlayerIndex, players]);


    const diceSymbols: { [key: number]: string } = {
        1: "⚀",
        2: "⚁",
        3: "⚂",
        4: "⚃",
        5: "⚄",
        6: "⚅",
    };

    const styles: {
        [key: string]: React.CSSProperties
    } = {
        gameContainer: {
            textAlign: 'center',
            fontFamily: 'Arial, sans-serif',
        },
        gameBoard: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
        },
        players: {
            flex: 1,
        },
        playerOne: {
            backgroundColor: '#e85151',
        },
        playerTwo: {
            backgroundColor: '#51bbe8',
        },
        activePlayer: {
            flex: 1,
            backgroundColor: gameStarted ? '#8c7c7c' : 'rgba(140,124,124,0)',
            fontWeight: 'bold',
        },
        diceContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10px',
        },
        dice: {
            height: '100px',
            width: '100px',
            margin: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '150px',
            color: 'white',
        },
        controls: {
            marginTop: '20px',
        },
        currentScore: {
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
        },
        button: {
            padding: '10px 20px',
            fontSize: '16px',
            margin: '0 10px',
        },
        aiToggleButton: {
            marginTop: '10px',
            padding: '10px 20px',
            fontSize: '16px',
        },
        floatingWindow: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 1000,
            textAlign: 'center',
            fontSize: '24px',
            display: floatingWindow.show ? 'block' : 'none',
        },
        bot: {
            margin: '0px',
            position: 'absolute',
        }
    };
    const showWinnerFloatingWindow = (winnerName: string) => {
        if (winSoundRef.current) {
            winSoundRef.current.play();
        }
        setFloatingWindow({
            show: true,
            message: `${winnerName} is the winner!`,
        });

        setTimeout(() => {
            setFloatingWindow({show: false, message: ""});
        }, 3000);
    };


    const rollDiceValue = () => Math.floor(Math.random() * 6) + 1;
    const getRandomInteger = (max: number) => {
        return Math.floor(Math.random() * (max + 1));
    };
    const rollDice = () => {
        const newDice = [rollDiceValue(), rollDiceValue()];

        if (diceRollSoundRef.current) {
            diceRollSoundRef.current.play();
        }

        setDice(newDice);

        const DoubleSixFlag = (newDice[0] === 6 && newDice[1] === 6);

        setPlayers(prevPlayers => {
            const updatedPlayer = {
                ...prevPlayers[currentPlayerIndex],
                current: DoubleSixFlag ? 0 : prevPlayers[currentPlayerIndex].current + newDice[0] + newDice[1],
            };

            const updatedPlayers = [...prevPlayers];
            updatedPlayers[currentPlayerIndex] = updatedPlayer;

            if (DoubleSixFlag) {
                setShowGif(true);
                setTimeout(() => setShowGif(false), 1000);
                switchPlayer();
            }

            if (updatedPlayer.current === winningScore) {
                declareWinner();
                showWinnerFloatingWindow(players[currentPlayerIndex].name)
            }

            return updatedPlayers;
        });
    };

    const switchPlayer = () => {
        setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
        setAiRollCount(0);
    };


    const holdScore = () => {
        if (buttonPressSoundRef.current) {
            buttonPressSoundRef.current.play();
        }
        switchPlayer();
    };

    const declareWinner = () => {
        setPlayers(prevPlayers => {
            return prevPlayers.map((player, index) => {
                if (index === currentPlayerIndex) {
                    return {
                        ...player,
                        wins: player.wins + 1,
                        current: 0
                    };
                }
                return player;
            });
        });

        restartGame();

    };

    const aiTurn = async () => {
        if (aiEnabled && players[currentPlayerIndex].isAI) {

            setAiRollCount(prevAiRollCount => {
                const localAiRollCount = prevAiRollCount + 1;

                if (localAiRollCount <= getRandomInteger(DRC.numOfRandomBotMax)) {
                    rollDice();
                } else {
                    const aiPlayer = players[currentPlayerIndex];
                    if (aiPlayer.current + dice[0] + dice[1] < winningScore) {
                        holdScore();
                    } else {
                        resetScore();
                    }
                }
                return localAiRollCount;
            });
        }
    };

    const handleScoreInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(e.target.value), 2);
        setWinningScore(value);
    };

    const startNewGame = () => {
        if (buttonPressSoundRef.current) {
            buttonPressSoundRef.current.play();
        }
        setGameStarted(true);
    };

    const restartGame = () => {
        if (buttonPressSoundRef.current) {
            buttonPressSoundRef.current.play();
        }
        setPlayers(prevPlayers => [
            {name: DRC.namePlayOne, current: 0, wins: prevPlayers[0].wins}, // Preserve wins, reset score
            {name: DRC.namePlayTwo, current: 0, wins: prevPlayers[1].wins, isAI: false} // Preserve wins, reset score, handle AI
        ]);
        setCurrentPlayerIndex(0);
        setDice([1, 1]);
        setShowGif(false);
        setGameStarted(false);
        setAiRollCount(0);
        setAiEnabled(false);
    };
    const resetScore = () => {
        if (buttonPressSoundRef.current) {
            buttonPressSoundRef.current.play();
        }
        setPlayers(prevPlayers =>
            prevPlayers.map((player, index) =>
                index === currentPlayerIndex
                    ? {...player, current: 0}
                    : player
            )
        );
        switchPlayer();
    };


    return (
        <div style={styles.gameContainer}>
            <h5>Winning Score: {winningScore}</h5>
            {floatingWindow.show && (
                <div style={styles.floatingWindow}>
                    <h2>{floatingWindow.message}</h2>
                </div>
            )}
            <div style={styles.gameBoard}>
                <div style={currentPlayerIndex === 0 ? styles.activePlayer : styles.players}>
                    <h2>{players[0].name} (Wins: {players[0].wins})</h2>
                    <div style={{...styles.playerOne, ...styles.currentScore}}>
                        <p>Current Score</p>
                        <p>{players[0].current}</p>
                    </div>
                </div>
                <div style={styles.dice}>
                    {diceSymbols[dice[0]]}
                </div>
                <div style={styles.dice}>
                    {diceSymbols[dice[1]]}
                </div>
                <div style={currentPlayerIndex === 1 ? styles.activePlayer : styles.players}>
                    <h2>{players[1].name} (Wins: {players[1].wins})</h2>
                    <h5 style={styles.bot}>{aiEnabled ? 'Bot' : null}</h5>
                    <div style={{...styles.playerTwo, ...styles.currentScore}}>
                        <p>Current Score</p>
                        <p>{players[1].current}</p>
                    </div>
                </div>
            </div>
            <div>
                <button
                    onClick={() => {
                        if (buttonPressSoundRef.current) {
                            buttonPressSoundRef.current.play().catch(() => {
                                console.log("Button press sound could not be played due to autoplay restrictions.");
                            });
                        }
                        setAiEnabled(!aiEnabled);
                        setPlayers([
                            {name: DRC.namePlayOne, current: 0, wins: players[0].wins},
                            {name: DRC.namePlayTwo, current: 0, wins: players[1].wins, isAI: !aiEnabled},
                        ]);
                    }}
                    style={styles.aiToggleButton}
                    disabled={gameStarted}
                >
                    {aiEnabled ? "Play Against Human" : "Play Against AI"}
                </button>
            </div>
            {showGif && (
                <>
                    <img src="/funny.gif" alt="Funny Gif"/>
                </>
            )}

            <div style={styles.controls}>
                {gameStarted && (
                    <>
                        <button
                            onClick={rollDice}
                            style={styles.button}
                            disabled={players[currentPlayerIndex].isAI}
                        >
                            Roll Dice
                        </button>
                        <button
                            onClick={holdScore}
                            style={styles.button}
                            disabled={players[currentPlayerIndex].isAI}
                        >
                            Hold
                        </button>
                        <button
                            onClick={resetScore}
                            style={styles.button}
                            disabled={players[currentPlayerIndex].isAI}
                        >
                            Reset Score
                        </button>
                        <button onClick={restartGame} style={styles.button}>
                            Restart Game
                        </button>
                    </>
                )}
                {!gameStarted && (
                    <>
                        <button onClick={startNewGame} style={styles.button}>
                            Start Game
                        </button>
                        <input
                            type="number"
                            value={winningScore}
                            onChange={handleScoreInput}
                            placeholder="Set Winning Score"
                            style={styles.button}
                            min={2}
                        />
                    </>
                )}
            </div>
            <audio ref={diceRollSoundRef} src="/sounds/dice_roll.mp3"/>
            <audio ref={winSoundRef} src="/sounds/win_sound.mp3"/>
            <audio ref={buttonPressSoundRef} src="/sounds/button_press.mp3"/>
        </div>
    );
};

export default DiceRoller;