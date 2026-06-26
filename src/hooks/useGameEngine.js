import { useState, useEffect, useRef } from "react";
import { initBricks } from "../utils/levelGenerator";

export const useGameEngine = () => {
  // Game constants
  const gameWidth = 320;
  const gameHeight = 480;
  const paddleHeight = 10;
  const ballSize = 10;
  const boomRadius = 1;

  // UI & Flow State (Safe to use useState for low-frequency changes)
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("Click Start to Play");
  const [topScore, setTopScore] = useState(() => parseInt(localStorage.getItem("topScore")) || 0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [lifeLostState, setLifeLostState] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  // Visual effects state
  const [popAnimations, setPopAnimations] = useState([]);
  
  // High-Frequency Physics State (Stored in synchronous useRef to prevent stale closures and duplicate glitches)
  const physicsRef = useRef({
    balls: [],
    bricks: [],
    fallingStar: null,
    fallingHeart: null,
    fallingExpand: null,
    fallingSpeed: null,
    paddleWidth: 60,
    speedBuffActive: false,
    score: 0,
    lives: 1,
    level: 1,
    levelJustCompleted: false
  });

  // Force React to re-render to display the latest physicsRef data
  const [tick, setTick] = useState(0);

  // Input State
  const [paddleXState, setPaddleXState] = useState(130);
  const paddleX = paddleXState;
  const paddleXRef = useRef(130);
  const keys = useRef({ ArrowLeft: false, ArrowRight: false });

  const setPaddleX = (newX) => {
    let x = typeof newX === "function" ? newX(paddleXRef.current) : newX;
    x = Math.max(0, Math.min(gameWidth - physicsRef.current.paddleWidth, x));
    paddleXRef.current = x;
    setPaddleXState(x);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.ArrowLeft = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.ArrowRight = true;
    };
    const handleKeyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.ArrowLeft = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.ArrowRight = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const addPop = (x, y, type = "pop") => {
    const id = Date.now() + Math.random();
    setPopAnimations((prev) => [...prev, { x, y, id, type }]);
    setTimeout(() => {
      setPopAnimations((prev) => prev.filter((p) => p.id !== id));
    }, 400);
  };

  const addParticles = (x, y, color) => {
    const id = Date.now() + Math.random();
    const particles = Array.from({ length: 8 }).map(() => ({
       dx: (Math.random() - 0.5) * 8,
       dy: (Math.random() - 0.5) * 8,
       size: Math.random() * 4 + 2,
    }));
    setPopAnimations((prev) => [...prev, { x, y, id, type: "particles", color, particles }]);
    setTimeout(() => {
      setPopAnimations((prev) => prev.filter((p) => p.id !== id));
    }, 500);
  };

  const startGame = (customLevel = null) => {
    setRunning(true);
    setPaused(false);
    setMessage("");
    setLifeLostState(false);
    
    const targetLevel = (customLevel !== null && typeof customLevel === 'number') ? customLevel : physicsRef.current.level;
    
    physicsRef.current = {
      ...physicsRef.current,
      level: targetLevel,
      bricks: initBricks(targetLevel),
      balls: [{ x: 160, y: 300, dx: 2.5, dy: -2.5 }],
      fallingStar: null,
      fallingHeart: null,
      fallingExpand: null,
      fallingSpeed: null,
      paddleWidth: 60,
      speedBuffActive: false,
      levelJustCompleted: false
    };
    setTick(t => t + 1);
  };

  const restartGame = () => {
    physicsRef.current.score = 0;
    physicsRef.current.lives = 1;
    physicsRef.current.level = 1;
    setLevelComplete(false);
    setShowGameOver(false);
    startGame(1);
  };

  const handleLevelAdvance = () => {
    physicsRef.current.level += 1;
    setLevelComplete(false);
    physicsRef.current.levelJustCompleted = false;
    startGame(physicsRef.current.level);
  };

  const handleRetryLevel = () => {
    setLevelComplete(false);
    physicsRef.current.levelJustCompleted = false;
    startGame();
  };

  const endGame = (win) => {
    setRunning(false);
    setPaused(false);
    const finalScore = physicsRef.current.score;
    if (finalScore > topScore) {
      setTopScore(finalScore);
      localStorage.setItem("topScore", finalScore);
    }
    setShowGameOver(true);
    setMessage(win ? "🎉 You Win!" : "💀 Game Over");
  };

  const resumeAfterLifeLoss = () => {
    physicsRef.current.balls = [{ x: paddleXRef.current + physicsRef.current.paddleWidth / 2 - ballSize / 2, y: gameHeight - paddleHeight - ballSize - 2, dx: 2.5, dy: -2.5 }];
    physicsRef.current.fallingExpand = null;
    physicsRef.current.fallingSpeed = null;
    physicsRef.current.paddleWidth = 60;
    physicsRef.current.speedBuffActive = false;
    
    setRunning(true);
    setPaused(false);
    setLifeLostState(false);
    setCountdown(null);
    setMessage("");
    setTick(t => t + 1);
  };

  // Pure physics loop using Synchronous useRef data to prevent ghost bugs
  const physicsLoop = (dt) => {
    const state = physicsRef.current;
    if (state.bricks.length === 0) return;

    const timeScale = dt * 60; // 1.0 at 60fps

    if (keys.current.ArrowLeft) setPaddleX((prev) => prev - 7 * timeScale);
    if (keys.current.ArrowRight) setPaddleX((prev) => prev + 7 * timeScale);

    const currentPaddleX = paddleXRef.current;

    state.balls = state.balls.map((ball) => {
      let { x, y, dx, dy } = ball;
      
      const targetSpeed = state.speedBuffActive ? 6.0 : 3.5;
      const currentSpeed = Math.sqrt(dx * dx + dy * dy);
      if (currentSpeed > 0 && currentSpeed !== targetSpeed) {
        dx = (dx / currentSpeed) * targetSpeed;
        dy = (dy / currentSpeed) * targetSpeed;
      }

      if (x + dx * timeScale < 0 || x + dx * timeScale + ballSize > gameWidth) dx = -dx;
      if (y + dy * timeScale < 0) dy = -dy;

      if (y + dy * timeScale + ballSize > gameHeight - paddleHeight && x + ballSize > currentPaddleX && x < currentPaddleX + state.paddleWidth) {
        const hitPoint = (x + ballSize / 2) - (currentPaddleX + state.paddleWidth / 2);
        let normalizedHit = hitPoint / (state.paddleWidth / 2);
        normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
        
        const speed = Math.sqrt(dx * dx + dy * dy);
        const bounceAngle = normalizedHit * (Math.PI / 3);
        
        dx = speed * Math.sin(bounceAngle);
        dy = -Math.abs(speed * Math.cos(bounceAngle));
        if (dy > -2) dy = -2; 
      } else if (y + dy * timeScale + ballSize > gameHeight) {
        return null;
      }

      const newBall = { x: x + dx * timeScale, y: y + dy * timeScale, dx, dy };

      let hitBrickIndex = -1;
      for (let i = 0; i < state.bricks.length; i++) {
        const brick = state.bricks[i];
        if (
          brick.status &&
          newBall.x + ballSize > brick.x &&
          newBall.x < brick.x + 45 &&
          newBall.y + ballSize > brick.y &&
          newBall.y < brick.y + 20
        ) {
          hitBrickIndex = i;
          break;
        }
      }

      if (hitBrickIndex !== -1) {
        const hitBrick = state.bricks[hitBrickIndex];
        dy = -dy;
        if (hitBrick.isBoom) {
          for (let b of state.bricks) {
            if (b.status && Math.abs(b.row - hitBrick.row) <= boomRadius && Math.abs(b.col - hitBrick.col) <= boomRadius) {
              state.score += b.isMystery ? 10 : 1;
              addPop(b.x + 22, b.y + 10, "boom");
              b.status = false;
            }
          }
        } else {
          hitBrick.hp -= 1;
          const rowColors = ["#0affef", "#ff2079", "#ffe900", "#7a27ff", "#05ffa1"];
          const brickColor = hitBrick.isArmored ? "#c0392b" : rowColors[hitBrick.row % rowColors.length];

          if (hitBrick.hp <= 0) {
            state.score += hitBrick.isMystery ? 10 : (hitBrick.isArmored ? 5 : 1);
            if (hitBrick.isMystery) state.fallingStar = { x: hitBrick.x + 20, y: hitBrick.y + 20 };
            if (hitBrick.isHeart) state.fallingHeart = { x: hitBrick.x + 20, y: hitBrick.y + 20 };
            if (hitBrick.isExpand) state.fallingExpand = { x: hitBrick.x + 20, y: hitBrick.y + 20 };
            if (hitBrick.isSpeed) state.fallingSpeed = { x: hitBrick.x + 20, y: hitBrick.y + 20 };

            addParticles(hitBrick.x + 22, hitBrick.y + 10, brickColor);
            state.bricks[hitBrickIndex].status = false;
          } else {
            addParticles(hitBrick.x + 22, hitBrick.y + 10, brickColor);
            state.score += 1;
          }
        }
      }

      return { x: x + dx * timeScale, y: y + dy * timeScale, dx, dy };
    }).filter(Boolean);

    // Update Powerups
    if (state.fallingStar) {
      state.fallingStar.y += 2 * timeScale;
      const paddleTop = gameHeight - paddleHeight;
      if (
        state.fallingStar.y + ballSize >= paddleTop &&
        state.fallingStar.y <= paddleTop + 4 &&
        state.fallingStar.x + ballSize > currentPaddleX &&
        state.fallingStar.x < currentPaddleX + state.paddleWidth
      ) {
        state.balls.push({ x: 160, y: 300, dx: 3.5, dy: -3.5 });
        addPop(state.fallingStar.x, paddleTop);
        state.fallingStar = null;
      } else if (state.fallingStar.y > gameHeight) {
        state.fallingStar = null;
      }
    }

    if (state.fallingHeart) {
      state.fallingHeart.y += 2 * timeScale;
      const paddleTop = gameHeight - paddleHeight;
      if (
        state.fallingHeart.y + ballSize >= paddleTop &&
        state.fallingHeart.y <= paddleTop + 4 &&
        state.fallingHeart.x + ballSize > currentPaddleX &&
        state.fallingHeart.x < currentPaddleX + state.paddleWidth
      ) {
        state.lives += 1;
        addPop(state.fallingHeart.x, paddleTop);
        state.fallingHeart = null;
      } else if (state.fallingHeart.y > gameHeight) {
        state.fallingHeart = null;
      }
    }

    if (state.fallingExpand) {
      state.fallingExpand.y += 2 * timeScale;
      const paddleTop = gameHeight - paddleHeight;
      if (
        state.fallingExpand.y + ballSize >= paddleTop &&
        state.fallingExpand.y <= paddleTop + 4 &&
        state.fallingExpand.x + ballSize > currentPaddleX &&
        state.fallingExpand.x < currentPaddleX + state.paddleWidth
      ) {
        state.paddleWidth = 100;
        setTimeout(() => { if (physicsRef.current) physicsRef.current.paddleWidth = 60; }, 15000);
        addPop(state.fallingExpand.x, paddleTop);
        state.fallingExpand = null;
      } else if (state.fallingExpand.y > gameHeight) {
        state.fallingExpand = null;
      }
    }

    if (state.fallingSpeed) {
      state.fallingSpeed.y += 2.5 * timeScale;
      const paddleTop = gameHeight - paddleHeight;
      if (
        state.fallingSpeed.y + ballSize >= paddleTop &&
        state.fallingSpeed.y <= paddleTop + 4 &&
        state.fallingSpeed.x + ballSize > currentPaddleX &&
        state.fallingSpeed.x < currentPaddleX + state.paddleWidth
      ) {
        state.speedBuffActive = true;
        setTimeout(() => { if (physicsRef.current) physicsRef.current.speedBuffActive = false; }, 10000);
        addPop(state.fallingSpeed.x, paddleTop);
        state.fallingSpeed = null;
      } else if (state.fallingSpeed.y > gameHeight) {
        state.fallingSpeed = null;
      }
    }

    // Win condition check
    const allBricksCleared = state.bricks.every((b) => !b.status);
    if (allBricksCleared && !state.levelJustCompleted) {
      state.levelJustCompleted = true;
      setLevelComplete(true);
      return;
    }

    // Loss condition check
    if (state.balls.length === 0 && !state.levelJustCompleted && !state.fallingStar && !state.fallingHeart && !state.fallingExpand && !state.fallingSpeed) {
      if (state.lives > 0) {
        state.lives -= 1;
        setLifeLostState(true);
        setMessage("Life lost! Get ready...");
        let counter = 5;
        setCountdown(counter);
        const intv = setInterval(() => {
          counter--;
          setCountdown(counter);
          if (counter <= 0) {
            clearInterval(intv);
            resumeAfterLifeLoss();
          }
        }, 1000);
        return;
      } else {
        endGame(false);
        return;
      }
    }

    setTick(t => t + 1); // Force React to paint the new frame
  };

  useEffect(() => {
    let animationFrameId;
    let lastTime = 0;
    if (running && !paused && !lifeLostState) {
      const loop = (time) => {
        if (!lastTime) lastTime = time;
        const dt = (time - lastTime) / 1000;
        lastTime = time;
        const cappedDt = Math.min(dt, 0.1); 
        physicsLoop(cappedDt);
        animationFrameId = requestAnimationFrame(loop);
      };
      animationFrameId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [running, paused, lifeLostState]); // Safe dependencies because loop relies on physicsRef

  return {
    gameWidth, gameHeight, ballSize, paddleHeight,
    running, paused, setPaused, message, topScore,
    levelComplete, showGameOver, lifeLostState, countdown, popAnimations,
    paddleX, setPaddleX,
    
    // Spread the physics state so BrickBreaker.jsx can read it exactly as before
    ...physicsRef.current,
    
    startGame, restartGame, handleLevelAdvance, handleRetryLevel
  };
};
