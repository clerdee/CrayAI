import React from 'react';
import { Box, Container, Typography, Grid, Paper, Avatar, Stack, IconButton } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

// --- FONT STYLES ---
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap');
      body, h1, h2, h3, h4, h5, h6, p, span, div, button {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
      }
    `}
  </style>
);

// --- TEAM DATA ---
const teamMembers = [
  { 
    id: 1, 
    name: "Cruz, HC.", 
    role: "Lead Developer", 
    initials: "HC",
    gradient: 'linear-gradient(135deg, #0A2540 0%, #008080 100%)' 
  },
  { 
    id: 2, 
    name: "Mallo, GH.", 
    role: "Backend Engineer", 
    initials: "GH",
    gradient: 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)'
  },
  { 
    id: 3, 
    name: "Laceda, J.", 
    role: "Researcher", 
    initials: "J",
    gradient: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)'
  },
  { 
    id: 4, 
    name: "Cortez, DD.", 
    role: "UI/UX Designer", 
    initials: "DD",
    gradient: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)'
  },
];

const AboutUs = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F9FC' }}>
      <FontStyles />
      <Navbar />
      
      {/* --- HEADER SECTION --- */}
      <Box sx={{ 
        pt: { xs: 6, md: 8 },      
        pb: { xs: 10, md: 14 },    
        bgcolor: '#0A2540', 
        color: 'white', 
        textAlign: 'center',
        background: 'linear-gradient(180deg, #0A2540 0%, #06182a 100%)'
      }}>
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: '#00E5FF', fontWeight: 800, letterSpacing: 3 }}>
            THE TEAM BEHIND CRAYAI
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, mb: 1, letterSpacing: '-1px', fontSize: { xs: '2rem', md: '3rem' } }}>
            Innovators. Developers. <br/> <span style={{ color: '#008080' }}>TUP Students.</span>
          </Typography>
        </Container>
      </Box>

      {/* --- TEAM GRID --- */}
      <Container maxWidth="xl" sx={{ mt: -10, mb: 10, px: { xs: 2, md: 6 } }}>
        <Grid container spacing={3} justifyContent="center" alignItems="stretch"> 
          {/* alignItems="stretch" forces all grid items to have the same height */}
          
          {teamMembers.map((member) => (
            <Grid item xs={12} sm={6} md={3} key={member.id} sx={{ display: 'flex' }}>
              {/* display: 'flex' makes the Paper fill the entire grid cell height */}
              
              <Paper 
                elevation={0}
                sx={{ 
                  width: '100%',
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '30px', 
                  bgcolor: 'white',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-10px)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.12)'
                  }
                }}
              >
                {/* 1. HEADER */}
                <Box 
                  sx={{
                    height: '130px',
                    width: '100%',
                    background: member.gradient,
                    position: 'relative',
                    borderRadius: '0 0 50% 50% / 0 0 25px 25px',
                    mb: '50px', 
                    flexShrink: 0 
                  }}
                >
                  <Box 
                    sx={{
                      position: 'absolute',
                      bottom: '-45px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      p: 0.8,
                      bgcolor: 'white',
                      borderRadius: '50%',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 90, 
                        height: 90, 
                        bgcolor: '#E0F2F1', 
                        color: '#0A2540', 
                        fontSize: '1.8rem', 
                        fontWeight: 800
                      }}
                    >
                      {member.initials}
                    </Avatar>
                  </Box>
                </Box>

                {/* 2. CONTENT */}
                <Box sx={{ 
                  px: 2, 
                  pb: 4, 
                  textAlign: 'center', 
                  flexGrow: 1, 
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0A2540', letterSpacing: '-0.5px' }}>
                    {member.name.toUpperCase()}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#008080', fontWeight: 600, mb: 2, fontSize: '0.8rem' }}>
                    @{member.role.replace(/\s+/g, '').toLowerCase()}
                  </Typography>
                  
                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                    <IconButton size="small" sx={{ color: '#0A2540', '&:hover': { color: '#008080' } }}>
                      <GitHubIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#0A2540', '&:hover': { color: '#008080' } }}>
                      <LinkedInIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#0A2540', '&:hover': { color: '#008080' } }}>
                      <EmailIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  {/* FIX: Increased minHeight to 60px.
                     This forces a consistent height whether the text is 1 line or 2 lines.
                  */}
                  <Box sx={{ mt: 'auto', minHeight: '60px', display: 'flex', alignItems: 'start', justifyContent: 'center' }}>
                     <Typography variant="body2" sx={{ color: '#556987', fontSize: '0.85rem', lineHeight: 1.5 }}>
                       Specializing in {member.role.toLowerCase()}.
                     </Typography>
                  </Box>
                </Box>

              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default AboutUs;