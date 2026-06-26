// ✅ UPDATED BrickBreaker.js with heart brick & lives support
import React, { useState, useEffect, useRef } from "react";
import { Box, Stack, Button, Typography, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, } from "@mui/material";
import { Pause, PlayArrow, Replay } from "@mui/icons-material";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useGameEngine } from "../hooks/useGameEngine";

const BrickBreaker = () => {
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  
  const {
    gameWidth, gameHeight, paddleWidth, paddleHeight, ballSize,
    running, paused, setPaused, score, topScore, message,
    balls, paddleX, setPaddleX, bricks, level, fallingStar, fallingHeart, fallingExpand, fallingSpeed, speedBuffActive,
    lives, levelComplete, showGameOver, popAnimations, lifeLostState, countdown,
    startGame, restartGame, handleLevelAdvance, handleRetryLevel
  } = useGameEngine();

  useEffect(() => {
    const updateScale = () => {
      // Calculate scale to perfectly fit both width and height on any device
      const availableWidth = window.innerWidth - 10; 
      const availableHeight = window.innerHeight - 80; // Account for App.jsx navigation header
      
      const gameTotalWidth = gameWidth;
      const gameTotalHeight = gameHeight + 60; // Game canvas + HUD combined height
      
      let newScale = Math.min(1, availableWidth / gameTotalWidth);
      if (gameTotalHeight * newScale > availableHeight) {
        newScale = availableHeight / gameTotalHeight;
      }
      setScale(newScale);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [gameHeight, gameWidth]);

  const playPop = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
  };

  useEffect(() => {
    if (levelComplete) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [levelComplete]);

  const handlePointerMove = (e) => {
    if (!gameRef.current) return;
    const bounds = gameRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - bounds.left;
    const scaledX = x / scale;
    setPaddleX(Math.max(0, Math.min(gameWidth - paddleWidth, scaledX - paddleWidth / 2)));
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt: 1, overflow: "hidden" }}>
      {/* Outer wrapper that scales both the HUD and Game Canvas synchronously */}
      <Box 
        sx={{ 
          transform: `scale(${scale})`, 
          transformOrigin: "top center",
          width: gameWidth,
          display: "flex", 
          flexDirection: "column",
        }}
      >
        {/* Compact Status Window (HUD) */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1,
            mb: 1,
            backgroundColor: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => setPaused((p) => !p)} size="small" sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.1)", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" }, borderRadius: 2 }}>
              {paused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
            </IconButton>
            <IconButton onClick={restartGame} size="small" sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.1)", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" }, borderRadius: 2 }}>
              <Replay fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
            {[
              { icon: <EmojiEventsIcon fontSize="small" sx={{ color: "#ffe900", mr: 0.5 }} />, val: topScore, color: "#ffe900" },
              { icon: <TrackChangesIcon fontSize="small" sx={{ color: "#00e5ff", mr: 0.5 }} />, val: score, color: "#00e5ff" },
              { icon: <RocketLaunchIcon fontSize="small" sx={{ color: "#ff2079", mr: 0.5 }} />, val: level, color: "#ff2079" },
              { icon: <FavoriteIcon fontSize="small" sx={{ color: "#ff4757", mr: 0.5 }} />, val: lives, color: "#ff4757" },
            ].map((stat, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.3)", border: `1px solid ${stat.color}40`, color: "#fff", fontSize: "0.8rem", fontWeight: 700, fontFamily: "'Inter', sans-serif", boxShadow: `inset 0 0 8px ${stat.color}20` }}>
                {stat.icon}
                {stat.val}
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Game Canvas */}
        <motion.div
          animate={popAnimations.some(p => p.type === 'boom') ? { x: [-2, 4, -8, 8, -8, 4, -2, 0] } : { x: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <Box
            ref={gameRef}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onTouchStart={handlePointerMove}
            sx={{
              position: "relative",
              width: gameWidth,
              height: gameHeight,
              border: "2px solid rgba(0, 229, 255, 0.3)",
              borderRadius: 3,
              backgroundColor: "#0a0e1a",
              backgroundImage: "linear-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.05) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              overflow: "hidden",
              touchAction: "none",
              boxShadow: "0 0 20px rgba(0, 229, 255, 0.1), inset 0 0 20px rgba(0, 229, 255, 0.05)",
            }}
          >

          <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: paddleX,
            width: paddleWidth,
            height: 12,
            background: "linear-gradient(90deg, #00b4d8, #00e5ff, #00b4d8)",
            borderRadius: 2,
            boxShadow: "0 0 8px #00e5ff, 0 0 20px rgba(0, 229, 255, 0.6)",
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {popAnimations.map((pop) => {
          if (pop.type === "particles") {
            return (
              <Box key={pop.id} sx={{ position: "absolute", top: pop.y, left: pop.x, pointerEvents: "none" }}>
                {pop.particles.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: p.dx * 8, y: p.dy * 8 + 15, scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      width: p.size,
                      height: p.size,
                      backgroundColor: pop.color,
                      boxShadow: `0 0 5px ${pop.color}`,
                      borderRadius: 1
                    }}
                  />
                ))}
              </Box>
            );
          }

          return (
            <motion.div
              key={pop.id}
              initial={{ scale: 1, opacity: pop.type === "boom" ? 1 : 0.9, backgroundColor: pop.type === "boom" ? "#ff6b6b" : "#81ecec" }}
              animate={{ scale: pop.type === "boom" ? 3 : 1.5, opacity: 0, backgroundColor: pop.type === "boom" ? "#ff3b3b" : "#81ecec" }}
              transition={{ duration: pop.type === "boom" ? 0.5 : 0.3, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: pop.y - 10,
                left: pop.x - 10,
                width: 20,
                height: 20,
                borderRadius: "50%",
                pointerEvents: "none",
              }}
              onAnimationStart={() => { if(pop.type !== 'boom') playPop(); }}
            />
          );
        })}

        {balls.map((ball, i) => (
          <Box
            key={`ball-${i}`}
            sx={{
              position: "absolute",
              top: ball.y,
              left: ball.x,
              width: ballSize,
              height: ballSize,
              backgroundColor: speedBuffActive ? "#ff2079" : "#05ffa1",
              borderRadius: "50%",
              boxShadow: speedBuffActive 
                ? "0 0 10px #ff2079, 0 0 20px #ff2079" 
                : "0 0 10px #05ffa1, 0 0 20px #05ffa1",
              transition: "background-color 0.2s, box-shadow 0.2s",
            }}
          />
        ))}
        {fallingStar && (
          <Box sx={{ position: "absolute", top: fallingStar.y, left: fallingStar.x, fontSize: 22, filter: "drop-shadow(0 0 8px #ffe900)" }}>
            ⭐
          </Box>
        )}
        {fallingHeart && (
          <Box sx={{ position: "absolute", top: fallingHeart.y, left: fallingHeart.x, fontSize: 22, filter: "drop-shadow(0 0 8px #ff4757)" }}>
            ❤️
          </Box>
        )}
        {fallingExpand && (
          <Box sx={{ position: "absolute", top: fallingExpand.y, left: fallingExpand.x, fontSize: 22, filter: "drop-shadow(0 0 8px #05ffa1)" }}>
            ↔️
          </Box>
        )}
        {fallingSpeed && (
          <Box sx={{ position: "absolute", top: fallingSpeed.y, left: fallingSpeed.x, fontSize: 22, filter: "drop-shadow(0 0 8px #ffe900)" }}>
            ⚡
          </Box>
        )}
        {bricks.map((b) => {
          if (!b.status) return null;
          const rowColors = ["#0affef", "#ff2079", "#ffe900", "#7a27ff", "#05ffa1"];
          
          let baseColor = rowColors[b.row % rowColors.length];
          if (b.isBoom) baseColor = "#fff";
          if (b.isMystery) baseColor = "#00e5ff";
          if (b.isHeart) baseColor = "#ff4757";
          if (b.isSpeed) baseColor = "#ffe900";
          if (b.isExpand) baseColor = "#05ffa1";

          if (b.isArmored) {
            return (
              <motion.div
                key={b.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute", top: b.y, left: b.x, width: 45, height: 20,
                  backgroundColor: "#c0392b", // Real construction brick red
                  backgroundImage: "linear-gradient(335deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 100%)",
                  border: b.hp === 1 ? "1px dashed #7f8c8d" : "1px solid #7f8c8d",
                  borderRadius: 2,
                  display: "flex", justifyContent: "center", alignItems: "center",
                  boxShadow: "2px 2px 5px rgba(0,0,0,0.5), inset 0 0 5px rgba(0,0,0,0.3)",
                  overflow: "hidden"
                }}
              >
                {b.hp === 1 && <Box sx={{ position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(45deg, transparent 40%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.7) 55%, transparent 60%)' }} />}
              </motion.div>
            );
          }
          
          const shadowColor = b.isBoom ? "#ff4757" : baseColor;
          
          return (
            <motion.div
              key={b.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute", top: b.y, left: b.x, width: 45, height: 20,
                backgroundColor: `${baseColor}20`,
                border: `1px solid ${baseColor}`,
                borderRadius: 4,
                display: "flex", justifyContent: "center", alignItems: "center",
                boxShadow: `0 0 8px ${shadowColor}40, inset 0 0 8px ${baseColor}40`,
              }}
            >
              <Typography sx={{ fontSize: 12, textShadow: `0 0 5px ${baseColor}` }}>
                {b.isBoom ? "💣" : b.isMystery ? "🌟" : b.isHeart ? "❤️" : b.isSpeed ? "⚡" : b.isExpand ? "↔️" : ""}
              </Typography>
            </motion.div>
          );
        })}
        {!running && !levelComplete && !showGameOver && (
          <Box
            sx={{
              position: "absolute",
              top: 0, left: 0, width: "100%", height: "100%",
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
              backgroundColor: "rgba(10, 14, 26, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 10,
            }}
          >
            <Typography variant="h6" sx={{ color: "#00e5ff", mb: 3, textShadow: "0 0 10px #00e5ff", fontFamily: "'Orbitron', sans-serif" }}>
              {message || "READY?"}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={startGame} 
              sx={{ 
                color: "#00e5ff", 
                borderColor: "#00e5ff",
                boxShadow: "0 0 15px rgba(0,229,255,0.4), inset 0 0 10px rgba(0,229,255,0.2)",
                "&:hover": { backgroundColor: "rgba(0,229,255,0.1)", borderColor: "#fff" },
                px: 4, py: 1, borderRadius: 8, fontFamily: "'Orbitron', sans-serif", fontWeight: 700
              }}
            >
              ▶ START GAME
            </Button>
          </Box>
        )}
          </Box>
        </motion.div>
      </Box>

      {lifeLostState && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(4, 7, 32, 0.9)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              textAlign: "center",
              p: 4,
              border: "2px solid rgba(255,71,87,0.3)",
              borderRadius: 4,
              background: "radial-gradient(circle, rgba(255,71,87,0.1), transparent)",
              boxShadow: "0 0 30px rgba(255,71,87,0.2)",
              maxWidth: 340,
              width: "90%",
              animation: "fadeInUp 0.4s ease-out",
            }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                color: "#fff", 
                mb: 1, 
                fontFamily: "'Orbitron', sans-serif", 
                textShadow: "0 0 20px #ff4757",
                fontWeight: 700 
              }}
            >
              💔 LIFE LOST
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: "#fff", opacity: 0.8, fontFamily: "'Inter', sans-serif" }}>
              Get ready to continue...
            </Typography>
            
            {countdown !== null && (
              <Typography
                variant="h1"
                sx={{
                  color: "#00e5ff",
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 900,
                  textShadow: "0 0 15px #00e5ff, 0 0 30px #00e5ff",
                  animation: "pulse 1s ease-in-out infinite",
                  fontSize: "5rem"
                }}
              >
                {countdown}
              </Typography>
            )}
          </Box>

          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </Box>
      )}

      {levelComplete && (
        <Box
          sx={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(4, 7, 32, 0.9)", backdropFilter: "blur(8px)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          }}
        >
          <Box sx={{ textAlign: "center", p: 4, border: "2px solid rgba(0,229,255,0.3)", borderRadius: 4, background: "radial-gradient(circle, rgba(0,229,255,0.1), transparent)", boxShadow: "0 0 30px rgba(0,229,255,0.2)" }}>
            <Typography variant="h4" sx={{ color: "#fff", mb: 2, fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 15px #00e5ff" }}>LEVEL {level} COMPLETE</Typography>
            <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
              <Button onClick={handleRetryLevel} sx={{ color: "#aaa", fontFamily: "'Orbitron', sans-serif" }}>RETRY</Button>
              <Button onClick={handleLevelAdvance} variant="contained" sx={{ backgroundColor: "#00e5ff", color: "#000", "&:hover": { backgroundColor: "#fff" }, fontWeight: "bold", fontFamily: "'Orbitron', sans-serif" }}>NEXT LEVEL ▶</Button>
            </Stack>
          </Box>
        </Box>
      )}

      {showGameOver && (
        <Box
          sx={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(4, 7, 32, 0.9)", backdropFilter: "blur(8px)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          }}
        >
          <Box sx={{ textAlign: "center", p: 4, border: "2px solid rgba(255,71,87,0.3)", borderRadius: 4, background: "radial-gradient(circle, rgba(255,71,87,0.1), transparent)", boxShadow: "0 0 30px rgba(255,71,87,0.2)" }}>
            <Typography variant="h3" sx={{ color: "#fff", mb: 1, fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 20px #ff4757" }}>GAME OVER</Typography>
            <Typography variant="h6" sx={{ color: "#00e5ff", mb: 3, fontFamily: "'Orbitron', sans-serif" }}>FINAL SCORE: {score}</Typography>
            <Button onClick={restartGame} variant="contained" sx={{ backgroundColor: "#ff4757", color: "#fff", "&:hover": { backgroundColor: "#fff", color: "#000" }, fontWeight: "bold", px: 4, fontFamily: "'Orbitron', sans-serif" }}>RESTART GAME 🔁</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BrickBreaker;
