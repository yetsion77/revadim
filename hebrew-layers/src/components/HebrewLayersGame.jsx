
// src/components/HebrewLayersGame.jsx
import words from '../data/words.json';
import React, { useState, useEffect } from 'react';
import { Timer, Check, X } from 'lucide-react';
import { ref, push, onValue, query, orderByChild } from 'firebase/database';
import { db } from '../firebase-config';

const GAME_DURATION = 60; // 1 minute in seconds


const HebrewLayersGame = () => {
  const [gameState, setGameState] = useState('start');
  const [currentWord, setCurrentWord] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameHistory, setGameHistory] = useState([]);
  const [animation, setAnimation] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [usedWords, setUsedWords] = useState(new Set());
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);

  // טעינת טבלת התוצאות
  useEffect(() => {
    const leaderboardRef = ref(db, 'leaderboard');
    const leaderboardQuery = query(leaderboardRef, orderByChild('score'));
    
    const unsubscribe = onValue(leaderboardQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scores = Object.values(data)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        setLeaderboard(scores);
      }
    });

    return () => unsubscribe();
  }, []);

  const getRandomWord = () => {
    const availableLayers = Object.entries(words).filter(([layer, wordList]) => 
      wordList.some(word => !usedWords.has(word))
    );
    
    if (availableLayers.length === 0) {
      setGameState('end');
      return null;
    }

    const randomLayerIndex = Math.floor(Math.random() * availableLayers.length);
    const [randomLayer, layerWords] = availableLayers[randomLayerIndex];
    const availableWords = layerWords.filter(word => !usedWords.has(word));
    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    setUsedWords(prev => new Set([...prev, randomWord]));
    return { word: randomWord, layer: randomLayer };
  };

  const startGame = () => {
    setUsedWords(new Set());
    const randomWord = getRandomWord();
    if (randomWord) {
      setGameState('playing');
      setCurrentWord(randomWord.word);
      setCorrectAnswer(randomWord.layer);
      setTimeLeft(GAME_DURATION);
      setScore(0);
      setGameHistory([]);
      setPlayerName('');
      setHasSubmittedScore(false);
    }
  };

  const handleAnswer = async (selectedLayer) => {
    if (isAnimating) return;

    const isCorrect = selectedLayer === correctAnswer;
    setAnimation(isCorrect ? 'correct' : 'incorrect');
    setIsAnimating(true);

    setGameHistory(prev => [...prev, {
      word: currentWord,
      layer: correctAnswer,
      correct: isCorrect
    }]);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextWord = getRandomWord();
    if (nextWord) {
      setCurrentWord(nextWord.word);
      setCorrectAnswer(nextWord.layer);
    }
    
    setAnimation(null);
    setIsAnimating(false);
  };

  const saveScore = async () => {
    if (!playerName.trim() || hasSubmittedScore) return;
    
    try {
      const leaderboardRef = ref(db, 'leaderboard');
      await push(leaderboardRef, {
        name: playerName,
        score: score,
        date: new Date().toISOString()
      });
      setHasSubmittedScore(true);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (timeLeft === 0) {
      setGameState('end');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8">
      {gameState === 'start' && (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-6">משחק רובדי הלשון</h1>
          <p className="mb-6">זהו את רובד הלשון של המילה המוצגת. יש לכם דקה!</p>
          
          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">טבלת שיאים:</h2>
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="font-medium">{entry.name}</span>
                    <span>{entry.score} נקודות</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={startGame}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            התחל משחק
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <Timer className="w-6 h-6" />
                <span className="text-xl">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="text-xl font-bold">ניקוד: {score}</div>
            </div>
            
            <div className="text-center mb-8 relative">
              {animation && (
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                  ${animation === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                  {animation === 'correct' ? (
                    <Check className="w-24 h-24" />
                  ) : (
                    <X className="w-24 h-24" />
                  )}
                </div>
              )}
              
              <div className="text-6xl font-bold mb-8">
                {currentWord}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(words).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => handleAnswer(layer)}
                    disabled={isAnimating}
                    className={`
                      relative overflow-hidden
                      bg-white border-2 border-blue-600 text-blue-600 
                      px-4 py-3 rounded-lg transition-all duration-300
                      hover:bg-blue-50 disabled:opacity-50 
                      ${isAnimating && correctAnswer === layer ? 'bg-green-100 border-green-600 text-green-600' : ''}
                      ${isAnimating && animation === 'incorrect' && layer === correctAnswer ? 'bg-green-100' : ''}
                    `}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">המשחק נגמר!</h2>
          <div className="text-xl text-center mb-8">
            <div className="font-bold text-2xl mb-2">הניקוד הסופי שלך: {score}</div>
            <div className="text-gray-600">מתוך {gameHistory.length} מילים</div>
          </div>
          
          {!hasSubmittedScore && (
            <div className="max-w-xs mx-auto mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הכנס את שמך לטבלת השיאים:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="השם שלך"
              />
              <button
                onClick={saveScore}
                disabled={!playerName.trim()}
                className="w-full mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
              >
                שמור תוצאה
              </button>
            </div>
          )}

          {hasSubmittedScore && (
            <div className="text-center text-green-600 mb-8">
              התוצאה נשמרה בהצלחה!
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">סיכום המשחק:</h3>
            <div className="space-y-4">
              {Object.keys(words).map(layer => {
                const layerWords = gameHistory.filter(item => item.layer === layer);
                if (layerWords.length === 0) return null;
                
                return (
                  <div key={layer} className="border rounded-lg p-4">
                    <h4 className="font-bold mb-2">{layer}</h4>
                    <div className="flex flex-wrap gap-2">
                      {layerWords.map((item, index) => (
                        <span 
                          key={index}
                          className={`px-3 py-1 rounded-full font-medium ${
                            item.correct 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {leaderboard.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">טבלת שיאים:</h3>
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="font-medium">{entry.name}</span>
                    <span>{entry.score} נקודות</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <button 
              onClick={startGame}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              שחק שוב
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HebrewLayersGame;