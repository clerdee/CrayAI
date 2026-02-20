import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Avatar, 
  Stack, 
  IconButton,
  Tooltip
} from '@mui/material';
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

// --- TEAM DATA (Now Scalable) ---
const teamMembers = [
  { 
    id: 1, 
    name: "Cruz, HC.", 
    role: "Project Lead", 
    initials: "HC",
    gradient: 'linear-gradient(135deg, #0A2540 0%, #008080 100%)',
    github: "https://github.com/clerdee",
    linkedin: "https://www.linkedin.com/in/hanna-clerdee-382066387/",
    email: "clerdeecruz@gmail.com"
  },
  { 
    id: 2, 
    name: "Mallo, GH.", 
    role: "Backend Engineer", 
    initials: "GH",
    gradient: 'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
    github: "https://github.com/nethanmcqinn",
  },
  { 
    id: 3, 
    name: "Laceda, J.", 
    role: "Research Specialist",
    initials: "J",
    gradient: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
    github: "https://github.com/jasonrys25", 
  },
  { 
    id: 4, 
    name: "Cortez, DD.", 
    role: "Data Handler", 
    initials: "DD",
    gradient: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
    github: "https://github.com/drew18-it",
    email: "cortezdrew99@gmail.com"
  },
];

const AboutUs = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F6F9FC' }}>
      <FontStyles />
      <Navbar />

      {/* HEADER */}
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
          <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, mb: 1 }}>
            Innovators. Developers. <br/> 
            <span style={{ color: '#008080' }}>TUP Students.</span>
          </Typography>
        </Container>
      </Box>

      {/* TEAM GRID */}
      <Container maxWidth="xl" sx={{ mt: -10, mb: 10, px: { xs: 2, md: 6 } }}>
        <Grid container spacing={3} justifyContent="center" alignItems="stretch">
          
          {teamMembers.map((member) => (
            <Grid item xs={12} sm={6} md={3} key={member.id} sx={{ display: 'flex' }}>
              
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
                
                {/* HEADER */}
                <Box 
                  sx={{
                    height: '130px',
                    background: member.gradient,
                    position: 'relative',
                    borderRadius: '0 0 50% 50% / 0 0 25px 25px',
                    mb: '50px'
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

                {/* CONTENT */}
                <Box sx={{ px: 2, pb: 4, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0A2540' }}>
                    {member.name.toUpperCase()}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#008080', fontWeight: 600, mb: 2, fontSize: '0.8rem' }}>
                    @{member.role.replace(/\s+/g, '').toLowerCase()}
                  </Typography>
                  
                  {/* SOCIAL ICONS (Dynamic) */}
                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                    
                    {member.github && (
                      <Tooltip title="View GitHub Profile" arrow>
                        <IconButton 
                          size="small"
                          sx={{ color: '#0A2540', '&:hover': { color: '#008080' } }}
                          component="a"
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <GitHubIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {member.linkedin && (
                      <Tooltip title="View LinkedIn Profile" arrow>
                        <IconButton 
                          size="small"
                          sx={{ color: '#0A2540', '&:hover': { color: '#008080' } }}
                          component="a"
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <LinkedInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {member.email && (
                      <Tooltip title={`Send Email to ${member.email}`} arrow>
                        <IconButton 
                          size="small"
                          sx={{ color: '#0A2540', '&:hover': { color: '#008080' } }}
                          component="a"
                          href={`mailto:${member.email}`}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                  </Stack>

                  <Box sx={{ mt: 'auto', minHeight: '60px', display: 'flex', alignItems: 'start', justifyContent: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#556987', fontSize: '0.85rem' }}>
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
