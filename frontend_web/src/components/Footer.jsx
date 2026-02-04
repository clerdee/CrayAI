import React from 'react';
import { Box, Container, Grid, Typography, Link, Stack, IconButton, Divider } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SchoolIcon from '@mui/icons-material/School'; 

const Footer = () => {
  return (
    <Box 
      sx={{ 
        bgcolor: '#F6F9FC', 
        pt: 10, 
        pb: 6, 
        borderTop: '1px solid rgba(0,0,0,0.06)',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5} justifyContent="space-between">
          
          {/* BRAND COLUMN */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <img 
                src="/crayfish.png" 
                alt="CrayAI Logo" 
                style={{ height: '38px', width: 'auto' }} 
              />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0A2540', letterSpacing: '-0.5px' }}>
                CrayAI
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#556987', mb: 3, maxWidth: '320px', lineHeight: 1.6 }}>
              The all-in-one intelligence platform for Australian Red Claw farming. 
              Bridging the gap between aquaculture and artificial intelligence.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              {[FacebookIcon, TwitterIcon, InstagramIcon, LinkedInIcon].map((Icon, index) => (
                <IconButton 
                  key={index} 
                  size="small"
                  sx={{ 
                    color: '#556987', 
                    bgcolor: 'white', 
                    border: '1px solid #E6E8F0',
                    transition: 'all 0.2s',
                    '&:hover': { color: 'white', bgcolor: '#008080', borderColor: '#008080' } 
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* COLUMN 1: PLATFORM (Expanded to fill space) */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: '#0A2540', letterSpacing: '0.5px' }}>PLATFORM</Typography>
            <Stack spacing={1.5}>
              <Link href="#" underline="none" sx={linkStyle}>Mobile Application</Link>
              <Link href="#" underline="none" sx={linkStyle}>Web Dashboard</Link>
              <Link href="#" underline="none" sx={linkStyle}>Artifial Intelligence</Link>
              <Link href="#" underline="none" sx={linkStyle}>Offline Mode</Link>
            </Stack>
          </Grid>

          {/* COLUMN 2: RESOURCES (Your suggestions implemented) */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: '#0A2540', letterSpacing: '0.5px' }}>RESOURCES</Typography>
            <Stack spacing={1.5}>
              <Link href="#" underline="none" sx={linkStyle}>Community Forum</Link>
              <Link href="#" underline="none" sx={linkStyle}>The Marketplace</Link>
              <Link href="#" underline="none" sx={linkStyle}>Farming Guide</Link>
              <Link href="#" underline="none" sx={linkStyle}>ARC Classification</Link>
            </Stack>
          </Grid>

          {/* COLUMN 3: CREATORS (Surname, Initial format) */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: '#0A2540', letterSpacing: '0.5px' }}>CREATORS</Typography>
            <Stack spacing={1.5}>
              {/* REPLACE THESE WITH YOUR ACTUAL NAMES */}
              <Link href="#" underline="none" sx={linkStyle}>Cruz, HC.</Link>
              <Link href="#" underline="none" sx={linkStyle}>Mallo, GH.</Link>
              <Link href="#" underline="none" sx={linkStyle}>Laceda, J.</Link>
              <Link href="#" underline="none" sx={linkStyle}>Cortez, DD.</Link>
            </Stack>
          </Grid>

        </Grid>

        <Divider sx={{ my: 6, borderColor: 'rgba(0,0,0,0.08)' }} />

        {/* STUDENT / UNIVERSITY CREDIT SECTION */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ color: '#008080', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#0A2540', fontWeight: 600 }}>
              Developed by Students of <span style={{ color: '#008080' }}>TUP - Taguig Campus</span>
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#9AA5B1' }}>
            © 2026 CrayAI Systems. All rights reserved.
          </Typography>

        </Box>
      </Container>
    </Box>
  );
};

// Reusable style for links to keep code clean
const linkStyle = {
  color: '#556987', 
  fontSize: '0.9rem', 
  transition: '0.2s', 
  '&:hover': { color: '#008080', transform: 'translateX(5px)' },
  display: 'inline-block'
};

export default Footer;