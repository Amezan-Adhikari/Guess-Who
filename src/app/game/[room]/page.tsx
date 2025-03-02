"use client";

import { useEffect, useState } from "react";
import useSocket, { PlayerData } from "../../../lib/useSocket";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Define game character interface
interface Character {
  id: number;
  name: string;
  image: string;
  features: {
    hasHat: boolean;
    hasGlasses: boolean;
    hasBeard: boolean;
    hairColor: "blonde" | "brown" | "black" | "red" | "white";
    gender: "male" | "female";
  };
}

// Types for game state tracking
interface GameState {
  myCharacter: Character | null;
  opponentCharacterId: number | null;
  flippedCharacters: number[];
  currentTurn: string | null;
  gameOver: boolean;
  winner: string | null;
}

// Types for questions and answers
interface Question {
  id: string;
  text: string;
  feature: string;
  value: any;
}

export default function GameRoom() {
  const router = useRouter();
  const { room } = useParams();
  const { socket, isConnected, sendMessage } = useSocket();
  
  // Players
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerData | null>(null);
  const [opponentPlayer, setOpponentPlayer] = useState<PlayerData | null>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    myCharacter: null,
    opponentCharacterId: null,
    flippedCharacters: [],
    currentTurn: null,
    gameOver: false,
    winner: null
  });
  
  // UI state
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isGuessing, setIsGuessing] = useState(false);
  const [guessId, setGuessId] = useState<number | null>(null);
  
  // Mock characters for the game
  // In a real implementation, these would be loaded from an API or shared between players
  const characters: Character[] = [
    {
      id: 1,
      name: "Alex",
      image: "/characters/alex.svg", // You'll need to create these images
      features: {
        hasHat: false,
        hasGlasses: true,
        hasBeard: false,
        hairColor: "black",
        gender: "male"
      }
    },
    {
      id: 2,
      name: "Emma",
      image: "/characters/emma.svg",
      features: {
        hasHat: false,
        hasGlasses: false,
        hasBeard: false,
        hairColor: "blonde",
        gender: "female"
      }
    },
    {
      id: 3,
      name: "Michael",
      image: "/characters/michael.svg",
      features: {
        hasHat: true,
        hasGlasses: false,
        hasBeard: true,
        hairColor: "brown",
        gender: "male"
      }
    },
    {
      id: 4,
      name: "Sophia",
      image: "/characters/sophia.svg",
      features: {
        hasHat: true,
        hasGlasses: true,
        hasBeard: false,
        hairColor: "red",
        gender: "female"
      }
    },
    {
      id: 5,
      name: "James",
      image: "/characters/james.svg",
      features: {
        hasHat: false,
        hasGlasses: false,
        hasBeard: true,
        hairColor: "black",
        gender: "male"
      }
    },
    {
      id: 6,
      name: "Olivia",
      image: "/characters/olivia.svg",
      features: {
        hasHat: true,
        hasGlasses: false,
        hasBeard: false,
        hairColor: "brown",
        gender: "female"
      }
    },
    {
      id: 7,
      name: "William",
      image: "/characters/william.svg",
      features: {
        hasHat: false,
        hasGlasses: true,
        hasBeard: false,
        hairColor: "white",
        gender: "male"
      }
    },
    {
      id: 8,
      name: "Charlotte",
      image: "/characters/charlotte.svg",
      features: {
        hasHat: false,
        hasGlasses: true,
        hasBeard: false,
        hairColor: "blonde",
        gender: "female"
      }
    },
    // Add more characters as needed to make the game interesting
    // Ideally, you'd have at least 12-16 characters for a good game
  ];
  
  // Predefined questions for the game
  const questions: Question[] = [
    { id: "q1", text: "Does your character have a hat?", feature: "hasHat", value: true },
    { id: "q2", text: "Does your character wear glasses?", feature: "hasGlasses", value: true },
    { id: "q3", text: "Does your character have a beard?", feature: "hasBeard", value: true },
    { id: "q4", text: "Is your character male?", feature: "gender", value: "male" },
    { id: "q5", text: "Is your character female?", feature: "gender", value: "female" },
    { id: "q6", text: "Does your character have blonde hair?", feature: "hairColor", value: "blonde" },
    { id: "q7", text: "Does your character have black hair?", feature: "hairColor", value: "black" },
    { id: "q8", text: "Does your character have brown hair?", feature: "hairColor", value: "brown" },
    { id: "q9", text: "Does your character have red hair?", feature: "hairColor", value: "red" },
    { id: "q10", text: "Does your character have white hair?", feature: "hairColor", value: "white" }
  ];

  // Initialize socket and game state
  useEffect(() => {
    // Initialize Socket.IO server if not already initialized
    fetch('/api/socket').catch(err => console.error('Failed to initialize socket server:', err));
    
    if (!socket || !room) return;
    
    // Register additional socket event listeners for the game
    socket.on('gameMessage' as any, (data: any) => {
      console.log('Game message received:', data);
      
      // Handle different types of game messages
      switch (data.type) {
        case 'gameInit':
          // Initialize the game with character assignments
          setGameState(prevState => ({
            ...prevState,
            myCharacter: characters.find(c => c.id === data.myCharacterId) || null,
            opponentCharacterId: data.opponentCharacterId,
            currentTurn: data.firstTurn
          }));
          break;
          
        case 'question':
          // Handle incoming question from opponent
          setMessage(`${data.sender} asks: ${data.question}`);
          break;
          
        case 'answer':
          // Handle answer to your question
          setMessage(`${data.sender} answers: ${data.answer ? 'Yes' : 'No'}`);
          // Update game state based on answer (flip characters, etc.)
          if (gameState.currentTurn === socket.id) {
            // It was your turn, now it's opponent's turn
            setGameState(prevState => ({
              ...prevState,
              currentTurn: opponentPlayer?.id || null
            }));
          }
          break;
          
        case 'flipCharacter':
          // Opponent has flipped a character
          setGameState(prevState => ({
            ...prevState,
            flippedCharacters: [...prevState.flippedCharacters, data.characterId]
          }));
          break;
          
        case 'guess':
          // Opponent is making a guess
          setMessage(`${data.sender} is guessing your character is ${data.characterName}!`);
          break;
          
        case 'guessResult':
          // Result of a guess
          if (data.correct) {
            setGameState(prevState => ({
              ...prevState,
              gameOver: true,
              winner: data.winner
            }));
            setMessage(`Game over! ${data.winner === currentPlayer?.userName ? 'You won!' : `${opponentPlayer?.userName} won!`}`);
          } else {
            setMessage(`Wrong guess! ${data.guesser} guessed ${data.characterName}, but that's not correct.`);
            // Switch turns after incorrect guess
            setGameState((prevState) => ({
                ...prevState,
                currentTurn: data.guesser === currentPlayer?.userName 
                  ? opponentPlayer?.id ?? null 
                  : currentPlayer?.id ?? null,
              }));
          }
          break;
      }
    });
    
    // Get current players in the room
    socket.on('playerJoined', (data) => {
      console.log('Player joined game room:', data);
      setPlayers(data.players);
      
      // Identify current player and opponent
      const me = data.players.find(p => p.id === socket.id);
      const opponent = data.players.find(p => p.id !== socket.id);
      
      if (me) setCurrentPlayer(me);
      if (opponent) setOpponentPlayer(opponent);
      
      // If we have 2 players, start the game
      if (data.players.length === 2 && !gameState.myCharacter) {
        initializeGame(data.players, socket.id as string);
      }
    });
    
    // Handle player leaving
    socket.on('playerLeft', (data) => {
      console.log('Player left game room:', data);
      setPlayers(data.players);
      
      // If opponent left, show message and redirect to home
      if (data.players.length < 2) {
        setMessage('Your opponent left the game. Redirecting to home...');
        setTimeout(() => router.push('/'), 3000);
      }
    });
    
    // Clean up event listeners
    return () => {
      if (socket) {
        socket.off('gameMessage' as any);
        socket.off('playerJoined');
        socket.off('playerLeft');
      }
    };
  }, [socket, room, gameState, opponentPlayer, currentPlayer, router]);
  
  // Initialize the game by assigning characters and deciding first turn
  const initializeGame = (players: PlayerData[], currentPlayerId: string) => {
    if (!socket) return;
    
    // Randomly assign characters to players
    const myCharacterId = Math.floor(Math.random() * characters.length) + 1;
    const opponentCharacterId = Math.floor(Math.random() * characters.length) + 1;
    
    // Randomly choose who goes first
    const firstTurn = Math.random() > 0.5 ? players[0].id : players[1].id;
    
    // Send game initialization to both players
    socket.emit('message', {
      text: JSON.stringify({
        type: 'gameInit',
        myCharacterId,
        opponentCharacterId,
        firstTurn
      }),
      sender: 'system',
      timestamp: Date.now(),
      room: room as string
    });
    
    // Set local game state
    setGameState({
      myCharacter: characters.find(c => c.id === myCharacterId) || null,
      opponentCharacterId: opponentCharacterId,
      flippedCharacters: [],
      currentTurn: firstTurn,
      gameOver: false,
      winner: null
    });
    
    // Show game start message
    setMessage(`Game started! ${firstTurn === currentPlayerId ? 'Your turn' : 'Opponent\'s turn'} to ask a question.`);
  };
  
  // Handle asking a question
  const askQuestion = (question: Question) => {
    if (!socket || !room || !opponentPlayer) return;
    
    // Send the question
    socket.emit('message', {
      text: JSON.stringify({
        type: 'question',
        questionId: question.id,
        question: question.text,
        feature: question.feature,
        value: question.value,
        sender: currentPlayer?.userName
      }),
      sender: currentPlayer?.userName || 'unknown',
      timestamp: Date.now(),
      room: room as string
    });
    
    setIsQuestionDialogOpen(false);
    setMessage(`You asked: ${question.text}`);
  };
  
  // Handle receiving a question (answer it)
  const answerQuestion = (question: any, answer: boolean) => {
    if (!socket || !room || !currentPlayer) return;
    
    // Send the answer
    socket.emit('message', {
      text: JSON.stringify({
        type: 'answer',
        questionId: question.questionId,
        answer: answer,
        sender: currentPlayer.userName
      }),
      sender: currentPlayer.userName,
      timestamp: Date.now(),
      room: room as string
    });
    
    // Switch turns
    setGameState(prevState => ({
      ...prevState,
      currentTurn: opponentPlayer?.id || null
    }));
    
    setMessage(`You answered: ${answer ? 'Yes' : 'No'}`);
  };
  
  // Flip a character (mark as not the secret character)
  const flipCharacter = (characterId: number) => {
    if (!socket || !room) return;
    
    // Add to flipped characters list
    setGameState(prevState => ({
      ...prevState,
      flippedCharacters: [...prevState.flippedCharacters, characterId]
    }));
    
    // Notify the other player
    socket.emit('message', {
      text: JSON.stringify({
        type: 'flipCharacter',
        characterId
      }),
      sender: currentPlayer?.userName || 'unknown',
      timestamp: Date.now(),
      room: room as string
    });
  };
  
  // Make a final guess
  const makeGuess = (characterId: number) => {
    if (!socket || !room || !opponentPlayer) return;
    
    const guessedCharacter = characters.find(c => c.id === characterId);
    if (!guessedCharacter) return;
    
    // Send the guess
    socket.emit('message', {
      text: JSON.stringify({
        type: 'guess',
        characterId,
        characterName: guessedCharacter.name,
        sender: currentPlayer?.userName
      }),
      sender: currentPlayer?.userName || 'unknown',
      timestamp: Date.now(),
      room: room as string
    });
    
    setMessage(`You guessed that the opponent's character is ${guessedCharacter.name}.`);
    setIsGuessing(false);
    
    // Check if guess is correct
    const isCorrect = characterId === gameState.opponentCharacterId;
    
    // Send result
    socket.emit('message', {
      text: JSON.stringify({
        type: 'guessResult',
        characterId,
        characterName: guessedCharacter.name,
        correct: isCorrect,
        guesser: currentPlayer?.userName,
        winner: isCorrect ? currentPlayer?.userName : null
      }),
      sender: 'system',
      timestamp: Date.now(),
      room: room as string
    });
    
    // Update game state if correct
    if (isCorrect) {
      setGameState(prevState => ({
        ...prevState,
        gameOver: true,
        winner: currentPlayer?.userName || null
      }));
      setMessage('Congratulations! You guessed correctly and won the game!');
    } else {
      setGameState(prevState => ({
        ...prevState,
        currentTurn: opponentPlayer.id
      }));
      setMessage(`Wrong guess! It's now ${opponentPlayer.userName}'s turn.`);
    }
  };
  
  // Check if it's the current player's turn
  const isMyTurn = gameState.currentTurn === socket?.id;
  
  // Return to home
  const goHome = () => {
    router.push('/');
  };
  
  return (
    <main className="font-[victor] py-5 px-5">
      {/* Game header */}
      <div className="mb-6">
        <h1 className="bg-gradient-to-r from-[#F79060] to-[#8E10D7] text-center bg-clip-text text-transparent text-3xl tracking-wider">
          Guess Who - Room: {room}
        </h1>
        
        {/* Players and turn indicator */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            {players.map((player, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-2 p-2 rounded-full ${
                  gameState.currentTurn === player.id ? 'bg-green-100 border border-green-300' : ''
                }`}
              >
                <img src={player.avatar} alt="avatar" className="w-8 h-8 rounded-full border" />
                <span>{player.userName}</span>
                {gameState.currentTurn === player.id && (
                  <span className="text-green-600 text-sm">(Turn)</span>
                )}
              </div>
            ))}
          </div>
          
          <button 
            onClick={goHome}
            className="text-red-500 hover:text-red-600"
          >
            Leave Game
          </button>
        </div>
        
        {/* Game message */}
        {message && (
          <div className="bg-gray-100 p-3 mt-4 rounded-md text-center">
            {message}
          </div>
        )}
      </div>
      
      {/* Game content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left section - Your character & actions */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl mb-4 text-[#4d4d4d]">Your Character</h2>
          
          {gameState.myCharacter ? (
            <div className="flex flex-col items-center">
              <img 
                src={gameState.myCharacter.image} 
                alt={gameState.myCharacter.name} 
                className="w-32 h-32 mb-2 border rounded-md"
              />
              <p className="text-lg font-semibold">{gameState.myCharacter.name}</p>
              
              {/* Character features (optional) */}
              <div className="mt-4 text-sm">
                <p>
                  {gameState.myCharacter.features.gender === "male" ? "Male" : "Female"} with{" "}
                  {gameState.myCharacter.features.hairColor} hair
                </p>
                <p>
                  {gameState.myCharacter.features.hasHat ? "Wearing a hat" : "No hat"} •{" "}
                  {gameState.myCharacter.features.hasGlasses ? "Has glasses" : "No glasses"} •{" "}
                  {gameState.myCharacter.features.hasBeard ? "Has a beard" : "No beard"}
                </p>
              </div>
            </div>
          ) : (
            <p>Waiting for game to start...</p>
          )}
          
          {/* Game actions */}
          <div className="mt-6 space-y-3">
            <Button
              disabled={!isMyTurn || gameState.gameOver}
              onClick={() => setIsQuestionDialogOpen(true)}
              className="w-full bg-[#F79060] hover:bg-[#8E10D7] text-white"
            >
              Ask a Question
            </Button>
            
            <Button
              disabled={!isMyTurn || gameState.gameOver}
              onClick={() => setIsGuessing(true)}
              className="w-full bg-[#8E10D7] hover:bg-[#F79060] text-white"
            >
              Make a Guess
            </Button>
          </div>
        </div>
        
        {/* Right section - Character grid */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl mb-4 text-[#4d4d4d]">Characters</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {characters.map((character) => (
              <div 
                key={character.id}
                onClick={() => isMyTurn && !gameState.gameOver && flipCharacter(character.id)}
                className={`
                  relative border rounded-md p-2 cursor-pointer transition-all
                  ${gameState.flippedCharacters.includes(character.id) ? 'opacity-40' : 'hover:border-[#F79060]'}
                `}
              >
                <img 
                  src={character.image} 
                  alt={character.name} 
                  className="w-full h-24 object-contain"
                />
                <p className="text-center mt-1 text-sm">{character.name}</p>
                
                {/* Flipped indicator */}
                {gameState.flippedCharacters.includes(character.id) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-red-500 rotate-45 transform origin-center"></div>
                    <div className="w-full h-1 bg-red-500 -rotate-45 transform origin-center"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Questions dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-md bg-[#FFFFFF] rounded-md md:p-10 p-5 font-[victor]">
          <DialogHeader>
            <DialogTitle className="text-[2c2c2c]">Ask a Question</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-80 space-y-2">
            {questions.map(q => (
              <Button
                key={q.id}
                onClick={() => askQuestion(q)}
                className="w-full justify-start bg-gray-100 hover:bg-[#F79060] hover:text-white text-[#4d4d4d] py-2 px-4 mb-2 text-left"
              >
                {q.text}
              </Button>
            ))}
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              className="px-5 py-2 bg-gray-300 text-gray-700 rounded-md hover:opacity-80"
              onClick={() => setIsQuestionDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Guess dialog */}
      <Dialog open={isGuessing} onOpenChange={setIsGuessing}>
        <DialogContent className="max-w-md bg-[#FFFFFF] rounded-md md:p-10 p-5 font-[victor]">
          <DialogHeader>
            <DialogTitle className="text-[2c2c2c]">Make Your Final Guess</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-80">
            <p className="mb-4 text-gray-600">Which character do you think your opponent has?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {characters.map((character) => (
                <div 
                  key={character.id}
                  onClick={() => setGuessId(character.id)}
                  className={`
                    border rounded-md p-2 cursor-pointer transition-all
                    ${guessId === character.id ? 'border-2 border-[#8E10D7]' : 'hover:border-[#F79060]'}
                    ${gameState.flippedCharacters.includes(character.id) ? 'opacity-40' : ''}
                  `}
                >
                  <img 
                    src={character.image} 
                    alt={character.name} 
                    className="w-full h-20 object-contain"
                  />
                  <p className="text-center mt-1 text-sm">{character.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-start flex gap-2">
            <Button
              type="button"
              className="px-5 py-2 bg-gray-300 text-gray-700 rounded-md hover:opacity-80"
              onClick={() => setIsGuessing(false)}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              disabled={!guessId}
              className="px-5 py-2 bg-[#8E10D7] text-white rounded-md hover:opacity-80"
              onClick={() => guessId && makeGuess(guessId)}
            >
              Confirm Guess
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Game over dialog */}
      <Dialog open={gameState.gameOver} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-[#FFFFFF] rounded-md md:p-10 p-5 font-[victor]">
          <DialogHeader>
            <DialogTitle className="text-[2c2c2c] text-xl">Game Over!</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <p className="text-xl mb-4">
              {gameState.winner === currentPlayer?.userName 
                ? 'Congratulations! You won!' 
                : `${gameState.winner} guessed correctly and won!`}
            </p>
            
            {gameState.myCharacter && (
              <div className="flex flex-col items-center mb-4">
                <p>Your character was:</p>
                <img 
                  src={gameState.myCharacter.image} 
                  alt={gameState.myCharacter.name} 
                  className="w-20 h-20 my-2"
                />
                <p className="font-bold">{gameState.myCharacter.name}</p>
              </div>
            )}
            
            {gameState.opponentCharacterId && (
              <div className="flex flex-col items-center mt-4">
                <p>Your opponent's character was:</p>
                <img 
                  src={characters.find(c => c.id === gameState.opponentCharacterId)?.image} 
                  alt="Opponent's character" 
                  className="w-20 h-20 my-2"
                />
                <p className="font-bold">
                  {characters.find(c => c.id === gameState.opponentCharacterId)?.name}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="px-5 py-2 bg-[#F79060] text-white rounded-md hover:bg-[#8E10D7]"
              onClick={goHome}
            >
              Back to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}