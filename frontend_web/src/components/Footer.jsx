import React from 'react';
import { Box, Container, Grid, Typography, Stack, IconButton, Divider } from '@mui/material';
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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

            {/* Added Social Icons to improve visual balance */}
            {/* <Stack direction="row" spacing={1}>
              <IconButton size="small" sx={{ color: '#556987', '&:hover': { color: '#008080' } }}>
                <FacebookIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: '#556987', '&:hover': { color: '#008080' } }}>
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: '#556987', '&:hover': { color: '#008080' } }}>
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: '#556987', '&:hover': { color: '#008080' } }}>
                <LinkedInIcon fontSize="small" />
              </IconButton>
            </Stack> */}
          </Grid>

          {/* COLUMN 1: PLATFORM */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: '#0A2540', letterSpacing: '0.5px' }}>
              PLATFORM
            </Typography>
            <Stack spacing={2}>
              <Typography sx={textStyle}>Mobile Application</Typography>
              <Typography sx={textStyle}>Web Dashboard</Typography>
              <Typography sx={textStyle}>Artificial Intelligence</Typography>
              <Typography sx={textStyle}>Offline Mode</Typography>
            </Stack>
          </Grid>

          {/* COLUMN 2: RESOURCES */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: '#0A2540', letterSpacing: '0.5px' }}>
              RESOURCES
            </Typography>
            <Stack spacing={2}>
              <Typography sx={textStyle}>Community Forum</Typography>
              <Typography sx={textStyle}>The Marketplace</Typography>
              <Typography sx={textStyle}>Farming Guide</Typography>
              <Typography sx={textStyle}>ARC Classification</Typography>
            </Stack>
          </Grid>

          {/* COLUMN 3: CREATORS */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, color: '#0A2540', letterSpacing: '0.5px' }}>
              CREATORS
            </Typography>
            <Stack spacing={2}>
              <Typography sx={textStyle}>Cruz, HC.</Typography>
              <Typography sx={textStyle}>Mallo, GH.</Typography>
              <Typography sx={textStyle}>Laceda, J.</Typography>
              <Typography sx={textStyle}>Cortez, DD.</Typography>
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

const textStyle = {
  color: '#556987', 
  fontSize: '0.9rem', 
  fontWeight: 500
};

export default Footer;