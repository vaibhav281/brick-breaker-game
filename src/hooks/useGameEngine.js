import { useState, useEffect, useRef } from "react";

export const useGameEngine = () => {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(() => parseInt(localStorage.getItem("topScore")) || 0);
  const [message, setMessage] = useState("Click Start to Play");
  const [balls, setBalls] = useState([{ x: 160, y: 200, dx: 2.8, dy: -2.8 }]);
  const [paddleXState, setPaddleXState] = useState(130);
  const paddleXRef = useRef(130);
  const keys = useRef({ ArrowLeft: false, ArrowRight: false });
  const [paddleWidth, setPaddleWidth] = useState(60);

  const paddleX = paddleXState;
  const setPaddleX = (newX) => {
    let x = typeof newX === "function" ? newX(paddleXRef.current) : newX;
    x = Math.max(0, Math.min(gameWidth - paddleWidth, x));
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

  const [bricks, setBricks] = useState([]);
  const [level, setLevel] = useState(1);
  const [ballInterval, setBallInterval] = useState(null);
  const [fallingStar, setFallingStar] = useState(null);
  const [fallingHeart, setFallingHeart] = useState(null);
  const [fallingExpand, setFallingExpand] = useState(null);
  const [fallingSpeed, setFallingSpeed] = useState(null);
  const [speedBuffActive, setSpeedBuffActive] = useState(false);
  const [lives, setLives] = useState(1);
  const [levelComplete, setLevelComplete] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [levelJustCompleted, setLevelJustCompleted] = useState(false);
  const [popAnimations, setPopAnimations] = useState([]);
  const [lifeLostState, setLifeLostState] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const gameWidth = 320;
  const gameHeight = 480;
  const paddleHeight = 10;
  const ballSize = 10;
  const boomRadius = 1;

  const addPop = (x, y, type = "pop") => {
    const id = Date.now() + Math.random();
    const pop = { x, y, id, type };
    setPopAnimations((prev) => [...prev, pop]);
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

  const initBricks = (lvl = level) => {
    const rows = 3 + lvl;
    const cols = 6;
    const bWidth = 45;
    const bHeight = 20;
    let result = [];
    const total = rows * cols;
    const getRandomUniqueIndex = (used) => {
       let idx;
       do { idx = Math.floor(Math.random() * total); } while(used.includes(idx));
       used.push(idx);
       return idx;
    };
    const usedIndices = [];
    const mysteryIndex = getRandomUniqueIndex(usedIndices);
    const boomIndex = getRandomUniqueIndex(usedIndices);
    const heartIndex = getRandomUniqueIndex(usedIndices);
    const speedIndex = getRandomUniqueIndex(usedIndices);
    const expandIndex = getRandomUniqueIndex(usedIndices);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.75) {
          const id = r * cols + c;
          const isSpecial = usedIndices.includes(id);
          const isArmored = Math.random() < 0.20; // 20% chance
          result.push({
            id,
            x: c * (bWidth + 5) + 5,
            y: r * (bHeight + 5) + 30,
            status: true,
            row: r,
            col: c,
            isMystery: id === mysteryIndex,
            isBoom: id === boomIndex,
            isHeart: id === heartIndex,
            isSpeed: id === speedIndex,
            isExpand: id === expandIndex,
            isArmored: isArmored && !isSpecial,
            hp: (isArmored && !isSpecial) ? 2 : 1,
          });
        }
      }
    }
    return result;
  };

  const startGame = (customLevel = null) => {
    setRunning(true);
    setPaused(false);
    setMessage("");
    const targetLevel = (customLevel !== null && typeof customLevel === 'number') ? customLevel : level;
    setBricks(initBricks(targetLevel));
    setBalls([{ x: 160, y: 300, dx: 2.5, dy: -2.5 }]);
    setFallingStar(null);
    setFallingHeart(null);
    setFallingExpand(null);
    setFallingSpeed(null);
    setPaddleWidth(60);
    setSpeedBuffActive(false);
  };

  const restartGame = () => {
    setScore(0);
    setLevel(1);
    setLives(1);
    setLevelComplete(false);
    setShowGameOver(false);
    startGame(1);
  };

  const handleLevelAdvance = () => {
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setLevelComplete(false);
    setLevelJustCompleted(false);
    startGame(nextLevel);
  };

  const handleRetryLevel = () => {
    setLevelComplete(false);
    setLevelJustCompleted(false);
    startGame();
  };

  const endGame = (win, finalScore = score) => {
    setRunning(false);
    setPaused(false);
    if (finalScore > topScore) {
      setTopScore(finalScore);
      localStorage.setItem("topScore", finalScore);
    }
    setShowGameOver(true);
    setMessage(win ? "🎉 You Win!" : "💀 Game Over");
  };

  const resumeAfterLifeLoss = () => {
    setBalls([{ x: paddleX + paddleWidth / 2 - ballSize / 2, y: gameHeight - paddleHeight - ballSize - 2, dx: 2.5, dy: -2.5 }]);
    setRunning(true);
    setPaused(false);
    setLifeLostState(false);
    setCountdown(null);
    setMessage("");
    setFallingExpand(null);
    setFallingSpeed(null);
    setPaddleWidth(60);
    setSpeedBuffActive(false);
  };

  const triggerLifeLost = () => {
    setLifeLostState(true);
    setCountdown(5);
    setMessage("Life lost! Get ready...");
    let counter = 5;
    const countdownInterval = setInterval(() => {
      counter--;
      setCountdown(counter);
      if (counter <= 0) {
        clearInterval(countdownInterval);
        resumeAfterLifeLoss();
      }
    }, 1000);
  };

  const moveBall = () => {
    if (lifeLostState) return;
    if (bricks.length === 0) return; // Prevent glitch auto-completing levels before bricks are initialized

    if (keys.current.ArrowLeft) setPaddleX((prev) => prev - 7);
    if (keys.current.ArrowRight) setPaddleX((prev) => prev + 7);

    const currentPaddleX = paddleXRef.current;

    let updatedBalls = [...balls];
    let updatedBricks = [...bricks];
    let newScore = score;
    let newStar = fallingStar;
    let newHeart = fallingHeart;
    let newExpand = fallingExpand;
    let newSpeed = fallingSpeed;

    updatedBalls = updatedBalls.map((ball) => {
      let { x, y, dx, dy } = ball;
      
      const targetSpeed = speedBuffActive ? 6.0 : 3.5; // Fast (buffed) vs Normal (slower) speed
      const currentSpeed = Math.sqrt(dx * dx + dy * dy);
      if (currentSpeed > 0 && currentSpeed !== targetSpeed) {
        dx = (dx / currentSpeed) * targetSpeed;
        dy = (dy / currentSpeed) * targetSpeed;
      }

      if (x + dx < 0 || x + dx + ballSize > gameWidth) dx = -dx;
      if (y + dy < 0) dy = -dy;

      if (y + dy + ballSize > gameHeight - paddleHeight && x + ballSize > currentPaddleX && x < currentPaddleX + paddleWidth) {
        // Dynamic bounce angle based on hit location
        const hitPoint = (x + ballSize / 2) - (currentPaddleX + paddleWidth / 2);
        let normalizedHit = hitPoint / (paddleWidth / 2);
        normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
        
        const speed = Math.sqrt(dx * dx + dy * dy);
        const bounceAngle = normalizedHit * (Math.PI / 3); // Max 60 degrees
        
        dx = speed * Math.sin(bounceAngle);
        dy = -Math.abs(speed * Math.cos(bounceAngle));
        if (dy > -2) dy = -2; // Ensure minimum vertical momentum
      } else if (y + dy + ballSize > gameHeight) {
        return null;
      }

      const newBall = { x: x + dx, y: y + dy, dx, dy };

      let hitBrickIndex = -1;
      for (let i = 0; i < updatedBricks.length; i++) {
        const brick = updatedBricks[i];
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
        const hitBrick = updatedBricks[hitBrickIndex];
        dy = -dy;
        if (hitBrick.isBoom) {
          for (let b of updatedBricks) {
            if (b.status && Math.abs(b.row - hitBrick.row) <= boomRadius && Math.abs(b.col - hitBrick.col) <= boomRadius) {
              newScore += b.isMystery ? 10 : 1;
              addPop(b.x + 22, b.y + 10, "boom");
              b.status = false;
            }
          }
        } else {
          hitBrick.hp -= 1;
          const rowColors = ["#0affef", "#ff2079", "#ffe900", "#7a27ff", "#05ffa1"];
          const brickColor = hitBrick.isArmored ? "#c0392b" : rowColors[hitBrick.row % rowColors.length];

          if (hitBrick.hp <= 0) {
            newScore += hitBrick.isMystery ? 10 : (hitBrick.isArmored ? 5 : 1);
            if (hitBrick.isMystery) newStar = { x: hitBrick.x + 20, y: hitBrick.y + 20 };
            if (hitBrick.isHeart) newHeart = { x: hitBrick.x + 20, y: hitBrick.y + 20 };
            if (hitBrick.isExpand) newExpand = { x: hitBrick.x + 20, y: hitBrick.y + 20 };
            if (hitBrick.isSpeed) newSpeed = { x: hitBrick.x + 20, y: hitBrick.y + 20 };

            addParticles(hitBrick.x + 22, hitBrick.y + 10, brickColor);
            updatedBricks[hitBrickIndex] = { ...hitBrick, status: false };
          } else {
            addParticles(hitBrick.x + 22, hitBrick.y + 10, brickColor);
            updatedBricks[hitBrickIndex] = { ...hitBrick };
            newScore += 1;
          }
        }
      }

      return { x: x + dx, y: y + dy, dx, dy };
    }).filter(Boolean);

    if (newStar) {
      newStar.y += 2;
      const paddleTop = gameHeight - paddleHeight;
      if (
        newStar.y + ballSize >= paddleTop &&
        newStar.y <= paddleTop + 4 &&
        newStar.x + ballSize > currentPaddleX &&
        newStar.x < currentPaddleX + paddleWidth
      ) {
        updatedBalls.push({ x: 160, y: 300, dx: 3.5, dy: -3.5 });
        addPop(newStar.x, paddleTop);
        newStar = null;
      } else if (newStar.y > gameHeight) {
        newStar = null;
      }
    }

    if (newHeart) {
      newHeart.y += 2;
      const paddleTop = gameHeight - paddleHeight;
      if (
        newHeart.y + ballSize >= paddleTop &&
        newHeart.y <= paddleTop + 4 &&
        newHeart.x + ballSize > currentPaddleX &&
        newHeart.x < currentPaddleX + paddleWidth
      ) {
        setLives((l) => l + 1);
        addPop(newHeart.x, paddleTop);
        newHeart = null;
      } else if (newHeart.y > gameHeight) {
        newHeart = null;
      }
    }

    if (newExpand) {
      newExpand.y += 2;
      const paddleTop = gameHeight - paddleHeight;
      if (
        newExpand.y + ballSize >= paddleTop &&
        newExpand.y <= paddleTop + 4 &&
        newExpand.x + ballSize > currentPaddleX &&
        newExpand.x < currentPaddleX + paddleWidth
      ) {
        setPaddleWidth(100);
        setTimeout(() => setPaddleWidth(60), 15000); // Lasts 15s
        addPop(newExpand.x, paddleTop);
        newExpand = null;
      } else if (newExpand.y > gameHeight) {
        newExpand = null;
      }
    }

    if (newSpeed) {
      newSpeed.y += 2.5;
      const paddleTop = gameHeight - paddleHeight;
      if (
        newSpeed.y + ballSize >= paddleTop &&
        newSpeed.y <= paddleTop + 4 &&
        newSpeed.x + ballSize > currentPaddleX &&
        newSpeed.x < currentPaddleX + paddleWidth
      ) {
        setSpeedBuffActive(true);
        setTimeout(() => setSpeedBuffActive(false), 10000); // Fast speed lasts 10s
        addPop(newSpeed.x, paddleTop);
        newSpeed = null;
      } else if (newSpeed.y > gameHeight) {
        newSpeed = null;
      }
    }

    const allBricksCleared = updatedBricks.every((b) => !b.status);
    if (allBricksCleared) {
      setBricks(updatedBricks); // visually clear the last brick
      setLevelJustCompleted(true);
      setLevelComplete(true);
      return;
    }

    if (updatedBalls.length === 0 && !levelJustCompleted && !newStar && !newHeart && !newExpand && !newSpeed) {
      clearInterval(ballInterval);
      if (lives > 0) {
        setLives((l) => l - 1);
        setLifeLostState(true);
        setMessage("Life lost! Get ready...");
        setTimeout(() => resumeAfterLifeLoss(), 5000);
        return;
      } else {
        endGame(false, newScore);
        return;
      }
    }

    setBalls(updatedBalls);
    setBricks(updatedBricks);
    setScore(newScore);
    setFallingStar(newStar);
    setFallingHeart(newHeart);
    setFallingExpand(newExpand);
    setFallingSpeed(newSpeed);
  };

  useEffect(() => {
    let animationFrameId;
    if (running && !paused && !lifeLostState) {
      animationFrameId = requestAnimationFrame(() => moveBall());
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [running, paused, bricks, fallingStar, fallingHeart, fallingExpand, fallingSpeed, lifeLostState, balls]);

  return {
    gameWidth, gameHeight, paddleWidth, paddleHeight, ballSize,
    running, paused, setPaused, score, topScore, message,
    balls, paddleX, setPaddleX, bricks, level, fallingStar, fallingHeart, fallingExpand, fallingSpeed, speedBuffActive,
    lives, levelComplete, showGameOver, popAnimations, lifeLostState, countdown,
    startGame, restartGame, handleLevelAdvance, handleRetryLevel
  };
};
