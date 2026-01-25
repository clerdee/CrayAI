import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeButton from 'rn-swipe-button';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Trigger animations when the screen loads
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Custom component for the Swipe Button thumb (Uses your crayfish logo!)
  const CrayfishThumb = () => (
    <View style={styles.thumbContainer}>
      <Image 
        source={require('../../assets/crayfish.png')} 
        style={styles.thumbImage} 
        resizeMode="contain" 
      />
    </View>
  );

  return (
    <LinearGradient
      colors={['#293241', '#3D5A80']} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* --- ANIMATED CONTENT SECTION --- */}
      <Animated.View 
        style={[
          styles.content, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/crayfish.png')} 
            style={styles.mainLogo} 
            resizeMode="contain" 
          />
        </View>

        <Text style={styles.title}>CRAYAI</Text>
        <Text style={styles.subtitle}>Australian Red Claw Classifier</Text>
        <Text style={styles.description}>
          Leveraging AI to classify, analyze, and monitor the health and growth of Red Claw crayfish.
        </Text>
      </Animated.View>

      {/* --- SWIPE TO START SECTION --- */}
      <Animated.View style={[styles.swipeContainer, { opacity: fadeAnim }]}>
        <SwipeButton
          title="Swipe to Start"
          titleColor="#FFFFFF"
          titleFontSize={16}
          titleStyles={{ fontWeight: '800', letterSpacing: 1 }}
          height={60}
          width={width * 0.8}
          railBackgroundColor="rgba(255, 255, 255, 0.1)"
          railBorderColor="transparent"
          thumbIconBackgroundColor="#EE6C4D"
          thumbIconBorderColor="#EE6C4D"
          thumbIconComponent={CrayfishThumb}
          onSwipeSuccess={() => navigation.navigate('Home')} 
          shouldResetAfterSuccess={true}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 25,
    borderRadius: 80,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainLogo: {
    width: 100,
    height: 100,
    tintColor: '#FFF', 
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 3,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EE6C4D', 
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#B0C4DE',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  swipeContainer: {
    marginBottom: 50, 
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  thumbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: 25,
    height: 25,
    tintColor: '#FFF', 
  }
});