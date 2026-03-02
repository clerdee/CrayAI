import React from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation(); 

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },      
    { label: 'The Red Claw', path: '/red-claw' }, 
  ];

  return (
    <AppBar 
      position="sticky" 
      color="default" 
      elevation={0} 
      sx={{ 
        py: 1, 
        bgcolor: 'rgba(255,255,255,0.90)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
        zIndex: 1100
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          
          {/* --- LOGO SECTION --- */}
          <Box 
            component={Link} 
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              flexGrow: { xs: 1, md: 0 }, 
              mr: 5, 
              cursor: 'pointer',
              textDecoration: 'none' 
            }}
          >
            <img 
              src="/crayfish.png" 
              alt="CrayAI Logo" 
              style={{ height: '42px', width: 'auto' }} 
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                color: '#0A2540', 
                fontWeight: 800, 
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '1.5rem',
                letterSpacing: '-0.5px'
              }}
            >
              CrayAI
            </Typography>
          </Box>

          {/* --- DESKTOP MENU LINKS --- */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 4 }}>
              {menuItems.map((item) => (
                <Button 
                  key={item.label}
                  component={Link}
                  to={item.path}
                  sx={{ 
                    color: location.pathname === item.path ? '#008080' : '#556987', 
                    fontWeight: 600, 
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    textTransform: 'none',
                    fontSize: '1rem',
                    position: 'relative',
                    '&:hover': { 
                      color: '#008080', 
                      bgcolor: 'transparent' 
                    },
                    '&::after': location.pathname === item.path ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 5,
                      left: 10,
                      right: 10,
                      height: '2px',
                      bgcolor: '#008080',
                      borderRadius: '2px'
                    } : {}
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* --- PUBLIC AUTH BUTTONS (ALWAYS VISIBLE) --- */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button 
              component={Link}
              to="/login"  
              sx={{ 
                color: '#0A2540', 
                fontWeight: 700, 
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              Login
            </Button>
            
            <Button 
              component={Link}
              to="/register" 
              variant="contained" 
              sx={{ 
                bgcolor: '#008080',
                color: 'white',
                fontWeight: 700,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                textTransform: 'none',
                borderRadius: '50px',
                px: 3,
                py: 1,
                boxShadow: '0 4px 14px 0 rgba(0,128,128,0.39)',
                '&:hover': { 
                  bgcolor: '#006666', 
                  boxShadow: '0 6px 20px rgba(0,128,128,0.23)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Join Us!
            </Button>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;