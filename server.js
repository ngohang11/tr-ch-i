const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/questions.json'), 'utf8'));
const QUOTAS = [50, 40, 30, 20, 10, 6, 3, 1];

const gameState = {
  status: 'LOBBY',
  currentQuestionIndex: -1,
  questionStartTime: 0,
  timer: null,
  timeLeft: 30,
  players: {}
};

io.on('connection', (socket) => {
  socket.on('player_join', ({ name }) => {
    const isLate = gameState.status !== 'LOBBY';
    gameState.players[socket.id] = {
      id: socket.id,
      name: name || `Học sinh ${socket.id.substring(0, 4)}`,
      isAlive: !isLate,
      currentAnswer: null,
      responseTime: Infinity,
      eliminatedAtQuestion: isLate ? 0 : null
    };

    socket.emit('join_success', {
      isAlive: gameState.players[socket.id].isAlive,
      status: gameState.status
    });

    io.emit('update_stats', getPlayerStats());
  });

  socket.on('submit_answer', ({ answer }) => {
    const player = gameState.players[socket.id];
    if (!player || !player.isAlive || gameState.status !== 'QUESTION_ACTIVE') return;
    if (player.currentAnswer !== null) return;

    const elapsedMs = Date.now() - gameState.questionStartTime;
    player.currentAnswer = answer;
    player.responseTime = elapsedMs;

    socket.emit('answer_accepted', { answer, responseTimeMs: elapsedMs });
    io.emit('admin_progress', getAnswerStats());
  });

  socket.on('admin_next_question', () => {
    if (gameState.currentQuestionIndex >= questions.length - 1) return;

    gameState.currentQuestionIndex += 1;
    gameState.status = 'QUESTION_ACTIVE';
    gameState.timeLeft = 30;
    gameState.questionStartTime = Date.now();

    Object.values(gameState.players).forEach(p => {
      if (p.isAlive) {
        p.currentAnswer = null;
        p.responseTime = Infinity;
      }
    });

    const q = questions[gameState.currentQuestionIndex];
    io.emit('new_question', {
      questionIndex: gameState.currentQuestionIndex + 1,
      totalQuestions: questions.length,
      title: q.title,
      options: q.options,
      quota: QUOTAS[gameState.currentQuestionIndex]
    });

    clearInterval(gameState.timer);
    gameState.timer = setInterval(() => {
      gameState.timeLeft -= 1;
      io.emit('timer_tick', { timeLeft: gameState.timeLeft });

      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.timer);
        processQuestionResult();
      }
    }, 1000);
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('update_stats', getPlayerStats());
  });
});

function processQuestionResult() {
  gameState.status = 'QUESTION_ENDED';
  const qIndex = gameState.currentQuestionIndex;
  const currentQuestion = questions[qIndex];
  const correctAnswer = currentQuestion.correct;
  const quota = QUOTAS[qIndex];

  const correctPlayers = Object.values(gameState.players).filter(p => 
    p.isAlive && p.currentAnswer === correctAnswer
  );

  correctPlayers.sort((a, b) => a.responseTime - b.responseTime);

  const qualifiedPlayers = correctPlayers.slice(0, quota);
  const qualifiedIds = new Set(qualifiedPlayers.map(p => p.id));

  Object.values(gameState.players).forEach(p => {
    if (p.isAlive) {
      if (!qualifiedIds.has(p.id)) {
        p.isAlive = false;
        p.eliminatedAtQuestion = qIndex + 1;
      }
    }
  });

  const survivors = Object.values(gameState.players).filter(p => p.isAlive);
  const isGameOver = qIndex === questions.length - 1 || survivors.length <= 1;
  if (isGameOver) gameState.status = 'GAME_OVER';

  io.emit('question_result', {
    questionIndex: qIndex + 1,
    correctAnswer,
    explanation: currentQuestion.explanation,
    quota,
    survivorsCount: survivors.length,
    qualifiedPlayers: qualifiedPlayers.map(p => ({ name: p.name, responseTime: (p.responseTime/1000).toFixed(2) + 's' })),
    isGameOver,
    winner: isGameOver && survivors.length > 0 ? survivors[0] : null
  });

  Object.values(gameState.players).forEach(p => {
    io.to(p.id).emit('personal_status', {
      isAlive: p.isAlive,
      eliminatedAt: p.eliminatedAtQuestion
    });
  });
}

function getPlayerStats() {
  const all = Object.values(gameState.players);
  return {
    total: all.length,
    alive: all.filter(p => p.isAlive).length,
    eliminated: all.filter(p => !p.isAlive).length
  };
}

function getAnswerStats() {
  const alivePlayers = Object.values(gameState.players).filter(p => p.isAlive);
  return {
    submitted: alivePlayers.filter(p => p.currentAnswer !== null).length,
    totalAlive: alivePlayers.length
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server đang chạy tại cổng ${PORT}`));