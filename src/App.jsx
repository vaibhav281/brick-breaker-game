import React, { useState } from "react";
import BrickBreaker from "./components/BrickBreaker";
import AboutPage from "./components/AboutPage";
import { Box, Typography, Button, Stack } from "@mui/material";

function App() {
  const [currentView, setCurrentView] = useState("game");

  return (
    <Box sx={{ pb: 2, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Navigation Bar */}
      <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 1, px: 1 }}>
        <Button 
          variant={currentView === "game" ? "contained" : "outlined"}
          onClick={() => setCurrentView("game")}
          size="small"
          sx={{
            fontFamily: "'Orbitron', sans-serif",
            backgroundColor: currentView === "game" ? "#00e5ff" : "transparent",
            color: currentView === "game" ? "#000" : "#00e5ff",
            borderColor: "#00e5ff",
            fontSize: "0.7rem",
            "&:hover": { backgroundColor: currentView === "game" ? "#fff" : "rgba(0,229,255,0.1)", borderColor: "#fff" }
          }}
        >
          GAME
        </Button>
        <Button 
          variant={currentView === "about" ? "contained" : "outlined"}
          onClick={() => setCurrentView("about")}
          size="small"
          sx={{
            fontFamily: "'Orbitron', sans-serif",
            backgroundColor: currentView === "about" ? "#00e5ff" : "transparent",
            color: currentView === "about" ? "#000" : "#00e5ff",
            borderColor: "#00e5ff",
            fontSize: "0.7rem",
            "&:hover": { backgroundColor: currentView === "about" ? "#fff" : "rgba(0,229,255,0.1)", borderColor: "#fff" }
          }}
        >
          ABOUT
        </Button>
      </Stack>

      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          textAlign: "center", 
          mt: 1, 
          mb: 0.5,
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          color: "#fff",
          textShadow: "0 0 10px #00e5ff, 0 0 20px #00e5ff",
          letterSpacing: 1,
          fontSize: { xs: "1.5rem", sm: "2rem" }
        }}
      >
        BRICK BREAKER
      </Typography>
      
      {currentView === "game" ? (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <BrickBreaker />
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <AboutPage />
        </Box>
      )}
    </Box>
  );
}

export default App;
