import React from 'react';
import { Box, Typography, Paper, Stack, Button } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LanguageIcon from '@mui/icons-material/Language';

const AboutPage = () => {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 2, color: "#fff", p: 3 }}>
      <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, p: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <Typography variant="h4" sx={{ color: "#00e5ff", fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 10px #00e5ff", mb: 3 }}>
          ABOUT THE GAME
        </Typography>
        
        <Typography variant="h6" sx={{ color: "#ffe900", mt: 2, mb: 1, fontFamily: "'Orbitron', sans-serif" }}>How to Play</Typography>
        <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.8, mb: 1 }}>
          • Use <strong>Left/Right Arrows</strong> or <strong>A/D keys</strong> to smoothly move the paddle.
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.8, mb: 1 }}>
          • On mobile, <strong>tap anywhere</strong> on the game board to snap the paddle instantly.
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.8, mb: 1 }}>
          • Break all the neon bricks to advance to the next level!
        </Typography>
        
        <Typography variant="h6" sx={{ color: "#ff2079", mt: 3, mb: 1, fontFamily: "'Orbitron', sans-serif" }}>Power-ups & Hazards</Typography>
        <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.8, mb: 1 }}>
          🌟 <strong>Mystery Star:</strong> Catch for +10 bonus points!
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.8, mb: 1 }}>
          ❤️ <strong>Heart:</strong> Catch to gain an extra life!
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.8, mb: 1 }}>
          💣 <strong>Bomb Brick:</strong> Hitting this causes a blast radius that destroys nearby bricks!
        </Typography>
        
        <Typography variant="h6" sx={{ color: "#05ffa1", mt: 4, mb: 1, fontFamily: "'Orbitron', sans-serif" }}>Credits</Typography>
        <Typography variant="body1" sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.8, mb: 2 }}>
          Developed by <strong>Vaibhav</strong>. <br /><br />
          Built with React, Vite, Framer Motion, and Material UI. This project is part of a personal portfolio showcasing highly interactive, performant, and responsive web applications with modern design aesthetics. It features a custom lightweight physics engine, advanced React state management via custom hooks, and optimized render cycles to ensure a buttery-smooth 60fps arcade experience across all devices.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: "wrap", gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<GitHubIcon />}
            href="https://github.com/vaibhav281/brick-breaker-game"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              color: "#05ffa1", 
              borderColor: "#05ffa1",
              fontFamily: "'Orbitron', sans-serif",
              "&:hover": { backgroundColor: "rgba(5, 255, 161, 0.1)", borderColor: "#fff", color: "#fff" }
            }}
          >
            GitHub Repo
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<LanguageIcon />}
            href="https://vaibhavchavan-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              color: "#00e5ff", 
              borderColor: "#00e5ff",
              fontFamily: "'Orbitron', sans-serif",
              "&:hover": { backgroundColor: "rgba(0, 229, 255, 0.1)", borderColor: "#fff", color: "#fff" }
            }}
          >
            My Portfolio
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AboutPage;
